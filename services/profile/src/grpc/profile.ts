import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import db, { PG } from "../db/pool";

const PROTO_PATH = __dirname + "/../../protos/profile.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const proto: any = grpc.loadPackageDefinition(packageDefinition).profile;

interface IsPrivCall {
    request: {
        userid: number;
    };
}

const isPriv = async (call: IsPrivCall, callback: Function) => {
    try {
        const response = await db.getItem(PG.ProfileTable, {
            userid: call.request.userid,
        });
        if (!response.rowCount) {
            return callback(Error("User not found"), null);
        }
        callback(null, {
            priv: response.rows[0].priv,
        });
    } catch (err) {
        callback(err, null);
    }
};

const start = (port: number) => {
    const server = new grpc.Server();
    server.addService(proto.Profile.service, {
        isPriv,
    });

    server.bindAsync(
        `0.0.0.0:${port}`,
        grpc.ServerCredentials.createInsecure(),
        () => {
            console.log("gRPC server started");
            server.start();
        }
    );
};

export default start;
