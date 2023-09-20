/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { ProtocolUtils, ClientAuthError, UrlString } from '@azure/msal-common';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class BrowserProtocolUtils {
    /**
     * Extracts the BrowserStateObject from the state string.
     * @param browserCrypto
     * @param state
     */
    static extractBrowserRequestState(browserCrypto, state) {
        if (!state) {
            return null;
        }
        try {
            const requestStateObj = ProtocolUtils.parseRequestState(browserCrypto, state);
            return requestStateObj.libraryState.meta;
        }
        catch (e) {
            throw ClientAuthError.createInvalidStateError(state, e);
        }
    }
    /**
     * Parses properties of server response from url hash
     * @param locationHash Hash from url
     */
    static parseServerResponseFromHash(locationHash) {
        if (!locationHash) {
            return {};
        }
        const hashUrlString = new UrlString(locationHash);
        return UrlString.getDeserializedHash(hashUrlString.getHash());
    }
}

export { BrowserProtocolUtils };
//# sourceMappingURL=BrowserProtocolUtils.mjs.map
