# API 端点契约

> 本文档记录所有 API 端点的契约定义。新增 API 后必须更新此文档。

## 通用约定

- 基础路径：`/api/v2/`
- 认证：`Authorization: Bearer <token>`（除登录/注册外）
- 响应格式：`{ code: number, message: string, data: T }`
- 分页响应：`{ code, message, data: { content: T[], totalElements, totalPages, page, size } }`
- 时间格式：ISO 8601 UTC（`2026-01-01T00:00:00Z`）

## 认证模块（auth）

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v2/auth/register` | 用户注册 | 否 |
| POST | `/api/v2/auth/login` | 用户登录 | 否 |
| POST | `/api/v2/auth/logout` | 用户登出 | 是 |
| POST | `/api/v2/auth/refresh` | 刷新 Token | 否（需 refresh token） |

## 事件模块（event）

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v2/events` | 事件列表（分页） | 是 |
| GET | `/api/v2/events/{id}` | 事件详情 | 是 |
| POST | `/api/v2/events` | 创建事件 | 是（Admin） |
| PUT | `/api/v2/events/{id}` | 更新事件 | 是（Admin） |
| DELETE | `/api/v2/events/{id}` | 删除事件 | 是（Admin） |

## 活动模块（activity）

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v2/activities` | 活动列表（分页+筛选） | 是 |
| GET | `/api/v2/activities/{id}` | 活动详情 | 是 |
| POST | `/api/v2/activities` | 创建活动 | 是（Admin） |
| PUT | `/api/v2/activities/{id}` | 更新活动 | 是（Admin） |
| DELETE | `/api/v2/activities/{id}` | 删除活动 | 是（Admin） |

## 参与模块（participation）

| 方法 | 路径 | 说明 | 认证 | 状态 |
|------|------|------|------|------|
| POST | `/api/v2/participations/signup` | 报名参与 | 是 | ✅ 已实现 |
| POST | `/api/v2/participations/{id}/withdraw` | 退出活动 | 是 | ✅ 已实现 |
| GET | `/api/v2/participations/my` | 我的参与记录 | 是 | ✅ 已实现 |
| GET | `/api/v2/participations` | 参与列表（管理端，分页+筛选） | 是（Admin） | ✅ 已实现 |
| PATCH | `/api/v2/participations/{id}/review` | 审核（通过/驳回） | 是（Admin） | ✅ 已实现 |

- GET /api/v2/participations 查询参数：page、size、eventId、activityId、userId、state、keyword、createdFrom、createdTo
- GET /api/v2/participations 中 createdFrom / createdTo 使用 ISO 8601 UTC 时间字符串
- PATCH /api/v2/participations/{id}/review 请求体：{ action: "APPROVE" | "REJECT", rejectReason?: string }
- PATCH /api/v2/participations/{id}/review 中当 action = "REJECT" 时，rejectReason 必填

## 家属同行（family-companion）

家属同行功能在活动模块和参与模块中扩展了以下字段：

**ActivityResponse / ActivityDetailResponse 新增字段**：
- `currentOccupiedSlots` (Long)：当前占用名额数（1 员工 + N 家属），用于名额满判断
- `allowFamily` (Boolean)：是否允许携带家属
- `maxFamilyPerUser` (Integer | null)：每人最多携带家属数，null 表示不限

**CreateActivityRequest / UpdateActivityRequest 新增字段**：
- `allowFamily` (Boolean, 可选)：是否允许携带家属
- `maxFamilyPerUser` (Integer | null, 可选)：每人最多携带家属数

**SignupRequest 新增字段**：
- `familyMembers` (Array<{name: string, relation: string}>, 可选)：家属列表，relation 枚举：SPOUSE/CHILD/PARENT/OTHER

**ParticipationResponse / MyParticipationResponse 新增字段**：
- `familyMembers` (Array<{name: string, relation: string}>)：家属列表

**业务规则**：
- 活动未开启 allowFamily 时，报名不可携带家属
- 携带家属数不可超过 maxFamilyPerUser（若设置）
- 合并名额（1 + 家属数）不可超过活动 maxParticipants
- 关闭 allowFamily 时 maxFamilyPerUser 自动清空为 null

## 看板模块（dashboard）

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v2/dashboard/stats` | 总览统计数据 | 是（Admin） |
| GET | `/api/v2/dashboard/trends` | 参与趋势（月度） | 是（Admin） |
| GET | `/api/v2/dashboard/distribution` | 活动类型分布 | 是（Admin） |
| GET | `/api/v2/dashboard/top-participants` | 最活跃员工 Top 10 | 是（Admin） |

## 通知模块（notification）

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v2/notifications/my` | 我的通知列表 | 是 |
| GET | `/api/v2/notifications/unread-count` | 未读通知数 | 是 |
| PATCH | `/api/v2/notifications/{id}/read` | 标记已读 | 是 |
| PATCH | `/api/v2/notifications/read-all` | 全部标记已读 | 是 |

## 用户模块（user）

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v2/users` | 用户列表（管理端，分页） | 是（Admin） |
| GET | `/api/v2/users/{id}` | 用户详情 | 是（Admin） |
| PUT | `/api/v2/users/{id}` | 更新用户 | 是（Admin） |
| DELETE | `/api/v2/users/{id}` | 删除用户 | 是（Admin） |
| PUT | `/api/v2/users/{id}/reset-password` | 重置密码 | 是（Admin） |
| GET | `/api/v2/users/me` | 当前用户信息 | 是 |
| PUT | `/api/v2/users/me` | 更新个人信息 | 是 |
| PUT | `/api/v2/users/me/password` | 修改密码 | 是 |
| GET | `/api/v2/users/me/stats` | 我的贡献统计 | 是 |

## AI 海报模块（poster）

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v2/posters/generate` | 提交海报生成任务 | 是 |
| GET | `/api/v2/posters/{taskId}/status` | 查询生成状态 | 是 |
| GET | `/api/v2/posters/my` | 我的海报列表 | 是 |

## AI 对话报名模块（chat-registration）

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v2/chat/sessions` | 创建对话会话 | 是 |
| POST | `/api/v2/chat/sessions/{sessionId}/messages` | 发送消息 | 是 |
| GET | `/api/v2/chat/sessions/{sessionId}` | 获取会话历史 | 是 |
