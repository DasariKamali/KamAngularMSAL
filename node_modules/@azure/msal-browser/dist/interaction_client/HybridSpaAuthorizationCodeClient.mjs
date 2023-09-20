/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { AuthorizationCodeClient } from '@azure/msal-common';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class HybridSpaAuthorizationCodeClient extends AuthorizationCodeClient {
    constructor(config) {
        super(config);
        this.includeRedirectUri = false;
    }
}

export { HybridSpaAuthorizationCodeClient };
//# sourceMappingURL=HybridSpaAuthorizationCodeClient.mjs.map
