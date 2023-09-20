/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { KEY_FORMAT_JWK } from '../utils/BrowserConstants.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class ModernBrowserCrypto {
    getRandomValues(dataBuffer) {
        return window.crypto.getRandomValues(dataBuffer);
    }
    async generateKey(algorithm, extractable, keyUsages) {
        return window.crypto.subtle.generateKey(algorithm, extractable, keyUsages);
    }
    async exportKey(key) {
        return window.crypto.subtle.exportKey(KEY_FORMAT_JWK, key);
    }
    async importKey(keyData, algorithm, extractable, keyUsages) {
        return window.crypto.subtle.importKey(KEY_FORMAT_JWK, keyData, algorithm, extractable, keyUsages);
    }
    async sign(algorithm, key, data) {
        return window.crypto.subtle.sign(algorithm, key, data);
    }
    async digest(algorithm, data) {
        return window.crypto.subtle.digest(algorithm, data);
    }
}

export { ModernBrowserCrypto };
//# sourceMappingURL=ModernBrowserCrypto.mjs.map
