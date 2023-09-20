/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { BrowserConfigurationAuthError } from '../error/BrowserConfigurationAuthError.mjs';
import { BrowserCacheLocation } from '../utils/BrowserConstants.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class BrowserStorage {
    constructor(cacheLocation) {
        this.validateWindowStorage(cacheLocation);
        this.windowStorage = window[cacheLocation];
    }
    validateWindowStorage(cacheLocation) {
        if (cacheLocation !== BrowserCacheLocation.LocalStorage &&
            cacheLocation !== BrowserCacheLocation.SessionStorage) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }
        const storageSupported = !!window[cacheLocation];
        if (!storageSupported) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }
    }
    getItem(key) {
        return this.windowStorage.getItem(key);
    }
    setItem(key, value) {
        this.windowStorage.setItem(key, value);
    }
    removeItem(key) {
        this.windowStorage.removeItem(key);
    }
    getKeys() {
        return Object.keys(this.windowStorage);
    }
    containsKey(key) {
        return this.windowStorage.hasOwnProperty(key);
    }
}

export { BrowserStorage };
//# sourceMappingURL=BrowserStorage.mjs.map
