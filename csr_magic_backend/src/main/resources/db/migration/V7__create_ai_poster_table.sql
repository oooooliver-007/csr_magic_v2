CREATE TABLE IF NOT EXISTS ai_poster (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id),
    activity_id      BIGINT NOT NULL REFERENCES activity(id),
    task_id          VARCHAR(100) UNIQUE,
    user_prompt      TEXT,
    style            VARCHAR(50),
    status           VARCHAR(20),
    poster_url       VARCHAR(500),
    error_message    TEXT,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ai_poster_user_id ON ai_poster(user_id);
CREATE INDEX idx_ai_poster_task_id ON ai_poster(task_id);
