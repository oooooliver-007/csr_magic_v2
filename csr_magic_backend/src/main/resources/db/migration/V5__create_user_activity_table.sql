CREATE TABLE IF NOT EXISTS user_activity (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id),
    activity_id      BIGINT NOT NULL REFERENCES activity(id),
    state            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    form_data        JSONB,
    reject_reason    VARCHAR(500),
    reviewed_by      BIGINT REFERENCES users(id),
    reviewed_at      TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_activity_id ON user_activity(activity_id);
CREATE UNIQUE INDEX idx_user_activity_unique ON user_activity(user_id, activity_id);
