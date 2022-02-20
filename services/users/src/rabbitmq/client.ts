import amqp from "amqplib";

export enum Queue {
    Profile = "profile",
}

interface Options {
    durable: boolean;
}

export interface RMQ {
    sendMessage: (message: string) => void;
    receiveMessages: (callback: Function, noAck: boolean) => void;
}

const rabbitmq = async (url: string, queue: string, opts?: Options) => {
    try {
        const connection = await amqp.connect(url);
        const channel = await connection.createChannel();

        await channel.assertQueue(queue, {
            durable: opts?.durable ? opts.durable : false,
        });

        return {
            sendMessage: (message: string) => {
                channel.sendToQueue(queue, Buffer.from(message));
                console.log(`[x] Sent ${message} to ${queue}`);
            },
            receiveMessages: (callback: Function, noAck: boolean) => {
                channel.consume(queue, (msg) => callback(msg), {
                    noAck,
                });
            },
        };
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
};

export default rabbitmq;
