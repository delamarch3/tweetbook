import express from "express";
import { errorHandler } from "./middleware/error";
import followsRouter from "./routes/follows";
import auth from "./middleware/auth";
import rabbitmq, { Queue, RMQ } from "./rabbitmq/client";

export let profileQueue: RMQ;
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
app.use(auth);

app.use("/", followsRouter);

app.use(errorHandler);
app.listen(8000, () => console.log("Server started"));
