---
name: e2e-test
description: |
  CSR Magic 项目 Playwright E2E 端到端测试 Skill。使用本地 Playwright CLI 编写和运行 E2E 测试，
  覆盖页面渲染、业务流程、认证拦截和响应式布局等场景。
  当用户提到"E2E 测试"、"端到端测试"、"Playwright 测试"、"跑 E2E"、"写 E2E"、
  "集成测试"、"页面测试"、"浏览器测试"等与 E2E 测试相关的表述时，使用此 Skill。
  即使用户只是说"测一下页面"或"验证功能"这样简短的请求，只要涉及浏览器级验证，也应触发此 Skill。
  本 Skill 也会被 implement-feature Skill 的阶段 4.2 引用。
---

# CSR Magic — Playwright E2E 测试 Skill

你是 CSR Magic 项目的 AI 测试工程师。本 Skill 指导你使用 **本地 Playwright CLI**
（`npx playwright test`）编写和运行端到端测试，替代 Playwright MCP 的手动交互模式。

## 为什么用 Playwright CLI 而非 MCP

- **可重复**：测试脚本保存在 `e2e/` 目录，任何人可随时重跑
- **可并行**：CLI 支持并行执行多个测试文件，MCP 只能单步操作
- **可 CI**：CLI 测试可直接集成到 CI/CD 流水线
- **无手动步骤**：global-setup 自动完成登录、token 存储

## 阶段 1：环境准备

### 1.1 检查 Playwright 安装

```bash
# 确认 @playwright/test 在 devDependencies 中
cat csr_magic_frontend/package.json | grep playwright

# 如果未安装
npm install -D @playwright/test
```

**浏览器选择策略**（按优先级）：
1. **使用系统 Edge**（推荐）：Windows 自带，无需下载。在 `playwright.config.ts` 中设置 `channel: 'msedge'`
2. **使用系统 Chrome**：如已安装，设置 `channel: 'chrome'`
3. **下载 Chromium**：`npx playwright install chromium`（约 180MB，国内可能很慢）
   - 如需镜像：`$env:PLAYWRIGHT_DOWNLOAD_HOST="https://npmmirror.com/mirrors/playwright"; npx playwright install chromium`
   - 注意：镜像可能缺少最新版本

### 1.2 确认 playwright.config.ts

检查 `csr_magic_frontend/playwright.config.ts` 是否存在且配置正确。
如果缺失，参考 `references/playwright-setup.md` 创建。

关键配置项：
- `testDir: './e2e'` — 测试目录
- `baseURL` — 前端地址（与 vite.config.ts 的 server.port 一致）
- `globalSetup` — 自动登录脚本路径
- `use.storageState` — 保存的认证状态文件路径

### 1.3 确认 global-setup.ts

`e2e/global-setup.ts` 负责在所有测试运行前自动完成登录，保存认证状态。
如果缺失，参考 `references/playwright-setup.md` 的 global-setup 模板创建。

**推荐使用 API 方式**（而非 UI 登录）：
1. 用 `fetch()` 调用后端 `/api/v2/auth/login` 登录（如用户不存在则 `/api/v2/auth/register` 注册）
2. 将返回的 token 构造为 `storageState` JSON 文件（含 localStorage 条目）
3. 后续测试自动复用该 token，无需每个测试单独登录

> **经验教训**：UI 登录方式（通过 `page.fill()` + `page.click()`）在 react-hook-form 中
> 可能因为 `fill()` 未触发 React 的 onChange 事件而导致表单验证不通过。
> API 方式更可靠、更快速。

### 1.4 端口与 CORS 一致性检查

在启动服务前，**必须先确认端口一致性**：
1. 读取 `vite.config.ts` 中的 `server.port`（默认 3000）
2. 读取后端 `SecurityConfig.java` 中 CORS `setAllowedOrigins`
3. **验证**：前端端口必须在 CORS 白名单中

## 阶段 2：编写 E2E 测试

### 2.1 测试文件位置与命名

- 路径：`csr_magic_frontend/e2e/{feature}.spec.ts`
- 命名：`{feature}.spec.ts`，如 `activity-list.spec.ts`

### 2.2 测试场景设计

根据 `spec-*.md` 的验收标准，设计对应的测试场景，至少覆盖：

| 类别 | 示例 |
|------|------|
| 页面渲染 | 标题、搜索框、筛选按钮正确展示 |
| 正常业务 | 提交表单、搜索筛选、列表分页、跳转导航 |
| 异常流程 | 表单校验失败、搜索无结果空状态 |
| 认证拦截 | 未登录访问受保护页面应重定向到 /login |
| 响应式 | 移动端视口下布局切换（折叠筛选、单列卡片） |

### 2.3 编写规范

```typescript
import { test, expect } from '@playwright/test';

test.describe('功能模块名称', () => {
  // 如需登录态，globalSetup 已自动处理
  // 如需特定页面，在 beforeEach 中导航
  test.beforeEach(async ({ page }) => {
    await page.goto('/target-path');
    await page.waitForLoadState('networkidle');
  });

  test('场景描述', async ({ page }) => {
    // 使用 page.getByRole / getByText / getByPlaceholder 定位元素
    // 优先使用语义化选择器，避免 CSS selector
    await expect(page.getByRole('heading', { name: '标题' })).toBeVisible();
  });
});
```

**关键规则**：
- 使用中文描述测试场景名称
- 使用 `getByRole`、`getByText`、`getByPlaceholder` 等语义化选择器
- 等待策略：优先用 `waitForLoadState('networkidle')` 或 `expect().toBeVisible()`
- 避免硬编码 `waitForTimeout`，除非测试防抖输入
- 响应式测试使用 `page.setViewportSize()` 切换视口

### 2.4 认证相关测试

测试未登录拦截时，创建不使用 `storageState` 的独立测试：

```typescript
test.describe('未登录拦截', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('未登录访问 /activities 应重定向到 /login', async ({ page }) => {
    await page.goto('/activities');
    await expect(page).toHaveURL(/\/login/);
  });
});
```

## 阶段 3：启动服务并运行测试

### 3.1 启动前后端服务

```
Step 1: 检查端口占用
  netstat -ano | findstr "LISTENING" | findstr ":8080 :3000"

Step 2: 如果后端未运行 → 启动后端
  cwd: csr_magic_backend/
  mvn spring-boot:run --no-transfer-progress
  （非阻塞，WaitMsBeforeAsync=20000）
  确认日志出现 "Tomcat started on port 8080"

Step 3: 如果前端未运行 → 启动前端
  cwd: csr_magic_frontend/
  npm run dev
  （非阻塞，WaitMsBeforeAsync=5000）
  确认日志出现 "ready in" + 正确端口号

Step 4: 二次确认两个端口都 LISTENING
```

### 3.2 运行测试

```bash
# 运行所有 E2E 测试
npx playwright test

# 运行指定测试文件
npx playwright test e2e/activity-list.spec.ts

# 带 UI 模式调试（本地开发时有用）
npx playwright test --ui

# 查看测试报告
npx playwright show-report
```

### 3.3 结果判读

- **全部通过** ✅：输出通过的测试数量，继续下一步
- **部分失败** ❌：
  1. 检查失败测试的截图（`test-results/` 目录）
  2. 判断是 Bug 还是测试问题
  3. 修复后重跑
  4. 如果是 API 500 错误，检查后端控制台日志

## 阶段 4：结果报告

输出 E2E 测试报告：

```
🧪 Playwright E2E 测试结果
- 测试文件：{N} 个
- 测试用例：{passed}/{total} 通过
- 失败用例：{list_if_any}
- 耗时：{duration}
```

## 常见问题速查

| 问题 | 原因 | 解决 |
|------|------|------|
| `npx playwright install` 下载慢 | CDN 网络问题 | 设置 `PLAYWRIGHT_DOWNLOAD_HOST` 环境变量使用镜像 |
| CORS 错误导致 API 全部 500 | 前端端口不在 CORS 白名单 | 确保 vite.config.ts 的 port 在 SecurityConfig CORS 中 |
| 登录后跳转 /login | Zustand 未从 localStorage 恢复 | 确保 authStore 初始化时同步读取 localStorage |
| `Cannot find module '@playwright/test'` | 未安装 Playwright | `npm install -D @playwright/test` |
| `Executable doesn't exist` | 未安装浏览器 | `npx playwright install chromium` |
| PowerShell 下 mvn `-D` 报错 | PowerShell 解析 `-D` 为参数 | 引号包裹：`"-Dtest=..."` |
| 测试中 `page.goto()` 后登录态丢失 | 全页面刷新重置 Zustand | 确保 authStore 有同步 loadInitialAuth |

## 与 implement-feature Skill 的关系

本 Skill 被 `implement-feature` Skill 的阶段 4.2（Playwright E2E 测试）引用。
当 implement-feature 流程执行到 E2E 测试步骤时，按本 Skill 的阶段 1→4 执行。
