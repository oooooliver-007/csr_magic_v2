CREATE TABLE IF NOT EXISTS chat_session (
    session_id     VARCHAR(64) PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users(id),
    activity_id    BIGINT NOT NULL REFERENCES activity(id),
    status         VARCHAR(20) NOT NULL,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_chat_session_user_id ON chat_session(user_id);
CREATE INDEX idx_chat_session_activity_id ON chat_session(activity_id);
CREATE INDEX idx_chat_session_updated_at ON chat_session(updated_at);
