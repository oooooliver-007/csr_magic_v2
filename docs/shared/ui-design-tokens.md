# UI 设计令牌与原型参考

> 所有前端页面必须遵循本文档定义的设计令牌和组件模式。
> UI/UX 原型源码位于 `UI_UX_prototype/`，是前端交互设计的权威参考。

## 一、设计令牌

### 颜色

| 令牌名 | 值 | 用途 |
|--------|---|------|
| primary | `#2EB87A` | 主按钮、链接、高亮、活跃状态 |
| primary-dark | `#249663` | 渐变按钮深色端 |
| accent | `#FFB347` | 强调色、海报 CTA、volunteer 徽章 |
| bg-base | `#F7FAF8` | 页面背景 |
| text-primary | `#1A2E22` | 主文字色 |
| text-secondary | `#1A2E22` 60% opacity | 副文字色（`text-[#1A2E22]/60`） |
| border | `#E5E7EB` / `gray-100` | 输入框边框 / 卡片边框 |
| danger | `red-500` / `red-600` | 错误、拒绝、删除 |
| chart-1 | `#FFB347` | 图表色 - Volunteer |
| chart-2 | `#2EB87A` | 图表色 - Donation |
| chart-3 | `#3B82F6` | 图表色 - Check-in |
| chart-4 | `#6B7280` | 图表色 - General |

### 圆角

| 元素 | TailwindCSS | 像素值 |
|------|------------|--------|
| 卡片 / 面板 | `rounded-2xl` | 16px |
| 按钮 / 输入框 / 筛选器 | `rounded-xl` | 12px |
| 头像 | `rounded-full` | 50% |
| 徽章 | `rounded-full` | 50% |
| 大面板 | `rounded-3xl` | 24px |

### 阴影

| 元素 | TailwindCSS |
|------|------------|
| 卡片 | `shadow-sm` |
| 弹出面板 / Drawer | `shadow-xl` / `shadow-2xl` |
| 悬浮状态 | `shadow-md`（hover:shadow-md） |

### 排版

| 元素 | 大小 | 字重 |
|------|------|------|
| 页面标题 | `text-3xl` / `text-2xl` | `font-bold` |
| 卡片标题 | `text-xl` / `text-lg` | `font-bold` |
| 正文 | `text-sm` | `font-normal` |
| 标签 / 提示 | `text-xs` | `font-medium` |
| 统计数字 | `text-4xl` / `text-3xl` | `font-bold` |

## 二、全局布局模式

### 员工端布局（EmployeeApp）
- **顶部导航栏**：白色背景 `sticky top-0`，左侧 Logo + 导航链接，右侧通知铃铛 + 头像
- **内容区**：`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- **移动端底栏**：固定底部 CTA 按钮（`fixed bottom-0`，`bg-white/80 backdrop-blur-md`）
- 原型参考：`UI_UX_prototype/src/components/EmployeeApp.tsx` 第 5-67 行

### 管理端布局（AdminApp）
- **固定左侧边栏**：`w-64` 白色背景，顶部 Logo，垂直菜单项，底部用户信息
- **右侧主区域**：`ml-64`，顶部面包屑 header + 内容区 `p-8`
- **Loading 骨架屏**：`DashboardSkeleton` 用 `animate-pulse` 灰色块
- 原型参考：`UI_UX_prototype/src/components/AdminApp.tsx` 第 12-111 行

## 三、公共组件模式

### Badge 徽章
- 4 种类型：`donation`（🌱 绿）、`volunteer`（🧡 橙）、`check-in`（✅ 蓝）、`general`（📋 灰）
- 样式：`rounded-full` + emoji 图标 + 文字，背景色为类型色 10% 透明度
- 原型参考：`UI_UX_prototype/src/components/Badge.tsx`

### StatCard 统计卡片
- 白色卡片，包含标题（灰色小字）、数值（大号粗体）、趋势标签（绿色背景小字）
- 原型参考：`AdminApp.tsx` 第 310-319 行

### 数据表格
- 白色圆角卡片包裹，`thead` 灰色背景小号大写标题
- 行 hover 效果 `hover:bg-gray-50/50`
- Checkbox 选择 + 批量操作按钮
- 底部分页：`Prev` `1` `2` `3` `Next`

### Drawer 抽屉
- 从右侧滑入（`fixed inset-y-0 right-0 w-96`）
- 背景遮罩（`bg-[#1A2E22]/20 backdrop-blur-sm`）
- 顶部标题 + 关闭按钮，底部操作按钮

### SidePanel 侧面板
- 用于详情展示（如用户详情）
- 绝对定位在右侧（`absolute top-0 right-0 w-[400px]`）
- 进入动画 `animate-in slide-in-from-right-8`

## 四、原型组件完整映射表

| 模块 | 功能 | 原型文件 | 行范围 | 关键 UI 元素 |
|------|------|---------|--------|-------------|
| auth | login-register | `LoginPage.tsx` | 1-38 | 居中卡片、Logo、双按钮（员工/管理员） |
| activity | activity-list | `EmployeeApp.tsx` | 202-278 | 搜索框、横向滚动筛选标签、3列卡片网格 |
| activity | activity-detail | `EmployeeApp.tsx` | 280-430 | 全宽封面图、左侧详情+右侧粘性报名卡、移动端底栏 |
| activity | activity-crud | `AdminApp.tsx` | 322-547 | 筛选栏+表格、右侧 Drawer 创建表单（含封面上传） |
| participation | signup | `AdminApp.tsx` | 557-757 | Checkbox 表格、批量审批/拒绝、可展开详情行 |
| dashboard | stats-charts | `AdminApp.tsx` | 153-320 | 4 列 StatCard、折线图+饼图、Top 员工表+活动进度条 |
| user-management | user-crud | `AdminApp.tsx` | 768-1046 | 表格+右侧 SidePanel（用户详情+CSR统计+权限开关） |
| user-profile | my-participations | `EmployeeApp.tsx` | 69-200 | 统计卡片、时间线、CTA 海报生成卡 |
| ai-poster | poster-studio | `EmployeeApp.tsx` | 548-667 | 左侧控制面板（输入+风格选择）、右侧预览+下载/分享 |
| ai-chat-registration | chat-ui | `EmployeeApp.tsx` | 432-546 | 全屏聊天容器、AI/用户气泡、底部输入框、完成后按钮组 |
| — | 全局·员工端布局 | `EmployeeApp.tsx` | 5-67 | 顶部导航、移动端汉堡菜单、通知铃铛 |
| — | 全局·管理端布局 | `AdminApp.tsx` | 12-111 | 固定侧边栏、面包屑 header、骨架屏 |

> **注意**：event（事件 CRUD）、notification（通知系统）、user-profile/profile-settings 暂无原型覆盖。
