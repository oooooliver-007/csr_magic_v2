## Purpose

延续 `fix-remaining-bugs` 中 `admin-session` 能力（角色门禁与深链接会话恢复），补充其遗留的运维侧场景与管理员落地规则：管理员会话访问任意员工端页面一律进入管理端；生产环境 `/admin` 路由由仓库内新 SPA 唯一承接。

## ADDED Requirements

### Requirement: 管理员会话访问员工端页面一律进入管理端

持有有效管理员会话的用户 SHALL 在访问任意员工端页面（`/`、`/activities`、`/activities/:id`、`/my`、`/poster`、`/notifications`、`/my-surveys`、`/surveys/:id`）时被重定向到管理端 `/admin`，与登录后的落地规则一致；员工会话 SHALL 不受影响。

#### Scenario: 管理员从历史记录重开员工端页面

- **WHEN** 管理员登录后未登出直接关闭页面，随后通过浏览器历史记录再次打开 `joy4giving.cn/my` 或站点根路径
- **THEN** 被重定向到管理端 `/admin` 并渲染数据看板，不落在员工端用户界面

#### Scenario: 员工会话不受落地规则影响

- **WHEN** 已登录的普通用户（USER 角色）访问首页或任意员工端页面
- **THEN** 正常渲染员工端页面，不发生重定向

### Requirement: 生产环境 /admin 路由唯一承接方

生产 nginx SHALL 将 `/admin/**` 全部路由给仓库内新 SPA（经 SPA fallback 渲染），仓库外旧版管理端应用不再被任何 location 路由；管理端会话在整页刷新与深链接打开时 SHALL 保持有效，不出现旧版登录墙（`#/login`）。

#### Scenario: 整页打开管理端深链接不撞旧版登录墙

- **WHEN** 已登录管理员整页打开 `/admin/participations` 并随后刷新
- **THEN** 页面始终由新 SPA 渲染（页面标题为 CSR Magic），URL 不含 `#/login`，会话保持

#### Scenario: 退出后重开不残留会话

- **WHEN** 管理员退出登录后通过历史记录重开任意页面
- **THEN** 落在登录页，localStorage 无令牌残留，refreshToken Cookie 已被服务端清除
