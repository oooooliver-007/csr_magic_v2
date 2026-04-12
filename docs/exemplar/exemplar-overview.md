# 参考实现样本 — 使用说明

## 为什么需要 Exemplar

抽象规则难以覆盖所有编码细节。**一个具体的参考实现比 100 行规则更有效**。Agent 通过"看样学样"，能准确复制项目的编码模式和分层结构。

## 何时使用

- **首次实现某类功能时**必须参考（.windsurfrules 中有明确指令）
- 实现 CRUD 类功能时，参考后端分层和前端组件结构
- 不确定项目约定时，以 exemplar 为准

## Exemplar 选取标准

选择 **Event（事件）模块** 作为参考实现样本，原因：
1. 包含完整的 CRUD 操作（增删改查）
2. 涉及前后端全链路（Controller → Service → Repository → 前端 Service → 页面组件）
3. 复杂度中等，适合作为模板推广到其他模块
4. 包含管理端表格 + 搜索筛选 + 抽屉编辑等常用模式

## 文件索引

| 文件 | 内容 |
|------|------|
| `exemplar-frontend.md` | 前端参考：组件结构、API Service 封装、页面组件代码片段 |
| `exemplar-backend.md` | 后端参考：Entity、Repository、Service、Controller、DTO 代码片段 |

## 使用方法

1. 阅读本文件了解 exemplar 的选取逻辑
2. 根据要实现的功能涉及的服务，阅读对应的 exemplar 文件
3. 模仿 exemplar 中的分层结构、命名模式和代码风格
4. 在 exemplar 基础上根据 design-*.md 的具体要求进行调整
