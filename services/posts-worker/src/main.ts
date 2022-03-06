import rabbitmq, { RMQ, Queue } from "./rabbitmq/client";
import { processMessages } from "./rabbitmq/util";
import redis from "./redis/client";

let postsQueue: RMQ;
(async () => {
    redis.connect();

    let retries = 5;
    while (retries) {
        try {
            postsQueue = await rabbitmq("amqp://rabbitmq", Queue.Posts);
            postsQueue.receiveMessages(processMessages, true);
            break;
        } catch (err) {
            retries -= 1;
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
})();
