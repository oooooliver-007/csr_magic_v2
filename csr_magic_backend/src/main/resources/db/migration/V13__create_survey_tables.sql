-- V9: 问卷系统表
-- 问卷主表
CREATE TABLE IF NOT EXISTS survey (
    id BIGSERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_survey_activity FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE CASCADE,
    CONSTRAINT uq_survey_activity UNIQUE (activity_id)
);

-- 问卷题目表
CREATE TABLE IF NOT EXISTS survey_question (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL,
    options JSONB,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_question_survey FOREIGN KEY (survey_id) REFERENCES survey(id) ON DELETE CASCADE,
    CONSTRAINT ck_question_type CHECK (question_type IN ('RATING', 'CHOICE', 'TEXT'))
);

-- 用户答卷表
CREATE TABLE IF NOT EXISTS survey_response (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    sentiment_score DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_response_survey FOREIGN KEY (survey_id) REFERENCES survey(id) ON DELETE CASCADE,
    CONSTRAINT fk_response_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_survey_user UNIQUE (survey_id, user_id)
);

-- 用户答案表
CREATE TABLE IF NOT EXISTS survey_answer (
    id BIGSERIAL PRIMARY KEY,
    response_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    answer_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_answer_response FOREIGN KEY (response_id) REFERENCES survey_response(id) ON DELETE CASCADE,
    CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES survey_question(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_survey_activity ON survey(activity_id);
CREATE INDEX IF NOT EXISTS idx_survey_question_survey ON survey_question(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_response_survey ON survey_response(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_response_user ON survey_response(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_answer_response ON survey_answer(response_id);
CREATE INDEX IF NOT EXISTS idx_survey_answer_question ON survey_answer(question_id);
