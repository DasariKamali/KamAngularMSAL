/*! @azure/msal-common v14.0.3 2023-09-05 */
'use strict';
import { isOidcProtocolMode } from '../config/ClientConfiguration.mjs';
import { BaseClient } from './BaseClient.mjs';
import { RequestParameterBuilder } from '../request/RequestParameterBuilder.mjs';
import { GrantType, AuthenticationScheme, HeaderNames, Errors } from '../utils/Constants.mjs';
import { ResponseHandler } from '../response/ResponseHandler.mjs';
import { PopTokenGenerator } from '../crypto/PopTokenGenerator.mjs';
import { StringUtils } from '../utils/StringUtils.mjs';
import { ClientConfigurationError } from '../error/ClientConfigurationError.mjs';
import { ClientAuthError } from '../error/ClientAuthError.mjs';
import { ServerError } from '../error/ServerError.mjs';
import { TimeUtils } from '../utils/TimeUtils.mjs';
import { UrlString } from '../url/UrlString.mjs';
import { CcsCredentialType } from '../account/CcsCredential.mjs';
import { buildClientInfoFromHomeAccountId } from '../account/ClientInfo.mjs';
import { InteractionRequiredAuthError, InteractionRequiredAuthErrorMessage } from '../error/InteractionRequiredAuthError.mjs';
import { PerformanceEvents } from '../telemetry/performance/PerformanceEvent.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * OAuth2.0 refresh token client
 * @internal
 */
class RefreshTokenClient extends BaseClient {
    constructor(configuration, performanceClient) {
        super(configuration, performanceClient);
    }
    async acquireToken(request) {
        this.performanceClient?.addQueueMeasurement(PerformanceEvents.RefreshTokenClientAcquireToken, request.correlationId);
        const atsMeasurement = this.performanceClient?.startMeasurement(PerformanceEvents.RefreshTokenClientAcquireToken, request.correlationId);
        this.logger.verbose("RefreshTokenClientAcquireToken called", request.correlationId);
        const reqTimestamp = TimeUtils.nowSeconds();
        this.performanceClient?.setPreQueueTime(PerformanceEvents.RefreshTokenClientExecuteTokenRequest, request.correlationId);
        const response = await this.executeTokenRequest(request, this.authority);
        // Retrieve requestId from response headers
        const requestId = response.headers?.[HeaderNames.X_MS_REQUEST_ID];
        const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.config.serializableCache, this.config.persistencePlugin);
        responseHandler.validateTokenResponse(response.body);
        this.performanceClient?.setPreQueueTime(PerformanceEvents.HandleServerTokenResponse, request.correlationId);
        return responseHandler
            .handleServerTokenResponse(response.body, this.authority, reqTimestamp, request, undefined, undefined, true, request.forceCache, requestId)
            .then((result) => {
            atsMeasurement?.end({
                success: true,
            });
            return result;
        })
            .catch((error) => {
            this.logger.verbose("Error in fetching refresh token", request.correlationId);
            atsMeasurement?.end({
                errorCode: error.errorCode,
                subErrorCode: error.subError,
                success: false,
            });
            throw error;
        });
    }
    /**
     * Gets cached refresh token and attaches to request, then calls acquireToken API
     * @param request
     */
    async acquireTokenByRefreshToken(request) {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }
        this.performanceClient?.addQueueMeasurement(PerformanceEvents.RefreshTokenClientAcquireTokenByRefreshToken, request.correlationId);
        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        }
        // try checking if FOCI is enabled for the given application
        const isFOCI = this.cacheManager.isAppMetadataFOCI(request.account.environment);
        // if the app is part of the family, retrive a Family refresh token if present and make a refreshTokenRequest
        if (isFOCI) {
            try {
                this.performanceClient?.setPreQueueTime(PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken, request.correlationId);
                return this.acquireTokenWithCachedRefreshToken(request, true);
            }
            catch (e) {
                const noFamilyRTInCache = e instanceof InteractionRequiredAuthError &&
                    e.errorCode ===
                        InteractionRequiredAuthErrorMessage.noTokensFoundError
                            .code;
                const clientMismatchErrorWithFamilyRT = e instanceof ServerError &&
                    e.errorCode === Errors.INVALID_GRANT_ERROR &&
                    e.subError === Errors.CLIENT_MISMATCH_ERROR;
                // if family Refresh Token (FRT) cache acquisition fails or if client_mismatch error is seen with FRT, reattempt with application Refresh Token (ART)
                if (noFamilyRTInCache || clientMismatchErrorWithFamilyRT) {
                    this.performanceClient?.setPreQueueTime(PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken, request.correlationId);
                    return this.acquireTokenWithCachedRefreshToken(request, false);
                    // throw in all other cases
                }
                else {
                    throw e;
                }
            }
        }
        // fall back to application refresh token acquisition
        this.performanceClient?.setPreQueueTime(PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken, request.correlationId);
        return this.acquireTokenWithCachedRefreshToken(request, false);
    }
    /**
     * makes a network call to acquire tokens by exchanging RefreshToken available in userCache; throws if refresh token is not cached
     * @param request
     */
    async acquireTokenWithCachedRefreshToken(request, foci) {
        this.performanceClient?.addQueueMeasurement(PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken, request.correlationId);
        // fetches family RT or application RT based on FOCI value
        const atsMeasurement = this.performanceClient?.startMeasurement(PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken, request.correlationId);
        this.logger.verbose("RefreshTokenClientAcquireTokenWithCachedRefreshToken called", request.correlationId);
        const refreshToken = this.cacheManager.getRefreshToken(request.account, foci);
        if (!refreshToken) {
            atsMeasurement?.discard();
            throw InteractionRequiredAuthError.createNoTokensFoundError();
        }
        // attach cached RT size to the current measurement
        atsMeasurement?.end({
            success: true,
        });
        const refreshTokenRequest = {
            ...request,
            refreshToken: refreshToken.secret,
            authenticationScheme: request.authenticationScheme || AuthenticationScheme.BEARER,
            ccsCredential: {
                credential: request.account.homeAccountId,
                type: CcsCredentialType.HOME_ACCOUNT_ID,
            },
        };
        this.performanceClient?.setPreQueueTime(PerformanceEvents.RefreshTokenClientAcquireToken, request.correlationId);
        return this.acquireToken(refreshTokenRequest);
    }
    /**
     * Constructs the network message and makes a NW call to the underlying secure token service
     * @param request
     * @param authority
     */
    async executeTokenRequest(request, authority) {
        this.performanceClient?.addQueueMeasurement(PerformanceEvents.RefreshTokenClientExecuteTokenRequest, request.correlationId);
        const acquireTokenMeasurement = this.performanceClient?.startMeasurement(PerformanceEvents.RefreshTokenClientExecuteTokenRequest, request.correlationId);
        this.performanceClient?.setPreQueueTime(PerformanceEvents.RefreshTokenClientCreateTokenRequestBody, request.correlationId);
        const queryParametersString = this.createTokenQueryParameters(request);
        const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString);
        const requestBody = await this.createTokenRequestBody(request);
        const headers = this.createTokenRequestHeaders(request.ccsCredential);
        const thumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: authority.canonicalAuthority,
            scopes: request.scopes,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid,
        };
        return this.executePostToTokenEndpoint(endpoint, requestBody, headers, thumbprint, request.correlationId)
            .then((result) => {
            acquireTokenMeasurement?.end({
                success: true,
            });
            return result;
        })
            .catch((error) => {
            acquireTokenMeasurement?.end({
                success: false,
            });
            throw error;
        });
    }
    /**
     * Helper function to create the token request body
     * @param request
     */
    async createTokenRequestBody(request) {
        this.performanceClient?.addQueueMeasurement(PerformanceEvents.RefreshTokenClientCreateTokenRequestBody, request.correlationId);
        const correlationId = request.correlationId;
        const acquireTokenMeasurement = this.performanceClient?.startMeasurement(PerformanceEvents.BaseClientCreateTokenRequestHeaders, correlationId);
        const parameterBuilder = new RequestParameterBuilder();
        parameterBuilder.addClientId(this.config.authOptions.clientId);
        parameterBuilder.addScopes(request.scopes, true, this.config.authOptions.authority.options.OIDCOptions?.defaultScopes);
        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);
        parameterBuilder.addClientInfo();
        parameterBuilder.addLibraryInfo(this.config.libraryInfo);
        parameterBuilder.addApplicationTelemetry(this.config.telemetry.application);
        parameterBuilder.addThrottling();
        if (this.serverTelemetryManager && !isOidcProtocolMode(this.config)) {
            parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
        }
        parameterBuilder.addCorrelationId(correlationId);
        parameterBuilder.addRefreshToken(request.refreshToken);
        if (this.config.clientCredentials.clientSecret) {
            parameterBuilder.addClientSecret(this.config.clientCredentials.clientSecret);
        }
        if (this.config.clientCredentials.clientAssertion) {
            const clientAssertion = this.config.clientCredentials.clientAssertion;
            parameterBuilder.addClientAssertion(clientAssertion.assertion);
            parameterBuilder.addClientAssertionType(clientAssertion.assertionType);
        }
        if (request.authenticationScheme === AuthenticationScheme.POP) {
            const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils, this.performanceClient);
            this.performanceClient?.setPreQueueTime(PerformanceEvents.PopTokenGenerateCnf, request.correlationId);
            const reqCnfData = await popTokenGenerator.generateCnf(request);
            // SPA PoP requires full Base64Url encoded req_cnf string (unhashed)
            parameterBuilder.addPopToken(reqCnfData.reqCnfString);
        }
        else if (request.authenticationScheme === AuthenticationScheme.SSH) {
            if (request.sshJwk) {
                parameterBuilder.addSshJwk(request.sshJwk);
            }
            else {
                acquireTokenMeasurement?.end({
                    success: false,
                });
                throw ClientConfigurationError.createMissingSshJwkError();
            }
        }
        if (!StringUtils.isEmptyObj(request.claims) ||
            (this.config.authOptions.clientCapabilities &&
                this.config.authOptions.clientCapabilities.length > 0)) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }
        if (this.config.systemOptions.preventCorsPreflight &&
            request.ccsCredential) {
            switch (request.ccsCredential.type) {
                case CcsCredentialType.HOME_ACCOUNT_ID:
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(request.ccsCredential.credential);
                        parameterBuilder.addCcsOid(clientInfo);
                    }
                    catch (e) {
                        this.logger.verbose("Could not parse home account ID for CCS Header: " +
                            e);
                    }
                    break;
                case CcsCredentialType.UPN:
                    parameterBuilder.addCcsUpn(request.ccsCredential.credential);
                    break;
            }
        }
        acquireTokenMeasurement?.end({
            success: true,
        });
        return parameterBuilder.createQueryString();
    }
}

export { RefreshTokenClient };
//# sourceMappingURL=RefreshTokenClient.mjs.map
