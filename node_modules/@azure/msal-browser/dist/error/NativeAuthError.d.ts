import { AuthError } from "@azure/msal-common";
export type OSError = {
    error?: number;
    protocol_error?: string;
    properties?: object;
    status?: string;
    retryable?: boolean;
};
export declare const NativeStatusCode: {
    readonly USER_INTERACTION_REQUIRED: "USER_INTERACTION_REQUIRED";
    readonly USER_CANCEL: "USER_CANCEL";
    readonly NO_NETWORK: "NO_NETWORK";
    readonly TRANSIENT_ERROR: "TRANSIENT_ERROR";
    readonly PERSISTENT_ERROR: "PERSISTENT_ERROR";
    readonly DISABLED: "DISABLED";
    readonly ACCOUNT_UNAVAILABLE: "ACCOUNT_UNAVAILABLE";
};
export type NativeStatusCode = (typeof NativeStatusCode)[keyof typeof NativeStatusCode];
export declare const NativeAuthErrorMessage: {
    extensionError: {
        code: string;
    };
    userSwitch: {
        code: string;
        desc: string;
    };
    tokensNotFoundInCache: {
        code: string;
        desc: string;
    };
};
export declare class NativeAuthError extends AuthError {
    ext: OSError | undefined;
    constructor(errorCode: string, description: string, ext?: OSError);
    /**
     * These errors should result in a fallback to the 'standard' browser based auth flow.
     */
    isFatal(): boolean;
    /**
     * Create the appropriate error object based on the WAM status code.
     * @param code
     * @param description
     * @param ext
     * @returns
     */
    static createError(code: string, description: string, ext?: OSError): AuthError;
    /**
     * Creates user switch error when the user chooses a different account in the native broker prompt
     * @returns
     */
    static createUserSwitchError(): NativeAuthError;
    /**
     * Creates a tokens not found error when the internal cache look up fails
     * @returns NativeAuthError: tokensNotFoundInCache
     */
    static createTokensNotFoundInCacheError(): NativeAuthError;
}
//# sourceMappingURL=NativeAuthError.d.ts.map