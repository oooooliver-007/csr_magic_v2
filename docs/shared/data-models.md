# 数据模型

> 本文档记录所有数据库表结构。新增/修改数据表后必须更新此文档。

## 通用约定

- 数据库：PostgreSQL 16
- 命名：表名和字段名使用 snake_case
- 主键：`id BIGSERIAL PRIMARY KEY`
- 时间字段：`TIMESTAMP WITH TIME ZONE`，存储 UTC
- 软删除：暂不使用，物理删除
- 迁移工具：Flyway

## 核心表

### users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 登录用户名 |
| password | VARCHAR(255) | NOT NULL | BCrypt 加密 |
| display_name | VARCHAR(100) | | 显示昵称 |
| real_name | VARCHAR(100) | | 真名 |
| gender | VARCHAR(10) | | 性别 |
| region | VARCHAR(100) | | 所在地区 |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'USER' | USER / ADMIN |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | | |

### token_blacklist（Token 黑名单表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| jti | VARCHAR(100) | UNIQUE, NOT NULL | Token 唯一标识 |
| expired_at | TIMESTAMPTZ | NOT NULL | Token 过期时间 |
| created_at | TIMESTAMPTZ | NOT NULL | 加入黑名单时间 |

### event（事件表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| name | VARCHAR(200) | NOT NULL | 事件名称 |
| description | TEXT | | 富文本描述 |
| type | VARCHAR(20) | | OFFLINE / ONLINE / HYBRID |
| start_date | TIMESTAMPTZ | | |
| end_date | TIMESTAMPTZ | | |
| cover_image | TEXT | | 封面图（base64 或 URL） |
| visible | BOOLEAN | DEFAULT true | 是否在用户端展示 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | | |

### activity（活动表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| event_id | BIGINT | FK → event.id | 所属事件 |
| name | VARCHAR(200) | NOT NULL | 活动名称 |
| description | TEXT | | 富文本描述 |
| template_type | VARCHAR(20) | NOT NULL | BASIC / DONATION / VOLUNTEER / CHECKIN / CUSTOM |
| start_time | TIMESTAMPTZ | | |
| end_time | TIMESTAMPTZ | | |
| max_participants | INT | | 人数上限（NULL=不限） |
| cover_image | TEXT | | 封面图 |
| status | VARCHAR(20) | | UPCOMING / ONGOING / ENDED |
| form_schema | JSONB | | 自定义模板字段配置 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | | |

### user_activity（参与记录表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| user_id | BIGINT | FK → users.id | |
| activity_id | BIGINT | FK → activity.id | |
| state | VARCHAR(20) | NOT NULL | PENDING / APPROVED / REJECTED / RE_SUBMITTED |
| form_data | JSONB | | 用户提交的表单数据 |
| reject_reason | VARCHAR(500) | | 驳回原因 |
| reviewed_by | BIGINT | FK → users.id | 审核人 |
| reviewed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | | |

### notification（通知表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| user_id | BIGINT | FK → users.id | |
| type | VARCHAR(50) | NOT NULL | SIGNUP_SUCCESS / REVIEW_APPROVED / REVIEW_REJECTED / ACTIVITY_REMINDER |
| title | VARCHAR(200) | NOT NULL | |
| content | TEXT | | |
| is_read | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |

### ai_poster（AI 海报表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| user_id | BIGINT | FK → users.id | |
| activity_id | BIGINT | FK → activity.id | |
| task_id | VARCHAR(100) | UNIQUE | AI 服务任务 ID |
| user_prompt | TEXT | | 用户自定义提示词 |
| style | VARCHAR(50) | | 风格选择 |
| status | VARCHAR(20) | | PENDING / GENERATING / COMPLETED / FAILED |
| poster_url | VARCHAR(500) | | 生成的海报 URL |
| error_message | TEXT | | 失败原因 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | | |

### audit_log（审计日志表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | |
| operator_id | BIGINT | FK → users.id | 操作人 |
| action | VARCHAR(50) | NOT NULL | CREATE / UPDATE / DELETE / REVIEW |
| target_type | VARCHAR(50) | | EVENT / ACTIVITY / PARTICIPATION / USER |
| target_id | BIGINT | | |
| detail | JSONB | | 操作详情 |
| created_at | TIMESTAMPTZ | NOT NULL | |

## ER 关系

```
users 1──N user_activity N──1 activity N──1 event
users 1──N notification
users 1──N ai_poster N──1 activity
users 1──N audit_log
```
