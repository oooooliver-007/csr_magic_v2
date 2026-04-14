CREATE TABLE IF NOT EXISTS notification (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id),
    type             VARCHAR(50) NOT NULL,
    title            VARCHAR(200) NOT NULL,
    content          TEXT,
    is_read          BOOLEAN NOT NULL DEFAULT false,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_notification_user_id ON notification(user_id);
CREATE INDEX idx_notification_is_read ON notification(user_id, is_read);
