import { Pool } from "pg";
import randomise from "randomatic";

export enum PG {
    FollowsTable = "follows",
    RequestsTable = "requests",
}

interface Options {
    id?: number;
    returning?: string[];
}

export class Postgres {
    pool: Pool;
    constructor(options: {
        user: string;
        password: string;
        database: string;
        host: string;
    }) {
        this.pool = new Pool({
            user: options.user,
            password: options.password,
            database: options.database,
            host: options.host,
            port: 5432,
        });
    }

    getItem = async (table: string, item: any) => {
        let query = `SELECT * FROM ${table} WHERE `;
        let keys = Object.keys(item);
        let values = [];
        for (let i = 0; i < keys.length; i++) {
            query += `${keys[i]} = $${i + 1}`;
            values.push(item[keys[i]]);
            if (keys.length > 1) {
                query += i != keys.length - 1 ? " AND " : "";
            }
        }
        return this.pool.query(query, values);
    };

    getAll = async (table: string) => {
        let query = `SELECT * FROM ${table}`;
        return this.pool.query(query);
    };

    putItem = async (table: string, item: any, opts?: Options) => {
        if (opts?.id) {
            Object.assign(item, {
                id: randomise("0", opts.id),
            });
        }
        let keys = Object.keys(item);
        let attributes = [];
        let attributesNum = [];
        let values = [];

        for (let i = 0; i < keys.length; i++) {
            attributes.push(keys[i]);
            attributesNum.push(`$${i + 1}`);

            values.push(item[keys[i]]);
        }

        let attributesString = attributes.join(", ");
        let attributesNumString = attributesNum.join(", ");

        let query = `INSERT INTO ${table} (${attributesString}) VALUES (${attributesNumString})`;
        if (opts?.returning) {
            let returningValues = " RETURNING " + opts.returning.join(", ");
            query += returningValues;
        }

        return this.pool.query(query, values);
    };

    deleteItem = async (table: string, params: any, opts?: Options) => {
        let keys = Object.keys(params);
        let query = `DELETE FROM ${table} WHERE `;
        let values = [];
        let arr = [];

        for (let i = 0; i < keys.length; i++) {
            arr.push(`${keys[i]} = $${i + 1}`);
            values.push(params[keys[i]]);
        }

        let string = arr.join(" AND ");
        query += string;

        if (opts?.returning) {
            let returningValues = " RETURNING " + opts.returning.join(", ");
            query += returningValues;
        }

        return this.pool.query(query, values);
    };

    updateItem = async (
        table: string,
        set: any,
        params: any,
        opts?: Options
    ) => {
        let setKeys = Object.keys(set);
        let paramKeys = Object.keys(params);

        let values = [];
        let setArr = [];
        for (let i = 0; i < setKeys.length; i++) {
            values.push(set[setKeys[i]]);
            setArr.push(`${setKeys[i]} = $${i + 1}`);
        }
        let setString = setArr.join(" ,");

        let query = `UPDATE ${table} SET ${setString} WHERE `;
        let paramArr = [];

        for (let i = 0; i < paramKeys.length; i++) {
            paramArr.push(`${paramKeys[i]} = $${i + setKeys.length + 1}`);
            values.push(params[paramKeys[i]]);
        }

        let paramString = paramArr.join(" AND ");
        query += paramString;

        if (opts?.returning) {
            let returningValues = " RETURNING " + opts.returning.join(", ");
            query += returningValues;
        }

        return this.pool.query(query, values);
    };
}

export default new Postgres({
    user: "postgres",
    password: "postgres",
    database: "follows",
    host: "follows-database",
});
