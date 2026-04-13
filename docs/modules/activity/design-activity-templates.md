---
module: activity
feature: activity-templates
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/activity/design-activity-crud.md
---

# 5种活动模板 — 技术设计

## 概述
实现活动模板系统，定义 5 种模板类型的表单字段配置，管理端模板选择和员工端动态表单渲染。

## 模板类型与字段定义

| 模板 | templateType | 员工填写字段 | formSchema |
|------|-------------|-------------|------------|
| 基础 | BASIC | note（可选，文本） | `[{name:"note",type:"text",required:false}]` |
| 捐赠 | DONATION | amount（必填，数字）+ message（选填，文本） | `[{name:"amount",type:"number",required:true},{name:"message",type:"text",required:false}]` |
| 志愿者 | VOLUNTEER | hours（必填，数字）+ photos（选填，图片×5） | `[{name:"hours",type:"number",required:true},{name:"photos",type:"image",required:false,max:5}]` |
| 签到 | CHECKIN | checkinTime（自动）+ photo（选填，图片） | `[{name:"photo",type:"image",required:false,max:1}]` |
| 自定义 | CUSTOM | 管理员配置的字段 | 管理员通过字段配置器自定义 |

## 数据模型
- `activity.template_type`：VARCHAR(20)，枚举值
- `activity.form_schema`：JSONB，存储模板的字段定义
- 预设模板（BASIC/DONATION/VOLUNTEER/CHECKIN）使用硬编码 schema
- CUSTOM 模板的 form_schema 由管理员配置

## 前端实现
- **模板选择器**：`components/admin/TemplateSelector.tsx`（创建活动时选择模板）
- **动态表单渲染器**：`components/DynamicForm.tsx`（根据 formSchema 动态生成表单字段）
- **字段类型映射**：text → TextInput，number → NumberInput，image → ImageUpload
- **预设 schema 常量**：`constants/templateSchemas.ts`

## 后端实现
- **TemplateType 枚举**：BASIC, DONATION, VOLUNTEER, CHECKIN, CUSTOM
- **默认 formSchema**：Service 层为预设模板自动填充 formSchema
- **CUSTOM 模板**：前端传入 formSchema，后端校验并存储

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 TemplateType 枚举
2. [x] 后端：ActivityService — 创建活动时根据 templateType 设置默认 formSchema
3. [x] 后端：CUSTOM 模板 formSchema 校验逻辑
4. [x] 前端：创建 constants/templateSchemas.ts（预设模板 schema 定义）
5. [x] 前端：创建 TemplateSelector.tsx（模板选择卡片）
6. [x] 前端：创建 DynamicForm.tsx（根据 schema 动态渲染表单）
7. [x] 前端：集成到 ActivityFormDrawer（管理端创建活动）
8. [x] 前端：集成到 SignupForm（员工端报名表单）
9. [x] 对照 spec-activity-templates.md 验收标准自检

## 引用
- 对应功能规格：spec-activity-templates.md
- 参考实现：docs/exemplar/
