import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import db, { PG } from "../db/pool";

const PROTO_PATH = __dirname + "/../../protos/follows.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const proto: any = grpc.loadPackageDefinition(packageDefinition).follows;

interface GetFollowingCall {
    request: {
        followeeid: number;
    };
}

interface IsFollowingCall {
    request: {
        followeeid: number;
        followerid: number;
    };
}

const getFollowing = async (call: GetFollowingCall, callback: Function) => {
    try {
        const response = await db.getItem(PG.FollowsTable, {
            followeeid: call.request.followeeid,
        });

        callback(null, {
            followers: response.rows,
        });
    } catch (err) {
        callback(err, null);
    }
};

const isFollowing = async (call: IsFollowingCall, callback: Function) => {
    const { followeeid, followerid } = call.request;
    try {
        const response = await db.getItem(PG.FollowsTable, {
            followerid,
            followeeid,
        });

        if (!response.rowCount) return callback(null, { isFollowing: false });
        callback(null, { isFollowing: true });
    } catch (err) {
        callback(err, null);
    }
};

const start = (port: number) => {
    const server = new grpc.Server();
    server.addService(proto.Follows.service, {
        getFollowing,
        isFollowing,
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
