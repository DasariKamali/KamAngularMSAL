/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { StandardInteractionClient } from './StandardInteractionClient.mjs';
import { PerformanceEvents, AuthError, SilentFlowClient } from '@azure/msal-common';
import { ApiId } from '../utils/BrowserConstants.mjs';
import { BrowserAuthError } from '../error/BrowserAuthError.mjs';
import { cryptoKeyNotFound } from '../error/BrowserAuthErrorCodes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class SilentCacheClient extends StandardInteractionClient {
    /**
     * Returns unexpired tokens from the cache, if available
     * @param silentRequest
     */
    async acquireToken(silentRequest) {
        const acquireTokenMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.SilentCacheClientAcquireToken, silentRequest.correlationId);
        // Telemetry manager only used to increment cacheHits here
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow);
        const silentAuthClient = await this.createSilentFlowClient(serverTelemetryManager, silentRequest.authority, silentRequest.azureCloudOptions);
        this.logger.verbose("Silent auth client created");
        try {
            const cachedToken = (await silentAuthClient.acquireCachedToken(silentRequest));
            acquireTokenMeasurement.end({
                success: true,
                fromCache: true,
            });
            return cachedToken;
        }
        catch (error) {
            if (error instanceof BrowserAuthError &&
                error.errorCode === cryptoKeyNotFound) {
                this.logger.verbose("Signing keypair for bound access token not found. Refreshing bound access token and generating a new crypto keypair.");
            }
            acquireTokenMeasurement.end({
                errorCode: (error instanceof AuthError && error.errorCode) ||
                    undefined,
                subErrorCode: (error instanceof AuthError && error.subError) || undefined,
                success: false,
            });
            throw error;
        }
    }
    /**
     * API to silenty clear the browser cache.
     * @param logoutRequest
     */
    logout(logoutRequest) {
        this.logger.verbose("logoutRedirect called");
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        return this.clearCacheOnLogout(validLogoutRequest?.account);
    }
    /**
     * Creates an Silent Flow Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    async createSilentFlowClient(serverTelemetryManager, authorityUrl, azureCloudOptions) {
        // Create auth module.
        this.performanceClient.setPreQueueTime(PerformanceEvents.StandardInteractionClientGetClientConfiguration, this.correlationId);
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl, azureCloudOptions);
        return new SilentFlowClient(clientConfig, this.performanceClient);
    }
    async initializeSilentRequest(request, account) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.InitializeSilentRequest, this.correlationId);
        this.performanceClient.setPreQueueTime(PerformanceEvents.InitializeBaseRequest, this.correlationId);
        return {
            ...request,
            ...(await this.initializeBaseRequest(request, account)),
            account: account,
            forceRefresh: request.forceRefresh || false,
        };
    }
}

export { SilentCacheClient };
//# sourceMappingURL=SilentCacheClient.mjs.map
