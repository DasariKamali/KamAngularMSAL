/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { BaseOperatingContext } from './BaseOperatingContext.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class TeamsAppOperatingContext extends BaseOperatingContext {
    /**
     * Return the module name.  Intended for use with import() to enable dynamic import
     * of the implementation associated with this operating context
     * @returns
     */
    getModuleName() {
        return TeamsAppOperatingContext.MODULE_NAME;
    }
    /**
     * Returns the unique identifier for this operating context
     * @returns string
     */
    getId() {
        return TeamsAppOperatingContext.ID;
    }
    /**
     * Checks whether the operating context is available.
     * Confirms that the code is running a browser rather.  This is required.
     * @returns Promise<boolean> indicating whether this operating context is currently available.
     */
    async initialize() {
        /*
         * TODO: Add implementation to check for presence of inject MetaOSHub JavaScript interface
         * TODO: Make pre-flight token request to ensure that App is eligible to use Nested App Auth
         */
        return false;
    }
}
/*
 * TODO: Once we have determine the bundling code return here to specify the name of the bundle
 * containing the implementation for this operating context
 */
TeamsAppOperatingContext.MODULE_NAME = "";
/**
 * Unique identifier for the operating context
 */
TeamsAppOperatingContext.ID = "TeamsAppOperatingContext";

export { TeamsAppOperatingContext };
//# sourceMappingURL=TeamsAppOperatingContext.mjs.map
