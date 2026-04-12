# 个人中心模块（user-profile）

## 概述
员工端个人中心，包括个人设置（昵称/密码修改）和我的参与记录（历史活动 + 海报）。

## 功能清单

| 功能 | spec 文件 | design 文件 | 状态 | 依赖 |
|------|-----------|-------------|------|------|
| 个人设置 | spec-profile-settings.md | design-profile-settings.md | 待实现 | auth |
| 我的参与记录 | spec-my-participations.md | design-my-participations.md | 待实现 | participation |

## 模块间依赖
- **依赖**：auth（认证）、participation（参与记录数据）
- **被依赖**：无

## 推荐实现顺序
1. profile-settings（个人设置 — 仅依赖 auth）
2. my-participations（参与记录 — 依赖 participation 模块）

## 涉及的服务
- **前端**：`csr_magic_frontend/src/pages/MyProfilePage.tsx`
- **后端**：`csr_magic_backend/src/main/java/com/csr/user/`（复用用户模块）
- **AI 服务**：不涉及
