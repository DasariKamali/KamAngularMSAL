/*! @azure/msal-common v14.0.3 2023-09-05 */
'use strict';
import { BaseClient } from './BaseClient.mjs';
import { TimeUtils } from '../utils/TimeUtils.mjs';
import { RefreshTokenClient } from './RefreshTokenClient.mjs';
import { ClientAuthError, ClientAuthErrorMessage } from '../error/ClientAuthError.mjs';
import { ClientConfigurationError } from '../error/ClientConfigurationError.mjs';
import { ResponseHandler } from '../response/ResponseHandler.mjs';
import { CacheOutcome } from '../utils/Constants.mjs';
import { StringUtils } from '../utils/StringUtils.mjs';
import { extractTokenClaims, checkMaxAge } from '../account/AuthToken.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/** @internal */
class SilentFlowClient extends BaseClient {
    constructor(configuration, performanceClient) {
        super(configuration, performanceClient);
    }
    /**
     * Retrieves a token from cache if it is still valid, or uses the cached refresh token to renew
     * the given token and returns the renewed token
     * @param request
     */
    async acquireToken(request) {
        try {
            return await this.acquireCachedToken(request);
        }
        catch (e) {
            if (e instanceof ClientAuthError &&
                e.errorCode === ClientAuthErrorMessage.tokenRefreshRequired.code) {
                const refreshTokenClient = new RefreshTokenClient(this.config, this.performanceClient);
                return refreshTokenClient.acquireTokenByRefreshToken(request);
            }
            else {
                throw e;
            }
        }
    }
    /**
     * Retrieves token from cache or throws an error if it must be refreshed.
     * @param request
     */
    async acquireCachedToken(request) {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }
        if (request.forceRefresh) {
            // Must refresh due to present force_refresh flag.
            this.serverTelemetryManager?.setCacheOutcome(CacheOutcome.FORCE_REFRESH);
            this.logger.info("SilentFlowClient:acquireCachedToken - Skipping cache because forceRefresh is true.");
            throw ClientAuthError.createRefreshRequiredError();
        }
        else if (!this.config.cacheOptions.claimsBasedCachingEnabled &&
            !StringUtils.isEmptyObj(request.claims)) {
            // Must refresh due to request parameters.
            this.logger.info("SilentFlowClient:acquireCachedToken - Skipping cache because claims-based caching is disabled and claims were requested.");
            throw ClientAuthError.createRefreshRequiredError();
        }
        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        }
        const environment = request.authority || this.authority.getPreferredCache();
        const cacheRecord = this.cacheManager.readCacheRecord(request.account, request, environment);
        if (!cacheRecord.accessToken) {
            // Must refresh due to non-existent access_token.
            this.serverTelemetryManager?.setCacheOutcome(CacheOutcome.NO_CACHED_ACCESS_TOKEN);
            this.logger.info("SilentFlowClient:acquireCachedToken - No access token found in cache for the given properties.");
            throw ClientAuthError.createRefreshRequiredError();
        }
        else if (TimeUtils.wasClockTurnedBack(cacheRecord.accessToken.cachedAt) ||
            TimeUtils.isTokenExpired(cacheRecord.accessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
            // Must refresh due to expired access_token.
            this.serverTelemetryManager?.setCacheOutcome(CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED);
            this.logger.info(`SilentFlowClient:acquireCachedToken - Cached access token is expired or will expire within ${this.config.systemOptions.tokenRenewalOffsetSeconds} seconds.`);
            throw ClientAuthError.createRefreshRequiredError();
        }
        else if (cacheRecord.accessToken.refreshOn &&
            TimeUtils.isTokenExpired(cacheRecord.accessToken.refreshOn, 0)) {
            // Must refresh due to the refresh_in value.
            this.serverTelemetryManager?.setCacheOutcome(CacheOutcome.REFRESH_CACHED_ACCESS_TOKEN);
            this.logger.info("SilentFlowClient:acquireCachedToken - Cached access token's refreshOn property has been exceeded'.");
            throw ClientAuthError.createRefreshRequiredError();
        }
        if (this.config.serverTelemetryManager) {
            this.config.serverTelemetryManager.incrementCacheHits();
        }
        return await this.generateResultFromCacheRecord(cacheRecord, request);
    }
    /**
     * Helper function to build response object from the CacheRecord
     * @param cacheRecord
     */
    async generateResultFromCacheRecord(cacheRecord, request) {
        let idTokenClaims;
        if (cacheRecord.idToken) {
            idTokenClaims = extractTokenClaims(cacheRecord.idToken.secret, this.config.cryptoInterface.base64Decode);
        }
        // token max_age check
        if (request.maxAge || request.maxAge === 0) {
            const authTime = idTokenClaims?.auth_time;
            if (!authTime) {
                throw ClientAuthError.createAuthTimeNotFoundError();
            }
            checkMaxAge(authTime, request.maxAge);
        }
        return await ResponseHandler.generateAuthenticationResult(this.cryptoUtils, this.authority, cacheRecord, true, request, idTokenClaims);
    }
}

export { SilentFlowClient };
//# sourceMappingURL=SilentFlowClient.mjs.map
