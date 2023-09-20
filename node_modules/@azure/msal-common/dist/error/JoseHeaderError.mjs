/*! @azure/msal-common v14.0.3 2023-09-05 */
'use strict';
import { AuthError } from './AuthError.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * ClientAuthErrorMessage class containing string constants used by error codes and messages.
 */
const JoseHeaderErrorMessage = {
    missingKidError: {
        code: "missing_kid_error",
        desc: "The JOSE Header for the requested JWT, JWS or JWK object requires a keyId to be configured as the 'kid' header claim. No 'kid' value was provided.",
    },
    missingAlgError: {
        code: "missing_alg_error",
        desc: "The JOSE Header for the requested JWT, JWS or JWK object requires an algorithm to be specified as the 'alg' header claim. No 'alg' value was provided.",
    },
};
/**
 * Error thrown when there is an error in the client code running on the browser.
 */
class JoseHeaderError extends AuthError {
    constructor(errorCode, errorMessage) {
        super(errorCode, errorMessage);
        this.name = "JoseHeaderError";
        Object.setPrototypeOf(this, JoseHeaderError.prototype);
    }
    /**
     * Creates an error thrown when keyId isn't set on JOSE header.
     */
    static createMissingKidError() {
        return new JoseHeaderError(JoseHeaderErrorMessage.missingKidError.code, JoseHeaderErrorMessage.missingKidError.desc);
    }
    /**
     * Creates an error thrown when algorithm isn't set on JOSE header.
     */
    static createMissingAlgError() {
        return new JoseHeaderError(JoseHeaderErrorMessage.missingAlgError.code, JoseHeaderErrorMessage.missingAlgError.desc);
    }
}

export { JoseHeaderError, JoseHeaderErrorMessage };
//# sourceMappingURL=JoseHeaderError.mjs.map
