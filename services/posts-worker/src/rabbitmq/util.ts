import {
    addToFeeds,
    updateFeeds,
    deleteFromFeeds,
    commentCount,
} from "../redis/util";
import { getFollowers } from "../grpc/followsClient";

type Action =
    | "post"
    | "update"
    | "delete"
    | "comment-increment"
    | "comment-decrement";
interface Post {
    id: number;
    userid: string;
    post: string;
    date: number;
    likes: number;
    comments: number;
    timestamp: string;
}

export interface UpdatePosts {
    id?: number;
    userid: string;
    timestamp: string;
}
interface Message {
    oldpost?: Post;
    post: Post & UpdatePosts;
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
        case "comment-increment":
            await commentCount(post.id, followers, true);
            break;
        case "comment-decrement":
            await commentCount(post.id, followers, false);
            break;
        default:
            break;
    }
};
