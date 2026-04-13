# Playwright 配置参考

> 本文件提供 CSR Magic 项目 Playwright CLI 测试的标准配置模板和 global-setup 实现。

## 1. playwright.config.ts 模板

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1,       // 串行执行，避免端口冲突和数据竞争
  reporter: 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',   // 与 vite.config.ts server.port 一致
    headless: true,
    channel: 'msedge',  // 使用系统 Edge，无需下载 Chromium
    storageState: './e2e/.auth/storage-state.json',
    trace: 'on-first-retry',
  },
});
```

**配置说明**：
- `globalSetup`：在所有测试之前执行一次，负责注册/登录并保存认证状态
- `storageState`：保存 localStorage 的 JSON 文件，所有测试自动复用
- `workers: 1`：串行执行避免数据竞争，可在测试稳定后改为并行
- `baseURL`：**必须**与 `vite.config.ts` 的 `server.port` 一致

## 2. e2e/global-setup.ts 模板（API 方式 — 推荐）

> **为什么用 API 而非 UI**：react-hook-form 的表单在 `page.fill()` 后可能不触发
> React 的 onChange 事件，导致注册/登录表单验证不通过。API 方式直接调用后端，更可靠。

```typescript
import * as fs from 'fs';
import * as path from 'path';
import type { FullConfig } from '@playwright/test';

const API_URL = 'http://localhost:8080';
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  displayName: 'E2E测试员工',
  username: 'e2e_test_user',
  password: 'e2eTest123456',
};

interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: { id: number; username: string; displayName: string; role: string };
}

async function getAuthToken(): Promise<AuthData> {
  // 先尝试登录
  const loginRes = await fetch(`${API_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TEST_USER.username, password: TEST_USER.password }),
  });
  if (loginRes.ok) {
    const body = await loginRes.json();
    console.log('[global-setup] 登录成功');
    return body.data as AuthData;
  }

  // 登录失败，注册新用户
  console.log('[global-setup] 登录失败，注册测试账号...');
  const registerRes = await fetch(`${API_URL}/api/v2/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  });
  if (!registerRes.ok) throw new Error(`注册失败: ${registerRes.status}`);
  const body = await registerRes.json();
  console.log('[global-setup] 注册成功');
  return body.data as AuthData;
}

async function globalSetup(config: FullConfig) {
  const storageStatePath =
    (config.projects[0]?.use?.storageState as string) ?? './e2e/.auth/storage-state.json';
  const authDir = path.dirname(storageStatePath);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const authData = await getAuthToken();

  // 构造 storageState JSON（模拟 localStorage）
  const storageState = {
    cookies: [],
    origins: [{
      origin: BASE_URL,
      localStorage: [
        { name: 'accessToken', value: authData.accessToken },
        { name: 'refreshToken', value: authData.refreshToken },
        { name: 'user', value: JSON.stringify(authData.user) },
      ],
    }],
  };
  fs.writeFileSync(storageStatePath, JSON.stringify(storageState, null, 2));
  console.log(`[global-setup] 认证状态已保存: ${storageStatePath}`);
}

export default globalSetup;
```

**工作流程**：
1. 调用后端 API 登录/注册 → 获取 token
2. 构造 `storageState` JSON 文件（含 localStorage 条目）
3. 后续所有测试自动使用保存的 token，无需重复登录
4. 无需启动浏览器，执行更快

## 3. .gitignore 条目

将以下内容添加到 `csr_magic_frontend/.gitignore`：

```
# Playwright
e2e/.auth/
test-results/
playwright-report/
```

## 4. package.json 脚本

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:report": "playwright show-report"
  }
}
```

## 5. 目录结构

```
csr_magic_frontend/
├── e2e/
│   ├── .auth/                    # gitignored, 存放 storage-state.json
│   ├── global-setup.ts           # 测试前自动登录
│   ├── activity-list.spec.ts     # 活动列表 E2E 测试
│   └── activity-templates.spec.ts # 活动模板 E2E 测试
├── playwright.config.ts          # Playwright 配置
└── test-results/                 # gitignored, 测试截图和 trace
```

## 6. 注意事项

### 6.1 authStore 同步初始化

CSR Magic 的 `authStore` 必须在 zustand store 初始化时同步从 localStorage 读取 token，
而不是在 `useEffect` 中异步调用 `loadFromStorage()`。否则：
- `storageState` 中保存的 token 会被正确注入到 localStorage
- 但 PrivateRoute 在首次渲染时 `isAuthenticated` 仍为 false
- 导致页面被重定向到 /login

**正确实现**（`stores/authStore.ts`）：
```typescript
function loadInitialAuth() {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (accessToken && userStr) {
      return { accessToken, user: JSON.parse(userStr), isAuthenticated: true };
    }
  } catch { /* ignore */ }
  return { accessToken: null, user: null, isAuthenticated: false };
}

export const useAuthStore = create((set) => ({
  ...loadInitialAuth(),   // 同步初始化
  // ...
}));
```

### 6.2 react-hook-form 与 Playwright fill

`page.fill()` 可能不触发 react-hook-form 的 change 事件。如果遇到此问题：
- 使用 `page.getByRole('textbox', { name }).pressSequentially('text')` 逐字输入
- 或使用 `page.getByRole('textbox', { name }).fill('text')` 后再 `blur()`

### 6.3 Chromium 下载加速

如果 `npx playwright install chromium` 下载慢，设置镜像：
```bash
# Windows PowerShell
$env:PLAYWRIGHT_DOWNLOAD_HOST="https://npmmirror.com/mirrors/playwright"
npx playwright install chromium
```
