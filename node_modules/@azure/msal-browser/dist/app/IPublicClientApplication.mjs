/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { BrowserConfigurationAuthError } from '../error/BrowserConfigurationAuthError.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const stubbedPublicClientApplication = {
    initialize: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    acquireTokenPopup: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    acquireTokenRedirect: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    acquireTokenSilent: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    acquireTokenByCode: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    getAllAccounts: () => {
        return [];
    },
    getAccountByHomeId: () => {
        return null;
    },
    getAccountByUsername: () => {
        return null;
    },
    getAccountByLocalId: () => {
        return null;
    },
    handleRedirectPromise: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    loginPopup: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    loginRedirect: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    logout: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    logoutRedirect: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    logoutPopup: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    ssoSilent: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    addEventCallback: () => {
        return null;
    },
    removeEventCallback: () => {
        return;
    },
    addPerformanceCallback: () => {
        return "";
    },
    removePerformanceCallback: () => {
        return false;
    },
    enableAccountStorageEvents: () => {
        return;
    },
    disableAccountStorageEvents: () => {
        return;
    },
    getTokenCache: () => {
        throw BrowserConfigurationAuthError.createStubPcaInstanceCalledError();
    },
    getLogger: () => {
        throw BrowserConfigurationAuthError.createStubPcaInstanceCalledError();
    },
    setLogger: () => {
        return;
    },
    setActiveAccount: () => {
        return;
    },
    getActiveAccount: () => {
        return null;
    },
    initializeWrapperLibrary: () => {
        return;
    },
    setNavigationClient: () => {
        return;
    },
    getConfiguration: () => {
        throw BrowserConfigurationAuthError.createStubPcaInstanceCalledError();
    },
    hydrateCache: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    clearCache: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
};

export { stubbedPublicClientApplication };
//# sourceMappingURL=IPublicClientApplication.mjs.map
