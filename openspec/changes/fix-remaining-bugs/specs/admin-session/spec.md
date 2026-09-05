## Purpose

定义管理端访问控制与会话恢复契约：仅 ADMIN 角色可进入管理端，管理员登录后可直达（含整页刷新/深链接）任意管理端页面而无需重新登录。

## ADDED Requirements

### Requirement: 仅管理员可访问管理端

系统 SHALL 拒绝非 ADMIN 角色用户进入 `/admin/**` 路由，将其重定向回员工端首页。

#### Scenario: 普通用户访问管理端
- **WHEN** 已登录的普通用户（USER 角色）访问 `/admin` 或任意 `/admin/**` 页面
- **THEN** 被重定向回员工端首页，不渲染管理端页面

#### Scenario: 管理员访问管理端
- **WHEN** 已登录的管理员（ADMIN 角色）访问 `/admin/**`
- **THEN** 正常渲染对应管理端页面

### Requirement: 管理端深链接可直接恢复会话

系统 SHALL 在管理员已持有有效会话时，支持整页刷新或直接输入任意 `/admin/**` 深链接后直接展示对应页面，无需重新登录。

#### Scenario: 整页刷新管理端深链接
- **WHEN** 管理员登录后整页刷新 `/admin/participations`
- **THEN** 页面直接展示参与审核列表，不跳转登录页

#### Scenario: 无有效会话访问深链接
- **WHEN** 未登录或会话失效的用户直接访问 `/admin/participations`
- **THEN** 跳转登录页，登录后返回原目标页面