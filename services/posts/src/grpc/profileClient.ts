import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_PATH = __dirname + "/../../protos/profile.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const proto: any = grpc.loadPackageDefinition(packageDefinition).profile;

const target = "profile:10000";
const client = new proto.Profile(target, grpc.credentials.createInsecure());

export const isPriv = (userid: number) => {
    return new Promise((resolve, reject) => {
        client.isPriv({ userid }, async (err: Error, response: any) => {
            if (err) return reject(err);
            resolve(response.priv);
        });
    });
};

export default client;
