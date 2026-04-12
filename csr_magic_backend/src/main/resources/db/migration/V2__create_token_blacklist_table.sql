CREATE TABLE IF NOT EXISTS token_blacklist (
    id          BIGSERIAL       PRIMARY KEY,
    jti         VARCHAR(100)    NOT NULL UNIQUE,
    expired_at  TIMESTAMPTZ     NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(jti);
