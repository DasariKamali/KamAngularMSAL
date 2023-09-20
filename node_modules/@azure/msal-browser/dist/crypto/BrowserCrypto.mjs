/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { BrowserStringUtils } from '../utils/BrowserStringUtils.mjs';
import { createBrowserAuthError } from '../error/BrowserAuthError.mjs';
import { ModernBrowserCrypto } from './ModernBrowserCrypto.mjs';
import { cryptoNonExistent } from '../error/BrowserAuthErrorCodes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * See here for more info on RsaHashedKeyGenParams: https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams
 */
// RSA KeyGen Algorithm
const PKCS1_V15_KEYGEN_ALG = "RSASSA-PKCS1-v1_5";
// SHA-256 hashing algorithm
const S256_HASH_ALG = "SHA-256";
// MOD length for PoP tokens
const MODULUS_LENGTH = 2048;
// Public Exponent
const PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]);
/**
 * This class implements functions used by the browser library to perform cryptography operations such as
 * hashing and encoding. It also has helper functions to validate the availability of specific APIs.
 */
class BrowserCrypto {
    constructor(logger) {
        this.logger = logger;
        if (this.hasBrowserCrypto()) {
            // Use standard modern web crypto if available
            this.logger.verbose("BrowserCrypto: modern crypto interface available");
            this.subtleCrypto = new ModernBrowserCrypto();
        }
        else {
            this.logger.error("BrowserCrypto: crypto interface is unavailable");
            throw createBrowserAuthError(cryptoNonExistent);
        }
        this.keygenAlgorithmOptions = {
            name: PKCS1_V15_KEYGEN_ALG,
            hash: S256_HASH_ALG,
            modulusLength: MODULUS_LENGTH,
            publicExponent: PUBLIC_EXPONENT,
        };
    }
    /**
     * Check whether browser crypto is available.
     */
    hasBrowserCrypto() {
        return "crypto" in window;
    }
    /**
     * Returns a sha-256 hash of the given dataString as an ArrayBuffer.
     * @param dataString
     */
    async sha256Digest(dataString) {
        const data = BrowserStringUtils.stringToUtf8Arr(dataString);
        // MSR Crypto wants object with name property, instead of string
        return this.subtleCrypto.digest({ name: S256_HASH_ALG }, data);
    }
    /**
     * Populates buffer with cryptographically random values.
     * @param dataBuffer
     */
    getRandomValues(dataBuffer) {
        return this.subtleCrypto.getRandomValues(dataBuffer);
    }
    /**
     * Generates a keypair based on current keygen algorithm config.
     * @param extractable
     * @param usages
     */
    async generateKeyPair(extractable, usages) {
        return this.subtleCrypto.generateKey(this.keygenAlgorithmOptions, extractable, usages);
    }
    /**
     * Export key as Json Web Key (JWK)
     * @param key
     */
    async exportJwk(key) {
        return this.subtleCrypto.exportKey(key);
    }
    /**
     * Imports key as Json Web Key (JWK), can set extractable and usages.
     * @param key
     * @param extractable
     * @param usages
     */
    async importJwk(key, extractable, usages) {
        return this.subtleCrypto.importKey(key, this.keygenAlgorithmOptions, extractable, usages);
    }
    /**
     * Signs given data with given key
     * @param key
     * @param data
     */
    async sign(key, data) {
        return this.subtleCrypto.sign(this.keygenAlgorithmOptions, key, data);
    }
}

export { BrowserCrypto };
//# sourceMappingURL=BrowserCrypto.mjs.map
