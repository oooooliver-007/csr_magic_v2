-- 家属同行功能：扩展 activity 与 user_activity 表
-- 详见 docs/modules/participation/design-family-companion.md

ALTER TABLE activity
    ADD COLUMN IF NOT EXISTS allow_family BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS max_family_per_user INT;

ALTER TABLE user_activity
    ADD COLUMN IF NOT EXISTS family_members JSONB;

COMMENT ON COLUMN activity.allow_family IS '是否允许员工报名时携带家属';
COMMENT ON COLUMN activity.max_family_per_user IS '每位员工最多携带家属数；NULL 表示不限';
COMMENT ON COLUMN user_activity.family_members IS '家属列表 JSON：[{name, relation}]，空/NULL 表示无家属';
