import * as redis from "redis";

export enum RedisKeys {
    UserPosts = "user:posts:",
    Timeline = "timeline:",
}

const url = "redis://:redis@posts-redis:6379";
const client = redis.createClient({ url });

export default client;
