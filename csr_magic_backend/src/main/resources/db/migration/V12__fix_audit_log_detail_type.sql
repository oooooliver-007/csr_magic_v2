-- 修复 audit_log.detail 列类型：从 JSONB 改为 TEXT
-- JSONB 要求严格 JSON 格式，但审计日志 detail 存储的是自由文本

ALTER TABLE audit_log
    ALTER COLUMN detail TYPE TEXT;
