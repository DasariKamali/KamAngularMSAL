/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { PerformanceEvents, PromptValue, invokeAsync, Constants, AuthError, UrlString, ProtocolUtils } from '@azure/msal-common';
import { StandardInteractionClient } from './StandardInteractionClient.mjs';
import { createBrowserAuthError } from '../error/BrowserAuthError.mjs';
import { InteractionType } from '../utils/BrowserConstants.mjs';
import { SilentHandler } from '../interaction_handler/SilentHandler.mjs';
import { NativeMessageHandler } from '../broker/nativeBroker/NativeMessageHandler.mjs';
import { NativeInteractionClient } from './NativeInteractionClient.mjs';
import { silentPromptValueError, silentLogoutUnsupported, nativeConnectionNotEstablished } from '../error/BrowserAuthErrorCodes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class SilentIframeClient extends StandardInteractionClient {
    constructor(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, apiId, performanceClient, nativeStorageImpl, nativeMessageHandler, correlationId) {
        super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, nativeMessageHandler, correlationId);
        this.apiId = apiId;
        this.nativeStorage = nativeStorageImpl;
    }
    /**
     * Acquires a token silently by opening a hidden iframe to the /authorize endpoint with prompt=none or prompt=no_session
     * @param request
     */
    async acquireToken(request) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.SilentIframeClientAcquireToken, request.correlationId);
        // Check that we have some SSO data
        if (!request.loginHint &&
            !request.sid &&
            (!request.account || !request.account.username)) {
            this.logger.warning("No user hint provided. The authorization server may need more information to complete this request.");
        }
        // Check that prompt is set to none or no_session, throw error if it is set to anything else.
        if (request.prompt &&
            request.prompt !== PromptValue.NONE &&
            request.prompt !== PromptValue.NO_SESSION) {
            throw createBrowserAuthError(silentPromptValueError);
        }
        // Create silent request
        const silentRequest = await invokeAsync(this.initializeAuthorizationRequest.bind(this), PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest, this.logger, this.performanceClient, request.correlationId)({
            ...request,
            prompt: request.prompt || PromptValue.NONE,
        }, InteractionType.Silent);
        this.browserStorage.updateCacheEntries(silentRequest.state, silentRequest.nonce, silentRequest.authority, silentRequest.loginHint || Constants.EMPTY_STRING, silentRequest.account || null);
        const serverTelemetryManager = this.initializeServerTelemetryManager(this.apiId);
        try {
            // Initialize the client
            const authClient = await invokeAsync(this.createAuthCodeClient.bind(this), PerformanceEvents.StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, request.correlationId)(serverTelemetryManager, silentRequest.authority, silentRequest.azureCloudOptions);
            return await invokeAsync(this.silentTokenHelper.bind(this), PerformanceEvents.SilentIframeClientTokenHelper, this.logger, this.performanceClient, request.correlationId)(authClient, silentRequest);
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
    /**
     * Helper which acquires an authorization code silently using a hidden iframe from given url
     * using the scopes requested as part of the id, and exchanges the code for a set of OAuth tokens.
     * @param navigateUrl
     * @param userRequestScopes
     */
    async silentTokenHelper(authClient, silentRequest) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.SilentIframeClientTokenHelper, silentRequest.correlationId);
        // Create auth code request and generate PKCE params
        const authCodeRequest = await invokeAsync(this.initializeAuthorizationCodeRequest.bind(this), PerformanceEvents.StandardInteractionClientInitializeAuthorizationCodeRequest, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest);
        // Create authorize request url
        const navigateUrl = await invokeAsync(authClient.getAuthCodeUrl.bind(authClient), PerformanceEvents.GetAuthCodeUrl, this.logger, this.performanceClient, silentRequest.correlationId)({
            ...silentRequest,
            nativeBroker: NativeMessageHandler.isNativeAvailable(this.config, this.logger, this.nativeMessageHandler, silentRequest.authenticationScheme),
        });
        // Create silent handler
        const silentHandler = new SilentHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.config.system, this.performanceClient);
        // Get the frame handle for the silent request
        const msalFrame = await invokeAsync(silentHandler.initiateAuthRequest.bind(silentHandler), PerformanceEvents.SilentHandlerInitiateAuthRequest, this.logger, this.performanceClient, silentRequest.correlationId)(navigateUrl);
        // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
        const hash = await invokeAsync(silentHandler.monitorIframeForHash.bind(silentHandler), PerformanceEvents.SilentHandlerInitiateAuthRequest, this.logger, this.performanceClient, silentRequest.correlationId)(msalFrame, this.config.system.iframeHashTimeout);
        // Deserialize hash fragment response parameters.
        const serverParams = UrlString.getDeserializedHash(hash);
        const state = this.validateAndExtractStateFromHash(serverParams, InteractionType.Silent, authCodeRequest.correlationId);
        if (serverParams.accountId) {
            this.logger.verbose("Account id found in hash, calling WAM for token");
            if (!this.nativeMessageHandler) {
                throw createBrowserAuthError(nativeConnectionNotEstablished);
            }
            const nativeInteractionClient = new NativeInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.apiId, this.performanceClient, this.nativeMessageHandler, serverParams.accountId, this.browserStorage, this.correlationId);
            const { userRequestState } = ProtocolUtils.parseRequestState(this.browserCrypto, state);
            return invokeAsync(nativeInteractionClient.acquireToken.bind(nativeInteractionClient), PerformanceEvents.NativeInteractionClientAcquireToken, this.logger, this.performanceClient, silentRequest.correlationId)({
                ...silentRequest,
                state: userRequestState,
                prompt: silentRequest.prompt || PromptValue.NONE,
            }).finally(() => {
                this.browserStorage.cleanRequestByState(state);
            });
        }
        // Handle response from hash string
        return invokeAsync(silentHandler.handleCodeResponseFromHash.bind(silentHandler), PerformanceEvents.HandleCodeResponseFromHash, this.logger, this.performanceClient, silentRequest.correlationId)(hash, state, authClient.authority, this.networkClient);
    }
}

export { SilentIframeClient };
//# sourceMappingURL=SilentIframeClient.mjs.map
