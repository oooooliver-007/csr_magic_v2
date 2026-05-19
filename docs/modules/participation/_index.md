# 参与模块（participation）

## 概述
管理员工的活动报名和退出流程。员工通过活动详情页提交报名表单，管理员在参与明细页进行审核。支持员工携带家属共同参加活动。

## 功能清单

| 功能 | spec 文件 | design 文件 | 状态 | 依赖 |
|------|-----------|-------------|------|------|
| 报名/退出 | spec-signup.md | design-signup.md | ✅ 已实现 | activity-detail |
| 家属同行 | spec-family-companion.md | design-family-companion.md | ✅ 已实现 | signup, activity-crud |

## 模块间依赖
- **依赖**：auth（认证）、activity（报名需要活动存在）
- **被依赖**：dashboard（统计参与数据）、user-profile（我的参与记录）、ai-poster（海报基于参与记录）

## 推荐实现顺序
1. signup（仅一个功能，直接实现）✅ 已完成
2. family-companion（家属同行 — 在 signup 基础上扩展，需同步改动 activity 模块表单）

## 涉及的服务
- **前端**：报名表单集成在 ActivityDetailPage 中；管理端 ParticipationPage
- **后端**：`csr_magic_backend/src/main/java/com/csr/participation/`
- **AI 服务**：不涉及（AI 对话报名在独立模块中）
