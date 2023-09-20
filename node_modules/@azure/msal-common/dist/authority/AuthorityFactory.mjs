/*! @azure/msal-common v14.0.3 2023-09-05 */
'use strict';
import { Authority } from './Authority.mjs';
import { ClientConfigurationError } from '../error/ClientConfigurationError.mjs';
import { ClientAuthError } from '../error/ClientAuthError.mjs';
import { PerformanceEvents } from '../telemetry/performance/PerformanceEvent.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/** @internal */
class AuthorityFactory {
    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (i.e. aad, b2c, adfs)
     *
     * Also performs endpoint discovery.
     *
     * @param authorityUri
     * @param networkClient
     * @param protocolMode
     */
    static async createDiscoveredInstance(authorityUri, networkClient, cacheManager, authorityOptions, logger, performanceClient, correlationId) {
        performanceClient?.addQueueMeasurement(PerformanceEvents.AuthorityFactoryCreateDiscoveredInstance, correlationId);
        const authorityUriFinal = Authority.transformCIAMAuthority(authorityUri);
        // Initialize authority and perform discovery endpoint check.
        const acquireTokenAuthority = AuthorityFactory.createInstance(authorityUriFinal, networkClient, cacheManager, authorityOptions, logger, performanceClient, correlationId);
        try {
            performanceClient?.setPreQueueTime(PerformanceEvents.AuthorityResolveEndpointsAsync, correlationId);
            await acquireTokenAuthority.resolveEndpointsAsync();
            return acquireTokenAuthority;
        }
        catch (e) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
        }
    }
    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (i.e. aad, b2c, adfs)
     *
     * Does not perform endpoint discovery.
     *
     * @param authorityUrl
     * @param networkInterface
     * @param protocolMode
     */
    static createInstance(authorityUrl, networkInterface, cacheManager, authorityOptions, logger, performanceClient, correlationId) {
        // Throw error if authority url is empty
        if (!authorityUrl) {
            throw ClientConfigurationError.createUrlEmptyError();
        }
        return new Authority(authorityUrl, networkInterface, cacheManager, authorityOptions, logger, performanceClient, correlationId);
    }
}

export { AuthorityFactory };
//# sourceMappingURL=AuthorityFactory.mjs.map
