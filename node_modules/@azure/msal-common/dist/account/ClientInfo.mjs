/*! @azure/msal-common v14.0.3 2023-09-05 */
'use strict';
import { ClientAuthError } from '../error/ClientAuthError.mjs';
import { Separators, Constants } from '../utils/Constants.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * Function to build a client info object from server clientInfo string
 * @param rawClientInfo
 * @param crypto
 */
function buildClientInfo(rawClientInfo, crypto) {
    if (!rawClientInfo) {
        throw ClientAuthError.createClientInfoEmptyError();
    }
    try {
        const decodedClientInfo = crypto.base64Decode(rawClientInfo);
        return JSON.parse(decodedClientInfo);
    }
    catch (e) {
        throw ClientAuthError.createClientInfoDecodingError(e.message);
    }
}
/**
 * Function to build a client info object from cached homeAccountId string
 * @param homeAccountId
 */
function buildClientInfoFromHomeAccountId(homeAccountId) {
    if (!homeAccountId) {
        throw ClientAuthError.createClientInfoDecodingError("Home account ID was empty.");
    }
    const clientInfoParts = homeAccountId.split(Separators.CLIENT_INFO_SEPARATOR, 2);
    return {
        uid: clientInfoParts[0],
        utid: clientInfoParts.length < 2
            ? Constants.EMPTY_STRING
            : clientInfoParts[1],
    };
}

export { buildClientInfo, buildClientInfoFromHomeAccountId };
//# sourceMappingURL=ClientInfo.mjs.map
