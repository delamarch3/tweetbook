import { addToFeeds, updateFeeds, deleteFromFeeds } from "../redis/util";
import { getFollowers } from "../grpc/followsClient";

type Action = "post" | "update" | "delete";
export interface Post {
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
