import express, { NextFunction, Response } from "express";
import { Data } from "../middleware/auth";
import db, { PG } from "../db/pool";
import profileRPC from "../grpc/profileClient";
import { sendProfileMessage } from "../rabbitmq/util";
import { ErrorResponse } from "../util/ErrorResponse";

const router = express.Router();

// Get following
router.get(
    "/following",
    async (req: Data, res: Response, next: NextFunction) => {
        const { id } = req;

        try {
            const response = await db.getItem(PG.FollowsTable, {
                followeeid: id,
            });

            return res.json({ data: response.rows });
        } catch (err) {
            return next(err);
        }
    }
);

// Get followers
router.get(
    "/followers",
    async (req: Data, res: Response, next: NextFunction) => {
        const { id } = req;

        try {
            const response = await db.getItem(PG.FollowsTable, {
                followerid: id,
            });

            return res.json({ data: response.rows });
        } catch (err) {
            return next(err);
        }
    }
);

// Follow
router.post("/", async (req: Data, res: Response, next: NextFunction) => {
    const { id }: any = req;
    const { followeeid } = req.body;

    profileRPC.isPriv({ followeeid }, async (err: Error, response: any) => {
        if (err) return next(err);

        try {
            if (!response.priv) {
                await db.putItem(PG.FollowsTable, {
                    followerid: id,
                    followeeid,
                });
                sendProfileMessage("follow", id, followeeid);
                return res.json({ message: "Followed" });
            }

            await db.putItem(PG.RequestsTable, {
                followerid: id,
                followeeid,
            });
            return res.json({ message: "Requested" });
        } catch (err) {
            if (err.code == "23505") {
                return next(new ErrorResponse("Duplicate follow/request", 400));
            }
            return next(err);
        }
    });
});

// Unfollow
router.delete("/", async (req: Data, res: Response, next: NextFunction) => {
    const { id }: any = req;
    const { followeeid } = req.body;

    try {
        await db.deleteItem(PG.FollowsTable, { followerid: id, followeeid });
        sendProfileMessage("unfollow", id, followeeid);
        res.json({ message: "Unfollowed" });
    } catch (err) {
        return next(err);
    }
});

// Get requests
router.get(
    "/requests",
    async (req: Data, res: Response, next: NextFunction) => {
        const { id } = req;

        try {
            const response = await db.getItem(PG.RequestsTable, {
                followeeid: id,
            });

            return res.json({ data: response.rows });
        } catch (err) {
            return next(err);
        }
    }
);

// Accept request
router.post(
    "/requests",
    async (req: Data, res: Response, next: NextFunction) => {
        const { id }: any = req;
        const { followerid } = req.body;

        try {
            const response = await db.deleteItem(
                PG.RequestsTable,
                { followeeid: id, followerid },
                { returning: ["*"] }
            );

            await db.putItem(PG.FollowsTable, response.rows[0]);
            sendProfileMessage("follow", followerid, id);
            return res.json({ message: "Followed" });
        } catch (err) {
            return next(err);
        }
    }
);

// Reject request
router.delete(
    "/requests",
    async (req: Data, res: Response, next: NextFunction) => {
        const { id } = req;
        const { followerid } = req.body;

        try {
            await db.deleteItem(PG.RequestsTable, {
                followeeid: id,
                followerid,
            });

            return res.json({ message: "Request deleted" });
        } catch (err) {
            return next(err);
        }
    }
);

export default router;
