CREATE TABLE IF NOT EXISTS posts (
    id INT,
    userid INT NOT NULL,
    post TEXT NOT NULL,
    date VARCHAR(50) NOT NULL,
    likes INT NOT NULL,
    comments INT NOT NULL,
    timestamp BIGINT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS likedby (
    postid INT, 
    userid INT,
    PRIMARY KEY (postid, userid)
);