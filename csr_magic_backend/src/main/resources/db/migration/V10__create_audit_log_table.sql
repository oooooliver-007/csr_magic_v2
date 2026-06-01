-- 审计日志表
-- 记录所有管理员操作（创建/更新/删除/审核），用于合规审计

CREATE TABLE IF NOT EXISTS audit_log (
    id              BIGSERIAL       PRIMARY KEY,
    operator_id     BIGINT          NOT NULL REFERENCES users(id),
    action          VARCHAR(50)     NOT NULL,  -- CREATE / UPDATE / DELETE / REVIEW
    target_type     VARCHAR(50),               -- EVENT / ACTIVITY / PARTICIPATION / USER
    target_id       BIGINT,
    detail          JSONB,                     -- 操作详情（变更前后值、审核结果等）
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_operator ON audit_log(operator_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
