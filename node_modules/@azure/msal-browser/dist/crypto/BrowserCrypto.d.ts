import { Logger } from "@azure/msal-common";
/**
 * This class implements functions used by the browser library to perform cryptography operations such as
 * hashing and encoding. It also has helper functions to validate the availability of specific APIs.
 */
export declare class BrowserCrypto {
    private keygenAlgorithmOptions;
    private subtleCrypto;
    private logger;
    constructor(logger: Logger);
    /**
     * Check whether browser crypto is available.
     */
    private hasBrowserCrypto;
    /**
     * Returns a sha-256 hash of the given dataString as an ArrayBuffer.
     * @param dataString
     */
    sha256Digest(dataString: string): Promise<ArrayBuffer>;
    /**
     * Populates buffer with cryptographically random values.
     * @param dataBuffer
     */
    getRandomValues(dataBuffer: Uint8Array): Uint8Array;
    /**
     * Generates a keypair based on current keygen algorithm config.
     * @param extractable
     * @param usages
     */
    generateKeyPair(extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKeyPair>;
    /**
     * Export key as Json Web Key (JWK)
     * @param key
     */
    exportJwk(key: CryptoKey): Promise<JsonWebKey>;
    /**
     * Imports key as Json Web Key (JWK), can set extractable and usages.
     * @param key
     * @param extractable
     * @param usages
     */
    importJwk(key: JsonWebKey, extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKey>;
    /**
     * Signs given data with given key
     * @param key
     * @param data
     */
    sign(key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer>;
}
//# sourceMappingURL=BrowserCrypto.d.ts.map