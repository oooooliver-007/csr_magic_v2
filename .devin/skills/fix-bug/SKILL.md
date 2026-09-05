---
name: fix-bug
description: |
  CSR Magic 项目 Bug 修复 Skill。引导定位问题根因、最小化修复、回归验证和文档更新。
  当用户提到"修复 Bug"、"fix bug"、"修 Bug"、"有个问题"、"报错了"、"页面异常"、
  "接口报错"、"功能不正常"等与 Bug 修复相关的表述时，使用此 Skill。
  即使用户只是说"登录报错"或"列表不显示"这样简短的描述，也应触发此 Skill。
---

# CSR Magic — Bug 修复 Skill

你是 CSR Magic 项目的 AI 开发工程师。本 Skill 指导你通过根因分析、最小化修复、
回归验证和文档更新完成 Bug 修复。

## 阶段 1：定位问题

### 1.1 收集信息
向用户确认以下信息（如果用户未提供）：
- Bug 的复现步骤
- 预期行为 vs 实际行为
- 涉及的页面/API/模块
- 错误信息（控制台报错、HTTP 状态码等）

### 1.2 加载上下文
根据 Bug 涉及的模块，按需加载：
1. 读取 `agent.md` 了解项目架构
2. 读取 `docs/modules/{module}/_index.md` 了解模块结构
3. 读取 `docs/modules/{module}/design-{feature}.md` 了解技术实现
4. 根据 design 的 Context Manifest 加载所需 shared docs
5. 读取对应服务的 `.windsurfrules` 了解编码规范
6. 如果是 UI Bug，读取 design 中 `ui_prototype` 声明的原型文件对应行范围，对照原型确认预期 UI 行为

### 1.3 根因分析
- 定位问题的 **根因**，而非表面症状
- 添加日志或使用调试手段辅助排查（如需要）
- 优先考虑最小上游修复，避免下游打补丁
- 向用户简要报告根因分析结果

## 阶段 2：修复

### 2.1 编码修复
- **最小化修改范围**：只改必要的代码，能改一行就不改两行
- **不修改或删除现有测试用例**（除非测试本身有误）
- **必须补充回归测试**：新增能复现该 Bug 的测试用例，确保修复后该用例通过，防止未来回退
- 遵循 `.windsurfrules` 和 `docs/shared/coding-standards.md` 编码规范
- Guard Rails 检查：无 `any` 类型、无硬编码、有错误处理

### 2.2 文档同步
如修复涉及以下变更，同步更新文档：

| 变更类型 | 更新文档 |
|---------|---------|
| API 行为变化 | `docs/shared/api-contracts.md` |
| 数据模型变化 | `docs/shared/data-models.md` |
| 架构层面修复 | `agent.md` 的 Decision Log |

## 阶段 3：验证

### 3.1 回归检查
- 确认 Bug 已修复（按复现步骤验证）
- 确认没有引入新问题
- 对照相关 `spec-*.md` 验收标准确认功能完整性

### 3.2 完成报告
输出修复报告：
```
🔧 Bug 修复完成
- 模块：{module} / 功能：{feature}
- 根因：{root_cause_summary}
- 修复：{fix_summary}
- 影响范围：{affected_files}
- 回归验证：通过 ✅
- 建议 commit message：fix({module}): {description}
```

## 阶段 4：经验沉淀

当 Bug 暴露出规范或测试策略盲区时，执行以下更新，防止同类问题再次发生：

### 4.1 判断是否需要沉淀

满足以下任一条件即需沉淀：
- 现有测试未覆盖到该 Bug 场景（测试盲区）
- 现有编码规范/设计文档未约束导致该 Bug 的编码模式（规范盲区）
- 问题涉及跨服务/跨层交互的隐含约定（架构盲区）

### 4.2 更新对象

| 经验类型 | 更新目标 |
|---------|---------|
| 技术决策/架构约定 | `agent.md` Decision Log |
| 功能设计约束 | `docs/modules/{module}/design-*.md` |
| 通用编码规范 | `docs/shared/coding-standards.md` |
| 测试策略改进 | `implement-feature` Skill 的测试阶段 |
| 新增 API 子流程 | `implement-feature/references/sub-procedures.md` |

### 4.3 完成报告中体现

在修复报告中增加经验沉淀项：
```
📝 经验沉淀：
- 更新了 {file}：{what_was_added}
```

## 重要提醒

- 所有文档、注释使用中文；代码变量名、函数名、API 路径使用英文
- 修复前必须先定位根因，不盲目改代码
- 优先最小上游修复，避免在多个位置打补丁
- Commit message 使用 `fix:` 前缀
- Bug 修复后必须判断是否需要经验沉淀，防止同类问题复发
