import { ProtocolMode } from "./ProtocolMode";
import { OIDCOptions } from "./OIDCOptions";
import { AzureRegionConfiguration } from "./AzureRegionConfiguration";
export type AuthorityOptions = {
    protocolMode: ProtocolMode;
    OIDCOptions?: OIDCOptions | null;
    knownAuthorities: Array<string>;
    cloudDiscoveryMetadata: string;
    authorityMetadata: string;
    skipAuthorityMetadataCache?: boolean;
    azureRegionConfiguration?: AzureRegionConfiguration;
};
export declare const AzureCloudInstance: {
    readonly None: "none";
    readonly AzurePublic: "https://login.microsoftonline.com";
    readonly AzurePpe: "https://login.windows-ppe.net";
    readonly AzureChina: "https://login.chinacloudapi.cn";
    readonly AzureGermany: "https://login.microsoftonline.de";
    readonly AzureUsGovernment: "https://login.microsoftonline.us";
};
export type AzureCloudInstance = (typeof AzureCloudInstance)[keyof typeof AzureCloudInstance];
//# sourceMappingURL=AuthorityOptions.d.ts.map