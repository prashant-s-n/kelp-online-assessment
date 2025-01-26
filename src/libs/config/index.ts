import dotenv from "dotenv";

dotenv.config();

export interface IConfigs {
    application: {
        port: number;
        root: string;
    },
    database: {
        host: string | number;
        name: string;
        user: string;
        password: string;
    },
    csvLoadPath : string;
}

export default class ConfigLoader {

    private configs : IConfigs = {} as IConfigs;

    constructor() {}

    load() : IConfigs {

        const environment: Record<string, any> = process.env;

        const configs: IConfigs = {
            application: {
                port: environment['PORT'],
                root: environment['APP_ROOT'],
            },
            database: {
                host: environment['DB_HOST'],
                user: environment['DB_USER'],
                password: environment['DB_PASS'],
                name: environment['DB_NAME'],
            },
            csvLoadPath: environment['CSV_LOAD_PATH'],
        }

        return configs;
    }

    getConfig(): IConfigs {
        return this.configs;
    }
}