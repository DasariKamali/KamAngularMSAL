/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { StandardInteractionClient } from './StandardInteractionClient.mjs';
import { PerformanceEvents, RefreshTokenClient } from '@azure/msal-common';
import { ApiId } from '../utils/BrowserConstants.mjs';
import { createBrowserAuthError } from '../error/BrowserAuthError.mjs';
import { silentLogoutUnsupported } from '../error/BrowserAuthErrorCodes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class SilentRefreshClient extends StandardInteractionClient {
    /**
     * Exchanges the refresh token for new tokens
     * @param request
     */
    async acquireToken(request) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.SilentRefreshClientAcquireToken, request.correlationId);
        this.performanceClient.setPreQueueTime(PerformanceEvents.InitializeBaseRequest, request.correlationId);
        const silentRequest = {
            ...request,
            ...(await this.initializeBaseRequest(request, request.account)),
        };
        const acquireTokenMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.SilentRefreshClientAcquireToken, silentRequest.correlationId);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow);
        const refreshTokenClient = await this.createRefreshTokenClient(serverTelemetryManager, silentRequest.authority, silentRequest.azureCloudOptions);
        this.logger.verbose("Refresh token client created");
        // Send request to renew token. Auth module will throw errors if token cannot be renewed.
        this.performanceClient.setPreQueueTime(PerformanceEvents.RefreshTokenClientAcquireTokenByRefreshToken, request.correlationId);
        return refreshTokenClient
            .acquireTokenByRefreshToken(silentRequest)
            .then((result) => result)
            .then((result) => {
            acquireTokenMeasurement.end({
                success: true,
                fromCache: result.fromCache,
                requestId: result.requestId,
            });
            return result;
        })
            .catch((e) => {
            e.setCorrelationId(this.correlationId);
            serverTelemetryManager.cacheFailedRequest(e);
            acquireTokenMeasurement.end({
                errorCode: e.errorCode,
                subErrorCode: e.subError,
                success: false,
            });
            throw e;
        });
    }
    /**
     * Currently Unsupported
     */
    logout() {
        // Synchronous so we must reject
        return Promise.reject(createBrowserAuthError(silentLogoutUnsupported));
    }
    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    async createRefreshTokenClient(serverTelemetryManager, authorityUrl, azureCloudOptions) {
        // Create auth module.
        this.performanceClient.setPreQueueTime(PerformanceEvents.StandardInteractionClientGetClientConfiguration, this.correlationId);
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl, azureCloudOptions);
        return new RefreshTokenClient(clientConfig, this.performanceClient);
    }
}

export { SilentRefreshClient };
//# sourceMappingURL=SilentRefreshClient.mjs.map
