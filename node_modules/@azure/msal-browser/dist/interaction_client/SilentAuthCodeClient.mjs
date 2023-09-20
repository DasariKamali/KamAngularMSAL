/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { PerformanceEvents, Constants, AuthError } from '@azure/msal-common';
import { StandardInteractionClient } from './StandardInteractionClient.mjs';
import { createBrowserAuthError } from '../error/BrowserAuthError.mjs';
import { InteractionType } from '../utils/BrowserConstants.mjs';
import { SilentHandler } from '../interaction_handler/SilentHandler.mjs';
import { HybridSpaAuthorizationCodeClient } from './HybridSpaAuthorizationCodeClient.mjs';
import { authCodeRequired, silentLogoutUnsupported } from '../error/BrowserAuthErrorCodes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class SilentAuthCodeClient extends StandardInteractionClient {
    constructor(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, apiId, performanceClient, nativeMessageHandler, correlationId) {
        super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, nativeMessageHandler, correlationId);
        this.apiId = apiId;
    }
    /**
     * Acquires a token silently by redeeming an authorization code against the /token endpoint
     * @param request
     */
    async acquireToken(request) {
        this.logger.trace("SilentAuthCodeClient.acquireToken called");
        // Auth code payload is required
        if (!request.code) {
            throw createBrowserAuthError(authCodeRequired);
        }
        // Create silent request
        this.performanceClient.setPreQueueTime(PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest, request.correlationId);
        const silentRequest = await this.initializeAuthorizationRequest(request, InteractionType.Silent);
        this.browserStorage.updateCacheEntries(silentRequest.state, silentRequest.nonce, silentRequest.authority, silentRequest.loginHint || Constants.EMPTY_STRING, silentRequest.account || null);
        const serverTelemetryManager = this.initializeServerTelemetryManager(this.apiId);
        try {
            // Create auth code request (PKCE not needed)
            const authCodeRequest = {
                ...silentRequest,
                code: request.code,
            };
            // Initialize the client
            this.performanceClient.setPreQueueTime(PerformanceEvents.StandardInteractionClientGetClientConfiguration, request.correlationId);
            const clientConfig = await this.getClientConfiguration(serverTelemetryManager, silentRequest.authority);
            const authClient = new HybridSpaAuthorizationCodeClient(clientConfig);
            this.logger.verbose("Auth code client created");
            // Create silent handler
            const silentHandler = new SilentHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.config.system, this.performanceClient);
            // Handle auth code parameters from request
            return silentHandler.handleCodeResponseFromServer({
                code: request.code,
                msgraph_host: request.msGraphHost,
                cloud_graph_host_name: request.cloudGraphHostName,
                cloud_instance_host_name: request.cloudInstanceHostName,
            }, silentRequest.state, authClient.authority, this.networkClient, false);
        }
        catch (e) {
            if (e instanceof AuthError) {
                e.setCorrelationId(this.correlationId);
                serverTelemetryManager.cacheFailedRequest(e);
            }
            this.browserStorage.cleanRequestByState(silentRequest.state);
            throw e;
        }
    }
    /**
     * Currently Unsupported
     */
    logout() {
        // Synchronous so we must reject
        return Promise.reject(createBrowserAuthError(silentLogoutUnsupported));
    }
}

export { SilentAuthCodeClient };
//# sourceMappingURL=SilentAuthCodeClient.mjs.map
