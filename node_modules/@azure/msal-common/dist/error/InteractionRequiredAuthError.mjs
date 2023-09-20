/*! @azure/msal-common v14.0.3 2023-09-05 */
'use strict';
import { Constants } from '../utils/Constants.mjs';
import { AuthError } from './AuthError.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * InteractionRequiredServerErrorMessage contains string constants used by error codes and messages returned by the server indicating interaction is required
 */
const InteractionRequiredServerErrorMessage = [
    "interaction_required",
    "consent_required",
    "login_required",
];
const InteractionRequiredAuthSubErrorMessage = [
    "message_only",
    "additional_action",
    "basic_action",
    "user_password_expired",
    "consent_required",
];
/**
 * Interaction required errors defined by the SDK
 */
const InteractionRequiredAuthErrorMessage = {
    noTokensFoundError: {
        code: "no_tokens_found",
        desc: "No refresh token found in the cache. Please sign-in.",
    },
    native_account_unavailable: {
        code: "native_account_unavailable",
        desc: "The requested account is not available in the native broker. It may have been deleted or logged out. Please sign-in again using an interactive API.",
    },
};
/**
 * Error thrown when user interaction is required.
 */
class InteractionRequiredAuthError extends AuthError {
    constructor(errorCode, errorMessage, subError, timestamp, traceId, correlationId, claims) {
        super(errorCode, errorMessage, subError);
        Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);
        this.timestamp = timestamp || Constants.EMPTY_STRING;
        this.traceId = traceId || Constants.EMPTY_STRING;
        this.correlationId = correlationId || Constants.EMPTY_STRING;
        this.claims = claims || Constants.EMPTY_STRING;
        this.name = "InteractionRequiredAuthError";
    }
    /**
     * Helper function used to determine if an error thrown by the server requires interaction to resolve
     * @param errorCode
     * @param errorString
     * @param subError
     */
    static isInteractionRequiredError(errorCode, errorString, subError) {
        const isInteractionRequiredErrorCode = !!errorCode &&
            InteractionRequiredServerErrorMessage.indexOf(errorCode) > -1;
        const isInteractionRequiredSubError = !!subError &&
            InteractionRequiredAuthSubErrorMessage.indexOf(subError) > -1;
        const isInteractionRequiredErrorDesc = !!errorString &&
            InteractionRequiredServerErrorMessage.some((irErrorCode) => {
                return errorString.indexOf(irErrorCode) > -1;
            });
        return (isInteractionRequiredErrorCode ||
            isInteractionRequiredErrorDesc ||
            isInteractionRequiredSubError);
    }
    /**
     * Creates an error thrown when the authorization code required for a token request is null or empty.
     */
    static createNoTokensFoundError() {
        return new InteractionRequiredAuthError(InteractionRequiredAuthErrorMessage.noTokensFoundError.code, InteractionRequiredAuthErrorMessage.noTokensFoundError.desc);
    }
    /**
     * Creates an error thrown when the native broker returns ACCOUNT_UNAVAILABLE status, indicating that the account was removed and interactive sign-in is required
     * @returns
     */
    static createNativeAccountUnavailableError() {
        return new InteractionRequiredAuthError(InteractionRequiredAuthErrorMessage.native_account_unavailable.code, InteractionRequiredAuthErrorMessage.native_account_unavailable.desc);
    }
}

export { InteractionRequiredAuthError, InteractionRequiredAuthErrorMessage, InteractionRequiredAuthSubErrorMessage, InteractionRequiredServerErrorMessage };
//# sourceMappingURL=InteractionRequiredAuthError.mjs.map
