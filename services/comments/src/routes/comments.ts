import express, { NextFunction, Response } from "express";
import { Data } from "../middleware/auth";
import db, { PG } from "../db/pool";
import { postsQueue } from "../main";
import redis, { RedisKeys } from "../redis/client";
import { getComments } from "../redis/util";

const router = express.Router();

// Get comments on a post
router.get(
    "/:postid/:page",
    async (req: Data, res: Response, next: NextFunction) => {
        const { postid, page } = req.params;
        const count = 10;
        const offset = parseInt(page) * count;
        try {
            const comments = await getComments(
                RedisKeys.Comments + postid,
                offset,
                count
            );

            return res.json({ data: comments });
        } catch (err) {
            return next(err);
        }
    }
);

// Create comment
router.post("/", async (req: Data, res: Response, next: NextFunction) => {
    const { comment, postid } = req.body;
    const { id } = req;
    try {
        const response = await db.putItem(
            PG.CommentsTable,
            {
                comment,
                postid,
                userid: id,
                date: new Date(),
                likes: 0,
                timestamp: Date.now(),
            },
            { id: 8, returning: ["*"] }
        );

        let message = JSON.stringify({
            post: {
                userid: id,
                id: postid,
            },
            action: "comment-increment",
        });
        postsQueue.sendMessage(message);

        await redis.ZADD(RedisKeys.Comments + postid, {
            score: response.rows[0].timestamp,
            value: JSON.stringify(response.rows[0]),
        });

        return res.json({ data: response.rows[0] });
    } catch (err) {
        console.log(err);
        return next(err);
    }
});

// Update comment
router.patch("/", async (req: Data, res: Response, next: NextFunction) => {
    const { commentid, comment } = req.body;

    try {
        const oldresponse = await db.getItem(PG.CommentsTable, {
            id: commentid,
        });

        const response = await db.updateItem(
            PG.CommentsTable,
            { comment },
            { id: commentid },
            { returning: ["*"] }
        );

        redis
            .multi()
            .ZREM(
                RedisKeys.Comments + response.rows[0].postid,
                JSON.stringify(oldresponse.rows[0])
            )
            .ZADD(RedisKeys.Comments + response.rows[0].postid, {
                score: response.rows[0].timestamp,
                value: JSON.stringify(response.rows[0]),
            })
            .exec();

        return res.json({ data: response.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// Delete comment
router.delete("/", async (req: Data, res: Response, next: NextFunction) => {
    const { id } = req;
    const { commentid } = req.body;

    try {
        const response = await db.deleteItem(
            PG.CommentsTable,
            { id: commentid },
            { returning: ["*"] }
        );

        let message = JSON.stringify({
            post: {
                userid: id,
                id: response.rows[0].postid,
            },
            action: "comment-decrement",
        });
        postsQueue.sendMessage(message);

        await redis.ZREM(
            RedisKeys.Comments + response.rows[0].postid,
            JSON.stringify(response.rows[0])
        );

        return res.json({ data: response.rows[0] });
    } catch (err) {
        return next(err);
    }
});

export default router;
