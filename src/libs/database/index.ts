import knex from "knex";
import ConfigLoader from "../config";
const config = new ConfigLoader().load();

const connection = knex({
    client: 'pg',
    connection: {
        host: config?.database?.host as string,
        user: config?.database?.user,
        password: config?.database?.password,
        database: config?.database?.name,
    }
});

export default connection;