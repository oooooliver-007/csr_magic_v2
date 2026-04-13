CREATE TABLE IF NOT EXISTS activity (
    id               BIGSERIAL PRIMARY KEY,
    event_id         BIGINT NOT NULL REFERENCES event(id),
    name             VARCHAR(200) NOT NULL,
    description      TEXT,
    template_type    VARCHAR(20) NOT NULL,
    start_time       TIMESTAMP WITH TIME ZONE,
    end_time         TIMESTAMP WITH TIME ZONE,
    max_participants INT,
    cover_image      TEXT,
    status           VARCHAR(20) DEFAULT 'UPCOMING',
    form_schema      JSONB,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_activity_event_id ON activity(event_id);
CREATE INDEX idx_activity_status ON activity(status);
CREATE INDEX idx_activity_template_type ON activity(template_type);
