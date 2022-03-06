import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_PATH = __dirname + "/../../protos/follows.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const proto: any = grpc.loadPackageDefinition(packageDefinition).follows;

const target = "follows:10000";
const client = new proto.Follows(target, grpc.credentials.createInsecure());

export const isFollowing = (followerid: number, followeeid: number) => {
    return new Promise((resolve, reject) => {
        client.isFollowing(
            { followerid, followeeid },
            (err: Error, response: any) => {
                if (err) return reject(err);

                resolve(response.isFollowing);
            }
        );
    });
};

export default client;
