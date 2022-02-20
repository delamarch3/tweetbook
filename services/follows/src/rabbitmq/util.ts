import { profileQueue } from "../main";

type action = "follow" | "unfollow";

export const sendProfileMessage = (
    action: action,
    followerid: number,
    followeeid: number
) => {
    const message = JSON.stringify({
        action: action,
        service: "follows",
        updates: [
            {
                userid: followerid,
                following: true,
            },
            {
                userid: followeeid,
                following: false,
            },
        ],
    });
    profileQueue.sendMessage(message);
};
