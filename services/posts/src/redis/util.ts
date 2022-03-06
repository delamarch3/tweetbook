import redis from "./client";

export const getTimeline = async (
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

    const timeline = [];
    for (let i = 0; i < response.length; i++) {
        timeline.push(JSON.parse(response[i]));
    }
    return timeline;
};
