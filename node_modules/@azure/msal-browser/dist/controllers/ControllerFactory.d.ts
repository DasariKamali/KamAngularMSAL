import { IController } from "./IController";
import { Logger } from "@azure/msal-common";
import { Configuration } from "../config/Configuration";
export declare class ControllerFactory {
    protected config: Configuration;
    protected logger: Logger;
    constructor(config: Configuration);
    createController(): Promise<IController>;
}
//# sourceMappingURL=ControllerFactory.d.ts.map