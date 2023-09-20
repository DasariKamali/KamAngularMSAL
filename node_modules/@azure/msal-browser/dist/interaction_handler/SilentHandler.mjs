/*! @azure/msal-browser v3.1.0 2023-09-05 */
'use strict';
import { PerformanceEvents, Constants, UrlString } from '@azure/msal-common';
import { InteractionHandler } from './InteractionHandler.mjs';
import { createBrowserAuthError } from '../error/BrowserAuthError.mjs';
import { DEFAULT_IFRAME_TIMEOUT_MS } from '../config/Configuration.mjs';
import { emptyNavigateUri, monitorWindowTimeout, hashDoesNotContainKnownProperties, hashEmptyError } from '../error/BrowserAuthErrorCodes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class SilentHandler extends InteractionHandler {
    constructor(authCodeModule, storageImpl, authCodeRequest, logger, systemOptions, performanceClient) {
        super(authCodeModule, storageImpl, authCodeRequest, logger, performanceClient);
        this.navigateFrameWait = systemOptions.navigateFrameWait;
        this.pollIntervalMilliseconds = systemOptions.pollIntervalMilliseconds;
    }
    /**
     * Creates a hidden iframe to given URL using user-requested scopes as an id.
     * @param urlNavigate
     * @param userRequestScopes
     */
    async initiateAuthRequest(requestUrl) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.SilentHandlerInitiateAuthRequest, this.authCodeRequest.correlationId);
        if (!requestUrl) {
            // Throw error if request URL is empty.
            this.logger.info("Navigate url is empty");
            throw createBrowserAuthError(emptyNavigateUri);
        }
        if (this.navigateFrameWait) {
            this.performanceClient.setPreQueueTime(PerformanceEvents.SilentHandlerLoadFrame, this.authCodeRequest.correlationId);
            return await this.loadFrame(requestUrl);
        }
        return this.loadFrameSync(requestUrl);
    }
    /**
     * Monitors an iframe content window until it loads a url with a known hash, or hits a specified timeout.
     * @param iframe
     * @param timeout
     */
    monitorIframeForHash(iframe, timeout) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.SilentHandlerMonitorIframeForHash, this.authCodeRequest.correlationId);
        return new Promise((resolve, reject) => {
            if (timeout < DEFAULT_IFRAME_TIMEOUT_MS) {
                this.logger.warning(`system.loadFrameTimeout or system.iframeHashTimeout set to lower (${timeout}ms) than the default (${DEFAULT_IFRAME_TIMEOUT_MS}ms). This may result in timeouts.`);
            }
            /*
             * Polling for iframes can be purely timing based,
             * since we don't need to account for interaction.
             */
            const nowMark = window.performance.now();
            const timeoutMark = nowMark + timeout;
            const intervalId = setInterval(() => {
                if (window.performance.now() > timeoutMark) {
                    this.removeHiddenIframe(iframe);
                    clearInterval(intervalId);
                    reject(createBrowserAuthError(monitorWindowTimeout));
                    return;
                }
                let href = Constants.EMPTY_STRING;
                const contentWindow = iframe.contentWindow;
                try {
                    /*
                     * Will throw if cross origin,
                     * which should be caught and ignored
                     * since we need the interval to keep running while on STS UI.
                     */
                    href = contentWindow
                        ? contentWindow.location.href
                        : Constants.EMPTY_STRING;
                }
                catch (e) { }
                if (!href || href === "about:blank") {
                    return;
                }
                const contentHash = contentWindow
                    ? contentWindow.location.hash
                    : Constants.EMPTY_STRING;
                if (contentHash) {
                    if (UrlString.hashContainsKnownProperties(contentHash)) {
                        // Success case
                        this.removeHiddenIframe(iframe);
                        clearInterval(intervalId);
                        resolve(contentHash);
                        return;
                    }
                    else {
                        // Hash is present but incorrect
                        this.logger.error("SilentHandler:monitorIFrameForHash - a hash is present in the iframe but it does not contain known properties. It's likely that the hash has been replaced by code running on the redirectUri page.");
                        this.logger.errorPii(`SilentHandler:monitorIFrameForHash - the url detected in the iframe is: ${href}`);
                        this.removeHiddenIframe(iframe);
                        clearInterval(intervalId);
                        reject(createBrowserAuthError(hashDoesNotContainKnownProperties));
                        return;
                    }
                }
                else {
                    // No hash is present
                    this.logger.error("SilentHandler:monitorIFrameForHash - the request has returned to the redirectUri but a hash is not present in the iframe. It's likely that the hash has been removed or the page has been redirected by code running on the redirectUri page.");
                    this.logger.errorPii(`SilentHandler:monitorIFrameForHash - the url detected in the iframe is: ${href}`);
                    this.removeHiddenIframe(iframe);
                    clearInterval(intervalId);
                    reject(createBrowserAuthError(hashEmptyError));
                    return;
                }
            }, this.pollIntervalMilliseconds);
        });
    }
    /**
     * @hidden
     * Loads iframe with authorization endpoint URL
     * @ignore
     */
    loadFrame(urlNavigate) {
        this.performanceClient.addQueueMeasurement(PerformanceEvents.SilentHandlerLoadFrame, this.authCodeRequest.correlationId);
        /*
         * This trick overcomes iframe navigation in IE
         * IE does not load the page consistently in iframe
         */
        return new Promise((resolve, reject) => {
            const frameHandle = this.createHiddenIframe();
            setTimeout(() => {
                if (!frameHandle) {
                    reject("Unable to load iframe");
                    return;
                }
                frameHandle.src = urlNavigate;
                resolve(frameHandle);
            }, this.navigateFrameWait);
        });
    }
    /**
     * @hidden
     * Loads the iframe synchronously when the navigateTimeFrame is set to `0`
     * @param urlNavigate
     * @param frameName
     * @param logger
     */
    loadFrameSync(urlNavigate) {
        const frameHandle = this.createHiddenIframe();
        frameHandle.src = urlNavigate;
        return frameHandle;
    }
    /**
     * @hidden
     * Creates a new hidden iframe or gets an existing one for silent token renewal.
     * @ignore
     */
    createHiddenIframe() {
        const authFrame = document.createElement("iframe");
        authFrame.style.visibility = "hidden";
        authFrame.style.position = "absolute";
        authFrame.style.width = authFrame.style.height = "0";
        authFrame.style.border = "0";
        authFrame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
        document.getElementsByTagName("body")[0].appendChild(authFrame);
        return authFrame;
    }
    /**
     * @hidden
     * Removes a hidden iframe from the page.
     * @ignore
     */
    removeHiddenIframe(iframe) {
        if (document.body === iframe.parentNode) {
            document.body.removeChild(iframe);
        }
    }
}

export { SilentHandler };
//# sourceMappingURL=SilentHandler.mjs.map
