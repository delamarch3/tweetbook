import db, { PG } from "../db/pool";

enum Service {
    Users = "users",
    Follows = "follows",
}

export const processMessages = async (message: any) => {
    const parsedMessage = JSON.parse(message.content.toString());

    switch (parsedMessage.service) {
        case Service.Users:
            createProfile(parsedMessage);
            break;
        case Service.Follows:
            updateFollows(parsedMessage);
            break;
        default:
            break;
    }
};

const createProfile = async (message: any) => {
    try {
        const { userid, username, email } = message;

        await db.putItem(
            PG.ProfileTable,
            {
                userid,
                username,
                displayName: username,
                email,
                followers: 0,
                following: 0,
                posts: 0,
                priv: true,
                membersince: new Date(),
            },
            {
                id: 8,
            }
        );
    } catch (err) {
        console.log(err);
    }
};

const updateFollows = async (message: any) => {
    const queries = message.updates.map(
        (update: any) =>
            `UPDATE ${PG.ProfileTable} SET ${
                update.following ? "following" : "followers"
            } =
         ${update.following ? "following" : "followers"} ${
                message.action == "follow" ? "+ 1" : "- 1"
            } 
         WHERE userid = ${update.userid};`
    );

    await db.pool.query(`
        BEGIN;
        ${queries.join(" ")}
        COMMIT;
    `);
};
