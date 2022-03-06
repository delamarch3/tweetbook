import * as redis from "redis";

const url = "redis://:redis@posts-redis:6379";
const client = redis.createClient({ url });

export enum RedisKeys {
    UserPosts = "user:posts:",
    Timeline = "timeline:",
}

export default client;
