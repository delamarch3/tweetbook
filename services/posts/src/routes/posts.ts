import express, { NextFunction, Response } from "express";
import { Data } from "../middleware/auth";
import db, { PG } from "../db/pool";
import { RedisKeys } from "../redis/client";
import { getTimeline } from "../redis/util";
import { postsQueue } from "../main";
import { isPriv } from "../grpc/profileClient";
import { isFollowing } from "../grpc/followsClient";

const router = express.Router();

// Get a users posts
router.get(
    "/user/:userid/:page",
    async (req: Data, res: Response, next: NextFunction) => {
        const { id } = req;
        const { userid } = req.params;
        const { page } = req.params;
        const count = 10;
        const offset = parseInt(page) * count;

        try {
            if (id != parseInt(userid)) {
                const privProfile = await isPriv(parseInt(userid));
                if (privProfile) {
                    const following =
                        id && (await isFollowing(id, parseInt(userid)));
                    if (!following) return res.status(403).json({ data: [] });
                }
            }

            const posts = await getTimeline(
                RedisKeys.UserPosts + userid,
                offset,
                count
            );

            return res.json({ data: posts });
        } catch (err) {
            return next(err);
        }
    }
);

// Get logged in users timeline
router.get(
    "/timeline/:page",
    async (req: Data, res: Response, next: NextFunction) => {
        const { id } = req;
        const { page } = req.params;
        const count = 10;
        const offset = parseInt(page) * count;

        try {
            const timeline = await getTimeline(
                RedisKeys.Timeline + id,
                offset,
                count
            );

            return res.json({ data: timeline });
        } catch (err) {
            return next(err);
        }
    }
);

// Create post
router.post("/", async (req: Data, res: Response, next: NextFunction) => {
    const { id } = req;
    const { post } = req.body;

    try {
        const response = await db.putItem(
            PG.PostsTable,
            {
                userid: id,
                post,
                date: new Date(),
                likes: 0,
                comments: 0,
                timestamp: Date.now(),
            },
            { id: 8, returning: ["*"] }
        );

        // Update each followers timeline:
        const message = JSON.stringify({
            action: "post",
            post: {
                ...response.rows[0],
            },
        });
        postsQueue.sendMessage(message);

        res.json({ data: response.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// Update post
router.patch("/", async (req: Data, res: Response, next: NextFunction) => {
    const { postid, post } = req.body;

    try {
        const oldresponse = await db.getItem(PG.PostsTable, { id: postid });

        const response = await db.updateItem(
            PG.PostsTable,
            { post },
            { id: postid },
            { returning: ["*"] }
        );

        // Update each followers timeline:
        const message = JSON.stringify({
            action: "update",
            post: {
                ...response.rows[0],
            },
            oldpost: {
                ...oldresponse.rows[0],
            },
        });
        postsQueue.sendMessage(message);

        res.json({ data: response.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// Delete post
router.delete("/", async (req: Data, res: Response, next: NextFunction) => {
    const { postid } = req.body;

    try {
        const response = await db.deleteItem(
            PG.PostsTable,
            { id: postid },
            { returning: ["*"] }
        );

        // Update each followers timeline:
        const message = JSON.stringify({
            action: "delete",
            post: {
                ...response.rows[0],
            },
        });
        postsQueue.sendMessage(message);

        res.json({ data: response.rows[0] });
    } catch (err) {
        return next(err);
    }
});

export default router;
