import * as redis from "redis";

export enum RedisKeys {
    Comments = "comments:post:"
}

const url = "redis://:redis@comments-redis:6379";
const client = redis.createClient({ url });

export default client;
