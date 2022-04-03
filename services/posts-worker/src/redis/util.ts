import redis, { RedisKeys } from "./client";
import { UpdatePosts } from "../rabbitmq/util";
import db, { PG } from "../db/pool";

export const addToFeeds = async (
    poststring: string,
    post: UpdatePosts,
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
    post: UpdatePosts,
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
    post: UpdatePosts,
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

export const commentCount = async (
    postid: number,
    followers: any[],
    increment: boolean
) => {
    try {
        const oldresponse = await db.getItem(PG.PostsTable, { id: postid });
        const oldpost = JSON.stringify(oldresponse.rows[0]);

        const response = await db.pool.query(
            `UPDATE posts SET comments = ${
                increment ? "comments + 1" : "comments - 1"
            } WHERE id = $1 RETURNING *`,
            [postid]
        );

        const newpost = JSON.stringify(response.rows[0]);

        await updateFeeds(
            oldpost,
            newpost,
            {
                userid: response.rows[0].userid,
                timestamp: response.rows[0].timestamp,
            },
            followers
        );
    } catch (err) {
        console.log(err);
    }
};
