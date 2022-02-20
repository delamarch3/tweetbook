CREATE TABLE IF NOT EXISTS profile (
    id INT,
    userid INT UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    displayname VARCHAR(100),
    bio TEXT,
    city TEXT,
    country TEXT,
    -- links jsonb,
    followers INT,
    following INT,
    posts INT,
    membersince VARCHAR(50),
    priv BOOLEAN,
    PRIMARY KEY (id)
);