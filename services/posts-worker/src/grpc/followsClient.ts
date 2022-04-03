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

export const getFollowers = (userid: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        client.getFollowing(
            { followeeid: userid },
            (err: Error, response: any) => {
                if (err) return reject(err);

                // Add to posters timeline too:
                response.followers.push({ followerid: userid });

                resolve(response.followers);
            }
        );
    });
};

export default client;
