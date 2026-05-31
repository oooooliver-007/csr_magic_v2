-- 海报图片数据从文件系统迁移到 PostgreSQL BYTEA 列
ALTER TABLE ai_poster
    ADD COLUMN IF NOT EXISTS poster_data BYTEA;

COMMENT ON COLUMN ai_poster.poster_data IS '海报 PNG 图片二进制数据，替代本地文件存储';
