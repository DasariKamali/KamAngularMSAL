/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { PerformanceEvents, ClientAuthError, ServerError, invokeAsync, AuthorityFactory } from '@azure/msal-common';
import { createBrowserAuthError } from '../error/BrowserAuthError.mjs';
import { TemporaryCacheKeys } from '../utils/BrowserConstants.mjs';
import { hashEmptyError, userCancelled } from '../error/BrowserAuthErrorCodes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * Abstract class which defines operations for a browser interaction handling class.
 */
class InteractionHandler {
    constructor(authCodeModule, storageImpl, authCodeRequest, logger, performanceClient) {
        this.authModule = authCodeModule;
        this.browserStorage = storageImpl;
        this.authCodeRequest = authCodeRequest;
        this.logger = logger;
        this.performanceClient = performanceClient;
    }
    /**
     * Function to handle response parameters from hash.
     * @param locationHash
     */
    async handleCodeResponseFromHash(locationHash, state, authority, networkModule) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.HandleCodeResponseFromHash, this.authCodeRequest.correlationId);
        this.logger.verbose("InteractionHandler.handleCodeResponse called");
        // Check that location hash isn't empty.
        if (!locationHash) {
            throw createBrowserAuthError(hashEmptyError);
        }
        // Handle code response.
        const stateKey = this.browserStorage.generateStateKey(state);
        const requestState = this.browserStorage.getTemporaryCache(stateKey);
        if (!requestState) {
            throw ClientAuthError.createStateNotFoundError("Cached State");
        }
        let authCodeResponse;
        try {
            authCodeResponse = this.authModule.handleFragmentResponse(locationHash, requestState);
        }
        catch (e) {
            if (e instanceof ServerError &&
                e.subError === userCancelled) {
                // Translate server error caused by user closing native prompt to corresponding first class MSAL error
                throw createBrowserAuthError(userCancelled);
            }
            else {
                throw e;
            }
        }
        this.performanceClient.setPreQueueTime(PerformanceEvents.HandleCodeResponseFromServer, this.authCodeRequest.correlationId);
        return this.handleCodeResponseFromServer(authCodeResponse, state, authority, networkModule);
    }
    /**
     * Process auth code response from AAD
     * @param authCodeResponse
     * @param state
     * @param authority
     * @param networkModule
     * @returns
     */
    async handleCodeResponseFromServer(authCodeResponse, state, authority, networkModule, validateNonce = true) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.HandleCodeResponseFromServer, this.authCodeRequest.correlationId);
        this.logger.trace("InteractionHandler.handleCodeResponseFromServer called");
        // Handle code response.
        const stateKey = this.browserStorage.generateStateKey(state);
        const requestState = this.browserStorage.getTemporaryCache(stateKey);
        if (!requestState) {
            throw ClientAuthError.createStateNotFoundError("Cached State");
        }
        // Get cached items
        const nonceKey = this.browserStorage.generateNonceKey(requestState);
        const cachedNonce = this.browserStorage.getTemporaryCache(nonceKey);
        // Assign code to request
        this.authCodeRequest.code = authCodeResponse.code;
        // Check for new cloud instance
        if (authCodeResponse.cloud_instance_host_name) {
            this.performanceClient.setPreQueueTime(PerformanceEvents.UpdateTokenEndpointAuthority, this.authCodeRequest.correlationId);
            await this.updateTokenEndpointAuthority(authCodeResponse.cloud_instance_host_name, authority, networkModule);
        }
        // Nonce validation not needed when redirect not involved (e.g. hybrid spa, renewing token via rt)
        if (validateNonce) {
            authCodeResponse.nonce = cachedNonce || undefined;
        }
        authCodeResponse.state = requestState;
        // Add CCS parameters if available
        if (authCodeResponse.client_info) {
            this.authCodeRequest.clientInfo = authCodeResponse.client_info;
        }
        else {
            const cachedCcsCred = this.checkCcsCredentials();
            if (cachedCcsCred) {
                this.authCodeRequest.ccsCredential = cachedCcsCred;
            }
        }
        // Acquire token with retrieved code.
        const tokenResponse = (await invokeAsync(this.authModule.acquireToken.bind(this.authModule), PerformanceEvents.AuthClientAcquireToken, this.logger, this.performanceClient, this.authCodeRequest.correlationId)(this.authCodeRequest, authCodeResponse));
        this.browserStorage.cleanRequestByState(state);
        return tokenResponse;
    }
    /**
     * Updates authority based on cloudInstanceHostname
     * @param cloudInstanceHostname
     * @param authority
     * @param networkModule
     */
    async updateTokenEndpointAuthority(cloudInstanceHostname, authority, networkModule) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.UpdateTokenEndpointAuthority, this.authCodeRequest.correlationId);
        const cloudInstanceAuthorityUri = `https://${cloudInstanceHostname}/${authority.tenant}/`;
        const cloudInstanceAuthority = await AuthorityFactory.createDiscoveredInstance(cloudInstanceAuthorityUri, networkModule, this.browserStorage, authority.options, this.logger, this.performanceClient, this.authCodeRequest.correlationId);
        this.authModule.updateAuthority(cloudInstanceAuthority);
    }
    /**
     * Looks up ccs creds in the cache
     */
    checkCcsCredentials() {
        // Look up ccs credential in temp cache
        const cachedCcsCred = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, true);
        if (cachedCcsCred) {
            try {
                return JSON.parse(cachedCcsCred);
            }
            catch (e) {
                this.authModule.logger.error("Cache credential could not be parsed");
                this.authModule.logger.errorPii(`Cache credential could not be parsed: ${cachedCcsCred}`);
            }
        }
        return null;
    }
}

export { InteractionHandler };
//# sourceMappingURL=InteractionHandler.mjs.map
