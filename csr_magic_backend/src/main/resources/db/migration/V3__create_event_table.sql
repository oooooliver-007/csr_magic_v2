CREATE TABLE IF NOT EXISTS event (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    type        VARCHAR(20),
    start_date  TIMESTAMP WITH TIME ZONE,
    end_date    TIMESTAMP WITH TIME ZONE,
    cover_image TEXT,
    visible     BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE
);
