import redis, { RedisKeys } from "./client";
import { Post } from "../rabbitmq/util";

export const addToFeeds = async (
    poststring: string,
    post: Post,
    followers: any[]
) => {
    try {
        await redis.ZADD(RedisKeys.UserPosts + post.userid, {
            score: parseInt(post.timestamp),
            value: poststring,
        });

        for (let i = 0; i < followers.length; i++) {
            await redis.ZADD(RedisKeys.Timeline + followers[i].followerid, {
                score: parseInt(post.timestamp),
                value: poststring,
            });
        }
    } catch (err) {
        console.log(err);
    }
};

export const updateFeeds = async (
    oldpost: string,
    newpost: string,
    post: Post,
    followers: any[]
) => {
    try {
        redis
            .multi()
            .ZREM(RedisKeys.UserPosts + post.userid, oldpost)
            .ZADD(RedisKeys.UserPosts + post.userid, {
                score: parseInt(post.timestamp),
                value: newpost,
            })
            .exec();

        for (let i = 0; i < followers.length; i++) {
            redis
                .multi()
                .ZREM(RedisKeys.Timeline + followers[i].followerid, oldpost)
                .ZADD(RedisKeys.Timeline + followers[i].followerid, {
                    score: parseInt(post.timestamp),
                    value: newpost,
                })
                .exec();
        }
    } catch (err) {
        console.log(err);
    }
};

export const deleteFromFeeds = async (
    oldpost: string,
    post: Post,
    followers: any[]
) => {
    try {
        await redis.ZREM(RedisKeys.UserPosts + post.userid, oldpost);

        for (let i = 0; i < followers.length; i++) {
            await redis.ZREM(
                RedisKeys.Timeline + followers[i].followerid,
                oldpost
            );
        }
    } catch (err) {
        console.log(err);
    }
};
