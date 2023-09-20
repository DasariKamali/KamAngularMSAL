/*! @azure/msal-common v14.0.3 2023-09-05 */
'use strict';
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
function isCloudInstanceDiscoveryResponse(response) {
    return (response.hasOwnProperty("tenant_discovery_endpoint") &&
        response.hasOwnProperty("metadata"));
}

export { isCloudInstanceDiscoveryResponse };
//# sourceMappingURL=CloudInstanceDiscoveryResponse.mjs.map
