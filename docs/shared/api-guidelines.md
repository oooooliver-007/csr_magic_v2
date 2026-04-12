# API 设计规范

> 定义"如何设计 API"，与 `api-contracts.md`（具体端点列表）互补。新增 API 时必须遵循本规范。

## URL 设计

### 路径规范
- 基础前缀：`/api/v2/`
- 资源名使用复数名词：`/activities`（非 `/activity`）
- 嵌套资源最多两层：`/activities/{id}/participants`
- 操作动词用于非 CRUD 语义：`/participations/{id}/review`、`/auth/login`

### HTTP 方法

| 方法 | 语义 | 幂等 | 示例 |
|------|------|------|------|
| GET | 查询 | 是 | `GET /activities` |
| POST | 创建 / 操作 | 否 | `POST /activities` |
| PUT | 全量更新 | 是 | `PUT /activities/{id}` |
| PATCH | 部分更新 | 是 | `PATCH /participations/{id}/review` |
| DELETE | 删除 | 是 | `DELETE /activities/{id}` |

## 分页

所有列表接口使用统一分页参数：

**请求参数**：
```
?page=0&size=20&sort=createdAt,desc
```

**响应结构**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

- `page` 从 0 开始
- `size` 默认 20，最大 100
- `sort` 格式：`field,direction`

## 筛选

查询参数使用 camelCase：
```
GET /activities?templateType=DONATION&status=ONGOING&eventId=1
```

- 枚举值使用 UPPER_SNAKE_CASE
- 多值筛选用逗号分隔：`?status=ONGOING,UPCOMING`
- 模糊搜索参数名：`keyword` 或 `search`

## 响应格式

### 统一包装

所有响应使用 `ApiResponse<T>` 包装：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### HTTP 状态码

| 状态码 | 使用场景 |
|--------|---------|
| 200 | 成功（查询/更新/删除） |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证（Token 缺失/过期） |
| 403 | 无权限（角色不匹配） |
| 404 | 资源不存在 |
| 409 | 冲突（如重复报名） |
| 500 | 服务器内部错误 |

### 错误响应

```json
{
  "code": 400,
  "message": "捐赠金额必须大于0",
  "data": null
}
```

字段校验错误：
```json
{
  "code": 400,
  "message": "参数校验失败",
  "data": {
    "errors": [
      { "field": "amount", "message": "必须大于0" },
      { "field": "activityId", "message": "不能为空" }
    ]
  }
}
```

## 认证

- 公开接口：登录、注册
- 认证接口：请求头 `Authorization: Bearer <accessToken>`
- 管理员接口：认证 + 角色校验（role = ADMIN）
- Token 刷新：使用 httpOnly cookie 中的 refresh token

## 时间格式

- 请求/响应统一使用 ISO 8601 UTC：`2026-04-06T12:00:00Z`
- 前端显示时转换为本地时区
- 数据库存储 `TIMESTAMP WITH TIME ZONE`

## 文件上传

- 封面图：base64 编码放在 JSON body 中（≤500KB）
- 附件图片：multipart/form-data
- 文件大小限制在响应中明确提示
