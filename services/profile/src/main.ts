import express from "express";
import { errorHandler } from "./middleware/error";
import rabbitmq, { Queue, RMQ } from "./rabbitmq/client";
import auth from "./middleware/auth";
import { processMessages } from "./rabbitmq/util";
import profileRoutes from "./routes/profile";
import grpc from "./grpc/profile";

let profileQueue: RMQ;
(async () => {
    let retries = 5;
    while (retries) {
        try {
            profileQueue = await rabbitmq("amqp://rabbitmq", Queue.Profile);
            profileQueue.receiveMessages(processMessages, true);
            break;
        } catch (err) {
            retries -= 1;
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
})();

grpc(10000);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(auth);

app.use("/profile", profileRoutes);

app.use(errorHandler);
app.listen(8000, () => console.log("Server started"));
