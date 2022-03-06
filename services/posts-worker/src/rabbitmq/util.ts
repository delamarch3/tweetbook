import redis, { RedisKeys } from "../redis/client";
import { getFollowers } from "../grpc/followsClient";

type Action = "post" | "update" | "delete";
interface Post {
    id: number;
    userid: number;
    post: string;
    date: number;
    likes: number;
    comments: number;
    timestamp: string;
}
interface Message {
    oldpost?: Post;
    post: Post;
    action: Action;
}

export const processMessages = async (received: any) => {
    const messagestring = received.content.toString();
    const message: Message = JSON.parse(messagestring);

    const post = message.post;
    const poststring = JSON.stringify(post);

    const oldpoststring = message.oldpost && JSON.stringify(message.oldpost);

    const followers = await getFollowers(post.userid);

    switch (message.action) {
        case "post":
            await addToFeeds(poststring, post, followers);
            break;
        case "update":
            oldpoststring &&
                (await updateFeeds(oldpoststring, poststring, post, followers));
            break;
        case "delete":
            await deleteFromFeeds(poststring, post, followers);
            break;
        default:
            break;
    }
};

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
