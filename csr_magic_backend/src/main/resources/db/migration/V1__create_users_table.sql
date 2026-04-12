CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL       PRIMARY KEY,
    username    VARCHAR(50)     NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    display_name VARCHAR(100),
    real_name   VARCHAR(100),
    gender      VARCHAR(10),
    region      VARCHAR(100),
    role        VARCHAR(20)     NOT NULL DEFAULT 'USER',
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
