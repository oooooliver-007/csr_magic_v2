# 模块-功能速查表

> 当 agent.md 或 _index.md 不可用时的备用速查。正常流程应从 agent.md 动态读取。

## 模块与功能清单

| # | 模块 | 功能 | spec 文件 | design 文件 |
|---|------|------|-----------|-------------|
| 1 | auth | login-register（登录/注册） | spec-login-register.md | design-login-register.md |
| 2 | auth | jwt-auth（JWT 认证） | spec-jwt-auth.md | design-jwt-auth.md |
| 3 | event | event-crud（事件 CRUD） | spec-event-crud.md | design-event-crud.md |
| 4 | activity | activity-list（活动列表·员工端） | spec-activity-list.md | design-activity-list.md |
| 5 | activity | activity-detail（活动详情+报名） | spec-activity-detail.md | design-activity-detail.md |
| 6 | activity | activity-crud（活动 CRUD·管理端） | spec-activity-crud.md | design-activity-crud.md |
| 7 | activity | activity-templates（5种活动模板） | spec-activity-templates.md | design-activity-templates.md |
| 8 | participation | signup（报名/退出） | spec-signup.md | design-signup.md |
| 9 | dashboard | stats-charts（统计看板） | spec-stats-charts.md | design-stats-charts.md |
| 10 | notification | notification-system（站内通知） | spec-notification-system.md | design-notification-system.md |
| 11 | user-management | user-crud（用户 CRUD） | spec-user-crud.md | design-user-crud.md |
| 12 | user-profile | profile-settings（个人设置） | spec-profile-settings.md | design-profile-settings.md |
| 13 | user-profile | my-participations（我的参与记录） | spec-my-participations.md | design-my-participations.md |
| 14 | ai-poster | poster-studio（海报工作台） | spec-poster-studio.md | design-poster-studio.md |
| 15 | ai-poster | poster-gallery（海报画廊） | spec-poster-gallery.md | design-poster-gallery.md |
| 16 | ai-chat-registration | chat-ui（对话界面） | spec-chat-ui.md | design-chat-ui.md |
| 17 | ai-chat-registration | agent-flow（Agent 对话流程） | spec-agent-flow.md | design-agent-flow.md |

## 推荐实现顺序（按依赖拓扑排序）

```
Phase A（基础层，无依赖）：
  1. auth/login-register
  2. auth/jwt-auth

Phase B（核心业务，依赖 auth）：
  3. event/event-crud
  4. activity/activity-crud
  5. activity/activity-templates

Phase C（员工端，依赖 event+activity）：
  6. activity/activity-list
  7. activity/activity-detail
  8. participation/signup
  9. notification/notification-system

Phase D（数据展示，依赖 activity+participation）：
  10. dashboard/stats-charts
  11. user-profile/profile-settings
  12. user-profile/my-participations
  13. user-management/user-crud

Phase E（AI 功能，依赖 participation）：
  14. ai-poster/poster-studio
  15. ai-poster/poster-gallery
  16. ai-chat-registration/chat-ui
  17. ai-chat-registration/agent-flow
```

## 文件路径模式

- 模块概览：`docs/modules/{module}/_index.md`
- 功能规格：`docs/modules/{module}/spec-{feature}.md`
- 技术设计：`docs/modules/{module}/design-{feature}.md`
- 共享文档：`docs/shared/{name}.md`
- 参考实现：`docs/exemplar/exemplar-{type}.md`
