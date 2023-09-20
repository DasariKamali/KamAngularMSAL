/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { PerformanceEvents, Constants, UrlString, AuthorizationCodeClient, Authority, AuthorityFactory, ProtocolUtils } from '@azure/msal-common';
import { BaseInteractionClient } from './BaseInteractionClient.mjs';
import { BrowserConstants } from '../utils/BrowserConstants.mjs';
import { version } from '../packageMetadata.mjs';
import { createBrowserAuthError } from '../error/BrowserAuthError.mjs';
import { BrowserProtocolUtils } from '../utils/BrowserProtocolUtils.mjs';
import { BrowserUtils } from '../utils/BrowserUtils.mjs';
import { noStateInHash, unableToParseState, stateInteractionTypeMismatch } from '../error/BrowserAuthErrorCodes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * Defines the class structure and helper functions used by the "standard", non-brokered auth flows (popup, redirect, silent (RT), silent (iframe))
 */
class StandardInteractionClient extends BaseInteractionClient {
    /**
     * Generates an auth code request tied to the url request.
     * @param request
     */
    async initializeAuthorizationCodeRequest(request) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.StandardInteractionClientInitializeAuthorizationCodeRequest, request.correlationId);
        this.logger.verbose("initializeAuthorizationRequest called", request.correlationId);
        const generatedPkceParams = await this.browserCrypto.generatePkceCodes();
        const authCodeRequest = {
            ...request,
            redirectUri: request.redirectUri,
            code: Constants.EMPTY_STRING,
            codeVerifier: generatedPkceParams.verifier,
        };
        request.codeChallenge = generatedPkceParams.challenge;
        request.codeChallengeMethod = Constants.S256_CODE_CHALLENGE_METHOD;
        return authCodeRequest;
    }
    /**
     * Initializer for the logout request.
     * @param logoutRequest
     */
    initializeLogoutRequest(logoutRequest) {
        this.logger.verbose("initializeLogoutRequest called", logoutRequest?.correlationId);
        const validLogoutRequest = {
            correlationId: this.correlationId || this.browserCrypto.createNewGuid(),
            ...logoutRequest,
        };
        /**
         * Set logout_hint to be login_hint from ID Token Claims if present
         * and logoutHint attribute wasn't manually set in logout request
         */
        if (logoutRequest) {
            // If logoutHint isn't set and an account was passed in, try to extract logoutHint from ID Token Claims
            if (!logoutRequest.logoutHint) {
                if (logoutRequest.account) {
                    const logoutHint = this.getLogoutHintFromIdTokenClaims(logoutRequest.account);
                    if (logoutHint) {
                        this.logger.verbose("Setting logoutHint to login_hint ID Token Claim value for the account provided");
                        validLogoutRequest.logoutHint = logoutHint;
                    }
                }
                else {
                    this.logger.verbose("logoutHint was not set and account was not passed into logout request, logoutHint will not be set");
                }
            }
            else {
                this.logger.verbose("logoutHint has already been set in logoutRequest");
            }
        }
        else {
            this.logger.verbose("logoutHint will not be set since no logout request was configured");
        }
        /*
         * Only set redirect uri if logout request isn't provided or the set uri isn't null.
         * Otherwise, use passed uri, config, or current page.
         */
        if (!logoutRequest || logoutRequest.postLogoutRedirectUri !== null) {
            if (logoutRequest && logoutRequest.postLogoutRedirectUri) {
                this.logger.verbose("Setting postLogoutRedirectUri to uri set on logout request", validLogoutRequest.correlationId);
                validLogoutRequest.postLogoutRedirectUri =
                    UrlString.getAbsoluteUrl(logoutRequest.postLogoutRedirectUri, BrowserUtils.getCurrentUri());
            }
            else if (this.config.auth.postLogoutRedirectUri === null) {
                this.logger.verbose("postLogoutRedirectUri configured as null and no uri set on request, not passing post logout redirect", validLogoutRequest.correlationId);
            }
            else if (this.config.auth.postLogoutRedirectUri) {
                this.logger.verbose("Setting postLogoutRedirectUri to configured uri", validLogoutRequest.correlationId);
                validLogoutRequest.postLogoutRedirectUri =
                    UrlString.getAbsoluteUrl(this.config.auth.postLogoutRedirectUri, BrowserUtils.getCurrentUri());
            }
            else {
                this.logger.verbose("Setting postLogoutRedirectUri to current page", validLogoutRequest.correlationId);
                validLogoutRequest.postLogoutRedirectUri =
                    UrlString.getAbsoluteUrl(BrowserUtils.getCurrentUri(), BrowserUtils.getCurrentUri());
            }
        }
        else {
            this.logger.verbose("postLogoutRedirectUri passed as null, not setting post logout redirect uri", validLogoutRequest.correlationId);
        }
        return validLogoutRequest;
    }
    /**
     * Parses login_hint ID Token Claim out of AccountInfo object to be used as
     * logout_hint in end session request.
     * @param account
     */
    getLogoutHintFromIdTokenClaims(account) {
        const idTokenClaims = account.idTokenClaims;
        if (idTokenClaims) {
            if (idTokenClaims.login_hint) {
                return idTokenClaims.login_hint;
            }
            else {
                this.logger.verbose("The ID Token Claims tied to the provided account do not contain a login_hint claim, logoutHint will not be added to logout request");
            }
        }
        else {
            this.logger.verbose("The provided account does not contain ID Token Claims, logoutHint will not be added to logout request");
        }
        return null;
    }
    /**
     * Creates an Authorization Code Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    async createAuthCodeClient(serverTelemetryManager, authorityUrl, requestAzureCloudOptions) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.StandardInteractionClientCreateAuthCodeClient, this.correlationId);
        // Create auth module.
        this.performanceClient.setPreQueueTime(PerformanceEvents.StandardInteractionClientGetClientConfiguration, this.correlationId);
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl, requestAzureCloudOptions);
        return new AuthorizationCodeClient(clientConfig, this.performanceClient);
    }
    /**
     * Creates a Client Configuration object with the given request authority, or the default authority.
     * @param serverTelemetryManager
     * @param requestAuthority
     * @param requestCorrelationId
     */
    async getClientConfiguration(serverTelemetryManager, requestAuthority, requestAzureCloudOptions) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.StandardInteractionClientGetClientConfiguration, this.correlationId);
        this.logger.verbose("getClientConfiguration called", this.correlationId);
        this.performanceClient.setPreQueueTime(PerformanceEvents.StandardInteractionClientGetDiscoveredAuthority, this.correlationId);
        const discoveredAuthority = await this.getDiscoveredAuthority(requestAuthority, requestAzureCloudOptions);
        const logger = this.config.system.loggerOptions;
        return {
            authOptions: {
                clientId: this.config.auth.clientId,
                authority: discoveredAuthority,
                clientCapabilities: this.config.auth.clientCapabilities,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds: this.config.system.tokenRenewalOffsetSeconds,
                preventCorsPreflight: true,
            },
            loggerOptions: {
                loggerCallback: logger.loggerCallback,
                piiLoggingEnabled: logger.piiLoggingEnabled,
                logLevel: logger.logLevel,
                correlationId: this.correlationId,
            },
            cacheOptions: {
                claimsBasedCachingEnabled: this.config.cache.claimsBasedCachingEnabled,
            },
            cryptoInterface: this.browserCrypto,
            networkInterface: this.networkClient,
            storageInterface: this.browserStorage,
            serverTelemetryManager: serverTelemetryManager,
            libraryInfo: {
                sku: BrowserConstants.MSAL_SKU,
                version: version,
                cpu: Constants.EMPTY_STRING,
                os: Constants.EMPTY_STRING,
            },
            telemetry: this.config.telemetry,
        };
    }
    /**
     * @param hash
     * @param interactionType
     */
    validateAndExtractStateFromHash(serverParams, interactionType, requestCorrelationId) {
        this.logger.verbose("validateAndExtractStateFromHash called", requestCorrelationId);
        if (!serverParams.state) {
            throw createBrowserAuthError(noStateInHash);
        }
        const platformStateObj = BrowserProtocolUtils.extractBrowserRequestState(this.browserCrypto, serverParams.state);
        if (!platformStateObj) {
            throw createBrowserAuthError(unableToParseState);
        }
        if (platformStateObj.interactionType !== interactionType) {
            throw createBrowserAuthError(stateInteractionTypeMismatch);
        }
        this.logger.verbose("Returning state from hash", requestCorrelationId);
        return serverParams.state;
    }
    /**
     * Used to get a discovered version of the default authority.
     * @param requestAuthority
     * @param requestCorrelationId
     */
    async getDiscoveredAuthority(requestAuthority, requestAzureCloudOptions) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.StandardInteractionClientGetDiscoveredAuthority, this.correlationId);
        this.logger.verbose("getDiscoveredAuthority called", this.correlationId);
        const getAuthorityMeasurement = this.performanceClient?.startMeasurement(PerformanceEvents.StandardInteractionClientGetDiscoveredAuthority, this.correlationId);
        const authorityOptions = {
            protocolMode: this.config.auth.protocolMode,
            OIDCOptions: this.config.auth.OIDCOptions,
            knownAuthorities: this.config.auth.knownAuthorities,
            cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
            authorityMetadata: this.config.auth.authorityMetadata,
            skipAuthorityMetadataCache: this.config.auth.skipAuthorityMetadataCache,
        };
        // build authority string based on auth params, precedence - azureCloudInstance + tenant >> authority
        const userAuthority = requestAuthority
            ? requestAuthority
            : this.config.auth.authority;
        // fall back to the authority from config
        const builtAuthority = Authority.generateAuthority(userAuthority, requestAzureCloudOptions || this.config.auth.azureCloudOptions);
        this.logger.verbose("Creating discovered authority with configured authority", this.correlationId);
        this.performanceClient.setPreQueueTime(PerformanceEvents.AuthorityFactoryCreateDiscoveredInstance, this.correlationId);
        return await AuthorityFactory.createDiscoveredInstance(builtAuthority, this.config.system.networkClient, this.browserStorage, authorityOptions, this.logger, this.performanceClient, this.correlationId)
            .then((result) => {
            getAuthorityMeasurement.end({
                success: true,
            });
            return result;
        })
            .catch((error) => {
            getAuthorityMeasurement.end({
                errorCode: error.errorCode,
                subErrorCode: error.subError,
                success: false,
            });
            throw error;
        });
    }
    /**
     * Helper to initialize required request parameters for interactive APIs and ssoSilent()
     * @param request
     * @param interactionType
     */
    async initializeAuthorizationRequest(request, interactionType) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest, this.correlationId);
        this.logger.verbose("initializeAuthorizationRequest called", this.correlationId);
        const redirectUri = this.getRedirectUri(request.redirectUri);
        const browserState = {
            interactionType: interactionType,
        };
        const state = ProtocolUtils.setRequestState(this.browserCrypto, (request && request.state) || Constants.EMPTY_STRING, browserState);
        this.performanceClient.setPreQueueTime(PerformanceEvents.InitializeBaseRequest, this.correlationId);
        const validatedRequest = {
            ...(await this.initializeBaseRequest(request)),
            redirectUri: redirectUri,
            state: state,
            nonce: request.nonce || this.browserCrypto.createNewGuid(),
            responseMode: this.config.auth.OIDCOptions
                .serverResponseType,
        };
        const account = request.account || this.browserStorage.getActiveAccount();
        if (account) {
            this.logger.verbose("Setting validated request account", this.correlationId);
            this.logger.verbosePii(`Setting validated request account: ${account.homeAccountId}`, this.correlationId);
            validatedRequest.account = account;
        }
        // Check for ADAL/MSAL v1 SSO
        if (!validatedRequest.loginHint && !account) {
            const legacyLoginHint = this.browserStorage.getLegacyLoginHint();
            if (legacyLoginHint) {
                validatedRequest.loginHint = legacyLoginHint;
            }
        }
        return validatedRequest;
    }
}

export { StandardInteractionClient };
//# sourceMappingURL=StandardInteractionClient.mjs.map
