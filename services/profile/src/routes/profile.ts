import express, { NextFunction, Response } from "express";
import { Data } from "../middleware/auth";
import db, { PG } from "../db/pool";
import { ErrorResponse } from "../util/ErrorResponse";

const router = express.Router();

// Get logged in profile
router.get("/", async (req: Data, res: Response, next: NextFunction) => {
    const { id } = req;
    try {
        const response = await db.getItem(PG.ProfileTable, { userid: id });
        if (!response.rowCount)
            return next(new ErrorResponse("Profile not found", 404));

        return res.json({ data: response.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// Get profile
router.get("/:id", async (req: Data, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const response = await db.getItem(PG.ProfileTable, { id });
        if (!response.rowCount)
            return next(new ErrorResponse("Profile not found", 404));

        return res.json({ data: response.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// Update profile
router.patch("/", async (req: Data, res: Response, next: NextFunction) => {
    try {
        const { id } = req;
        const { displayname, bio, city, country, priv } = req.body;

        let update = {};
        if (displayname) Object.assign(update, { displayname });
        if (bio) Object.assign(update, { bio });
        if (city) Object.assign(update, { city });
        if (country) Object.assign(update, { country });
        if (priv) Object.assign(update, { priv: JSON.parse(priv) });
        if (!Object.keys(update).length)
            return new ErrorResponse("Empty request", 400);

        const response = await db.updateItem(
            PG.ProfileTable,
            update,
            { userid: id },
            { returning: ["*"] }
        );

        return res.json({ data: response.rows[0] });
    } catch (err) {
        return next(err);
    }
});

export default router;
