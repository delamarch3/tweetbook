import redis from "./client";

export const getComments = async (
    key: string,
    offset: number,
    count: number
) => {
    const response = await redis.ZRANGE(key, Infinity, -Infinity, {
        REV: true,
        BY: "SCORE",
        LIMIT: {
            offset,
            count,
        },
    });

    const comments = [];
    for (let i = 0; i < response.length; i++) {
        comments.push(JSON.parse(response[i]));
    }
    return comments;
};
