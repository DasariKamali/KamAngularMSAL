/*! @azure/msal-common v14.0.3 2023-09-05 */
'use strict';
import { Constants } from '../utils/Constants.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * AuthErrorMessage class containing string constants used by error codes and messages.
 */
const AuthErrorMessage = {
    unexpectedError: {
        code: "unexpected_error",
        desc: "Unexpected error in authentication.",
    },
    postRequestFailed: {
        code: "post_request_failed",
        desc: "Post request failed from the network, could be a 4xx/5xx or a network unavailability. Please check the exact error code for details.",
    },
};
/**
 * General error class thrown by the MSAL.js library.
 */
class AuthError extends Error {
    constructor(errorCode, errorMessage, suberror) {
        const errorString = errorMessage
            ? `${errorCode}: ${errorMessage}`
            : errorCode;
        super(errorString);
        Object.setPrototypeOf(this, AuthError.prototype);
        this.errorCode = errorCode || Constants.EMPTY_STRING;
        this.errorMessage = errorMessage || Constants.EMPTY_STRING;
        this.subError = suberror || Constants.EMPTY_STRING;
        this.name = "AuthError";
    }
    setCorrelationId(correlationId) {
        this.correlationId = correlationId;
    }
    /**
     * Creates an error that is thrown when something unexpected happens in the library.
     * @param errDesc
     */
    static createUnexpectedError(errDesc) {
        return new AuthError(AuthErrorMessage.unexpectedError.code, `${AuthErrorMessage.unexpectedError.desc}: ${errDesc}`);
    }
    /**
     * Creates an error for post request failures.
     * @param errDesc
     * @returns
     */
    static createPostRequestFailed(errDesc) {
        return new AuthError(AuthErrorMessage.postRequestFailed.code, `${AuthErrorMessage.postRequestFailed.desc}: ${errDesc}`);
    }
}

export { AuthError, AuthErrorMessage };
//# sourceMappingURL=AuthError.mjs.map
