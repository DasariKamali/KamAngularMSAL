/**
 * @packageDocumentation
 * @module @azure/msal-browser
 */
/**
 * Warning: This set of exports is purely intended to be used by other MSAL libraries, and should be considered potentially unstable. We strongly discourage using them directly, you do so at your own risk.
 * Breaking changes to these APIs will be shipped under a minor version, instead of a major version.
 */
export { PublicClientApplication } from "./app/PublicClientApplication";
export { IController } from "./controllers/IController";
export { Configuration, BrowserAuthOptions, CacheOptions, BrowserSystemOptions, BrowserTelemetryOptions, BrowserConfiguration, DEFAULT_IFRAME_TIMEOUT_MS, } from "./config/Configuration";
export { InteractionType, InteractionStatus, BrowserCacheLocation, WrapperSKU, ApiId, CacheLookupPolicy, } from "./utils/BrowserConstants";
export { BrowserUtils } from "./utils/BrowserUtils";
export { BrowserAuthError, BrowserAuthErrorMessage, BrowserAuthErrorCodes, } from "./error/BrowserAuthError";
export { BrowserConfigurationAuthError, BrowserConfigurationAuthErrorMessage, } from "./error/BrowserConfigurationAuthError";
export { IPublicClientApplication, stubbedPublicClientApplication, } from "./app/IPublicClientApplication";
export { INavigationClient } from "./navigation/INavigationClient";
export { NavigationClient } from "./navigation/NavigationClient";
export { NavigationOptions } from "./navigation/NavigationOptions";
export { PopupRequest } from "./request/PopupRequest";
export { RedirectRequest } from "./request/RedirectRequest";
export { SilentRequest } from "./request/SilentRequest";
export { SsoSilentRequest } from "./request/SsoSilentRequest";
export { EndSessionRequest } from "./request/EndSessionRequest";
export { EndSessionPopupRequest } from "./request/EndSessionPopupRequest";
export { AuthorizationUrlRequest } from "./request/AuthorizationUrlRequest";
export { AuthorizationCodeRequest } from "./request/AuthorizationCodeRequest";
export { AuthenticationResult } from "./response/AuthenticationResult";
export { ClearCacheRequest } from "./request/ClearCacheRequest";
export { LoadTokenOptions } from "./cache/TokenCache";
export { ITokenCache } from "./cache/ITokenCache";
export { MemoryStorage } from "./cache/MemoryStorage";
export { BrowserStorage } from "./cache/BrowserStorage";
export { EventMessage, EventPayload, EventError, EventCallbackFunction, EventMessageUtils, PopupEvent, } from "./event/EventMessage";
export { EventType } from "./event/EventType";
export { SignedHttpRequest, SignedHttpRequestOptions, } from "./crypto/SignedHttpRequest";
export { PopupWindowAttributes, PopupSize, PopupPosition, } from "./request/PopupWindowAttributes";
export { BrowserPerformanceClient } from "./telemetry/BrowserPerformanceClient";
export { BrowserPerformanceMeasurement } from "./telemetry/BrowserPerformanceMeasurement";
export { AuthenticationScheme, AccountInfo, AccountEntity, IdTokenClaims, AuthError, AuthErrorMessage, ClientAuthError, ClientAuthErrorMessage, ClientConfigurationError, ClientConfigurationErrorMessage, InteractionRequiredAuthError, InteractionRequiredAuthErrorMessage, ServerError, INetworkModule, NetworkResponse, NetworkRequestOptions, ILoggerCallback, Logger, LogLevel, ProtocolMode, ServerResponseType, PromptValue, ExternalTokenResponse, StringUtils, UrlString, AzureCloudInstance, AzureCloudOptions, AuthenticationHeaderParser, OIDC_DEFAULT_SCOPES, PerformanceCallbackFunction, PerformanceEvent, PerformanceEvents, InProgressPerformanceEvent, } from "@azure/msal-common";
export { version } from "./packageMetadata";
//# sourceMappingURL=index.d.ts.map