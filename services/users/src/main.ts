import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { checkExistingUser, createUser, findUser } from "./util/db";
import rabbitmq, { Queue, RMQ } from "./rabbitmq/client";

let profileQueue: RMQ;
(async () => {
    let retries = 5;
    while (retries) {
        try {
            profileQueue = await rabbitmq("amqp://rabbitmq", Queue.Profile);
            break;
        } catch (err) {
            retries -= 1;
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
})();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const secret = process.env.JWTSECRET || "";
const expire = "1d";

app.post("/register", async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    try {
        // Check is username or email already exist
        const exists = await checkExistingUser(username, email);
        if (!exists.success) return res.json({ message: exists.message });

        // Create user, return id
        const { id } = await createUser(username, email, password);

        // Generate and send token
        const token = jwt.sign({ id, username }, secret, {
            expiresIn: expire,
        });

        const message = JSON.stringify({
            userid: id,
            username,
            email,
            service: "users",
        });
        profileQueue.sendMessage(message);
        return res.json({ token });
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
});

app.post("/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        // Check if user exitsts
        const user = await findUser("username", username);
        if (!user.rowCount) return res.send("User does not exist");

        // Compare passwords
        if (!(await bcrypt.compare(password, user.rows[0].password)))
            return res.send("Wrong password");

        // Generate and send token
        const token = jwt.sign({ id: user.rows[0].id, username }, secret, {
            expiresIn: expire,
        });
        return res.json({ token });
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
});

app.listen(8000, () => console.log("Users server started"));
