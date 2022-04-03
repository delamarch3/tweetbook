import express from "express";
import { errorHandler } from "./middleware/error";
import auth from "./middleware/auth";
import commentsRouter from "./routes/comments";
import redis from "./redis/client";
import rabbitmq, { Queue, RMQ } from "./rabbitmq/client";

const app = express();

export let postsQueue: RMQ;
(async () => {
    await redis.connect();

    let retries = 5;
    while (retries) {
        try {
            postsQueue = await rabbitmq("amqp://rabbitmq", Queue.Posts);
            break;
        } catch (err) {
            retries -= 1;
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
})();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(auth);

app.use("/", commentsRouter);

app.use(errorHandler);
app.listen(8000, () => console.log("Server started"));
