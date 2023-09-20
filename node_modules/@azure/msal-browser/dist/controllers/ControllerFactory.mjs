/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { TeamsAppOperatingContext } from '../operatingcontext/TeamsAppOperatingContext.mjs';
import { StandardOperatingContext } from '../operatingcontext/StandardOperatingContext.mjs';
import { Logger } from '@azure/msal-common';
import { name, version } from '../packageMetadata.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class ControllerFactory {
    constructor(config) {
        this.config = config;
        const loggerOptions = {
            loggerCallback: undefined,
            piiLoggingEnabled: false,
            logLevel: undefined,
            correlationId: undefined,
        };
        this.logger = new Logger(loggerOptions, name, version);
    }
    async createController() {
        const standard = new StandardOperatingContext(this.config);
        const metaOS = new TeamsAppOperatingContext(this.config);
        const operatingContexts = [standard.initialize(), metaOS.initialize()];
        return Promise.all(operatingContexts).then(async () => {
            if (metaOS.isAvailable()) {
                /*
                 * pull down metaos module
                 * create associated controller
                 */
                // return await StandardController.createController(standard);
                const controller = await import('./StandardController.mjs');
                return await controller.StandardController.createController(standard);
            }
            else if (standard.isAvailable()) {
                const controller = await import('./StandardController.mjs');
                return await controller.StandardController.createController(standard);
            }
            throw new Error("No controller found.");
        });
    }
}

export { ControllerFactory };
//# sourceMappingURL=ControllerFactory.mjs.map
