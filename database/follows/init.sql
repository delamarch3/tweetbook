CREATE TABLE IF NOT EXISTS follows (
    followerid INT,
    followeeid INT,
    PRIMARY KEY (followerid, followeeid)
);

CREATE TABLE IF NOT EXISTS requests (
    followerid INT,
    followeeid INT,
    PRIMARY KEY (followerid, followeeid)
);

CREATE INDEX followerid ON follows (followerid);
CREATE INDEX followeeid ON follows (followeeid);