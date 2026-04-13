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
  user: {
    id: number;
    username: string;
    displayName: string;
    role: string;
  };
}

async function getAuthToken(): Promise<AuthData> {
  // 先尝试登录
  const loginRes = await fetch(`${API_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: TEST_USER.username,
      password: TEST_USER.password,
    }),
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
    body: JSON.stringify({
      displayName: TEST_USER.displayName,
      username: TEST_USER.username,
      password: TEST_USER.password,
    }),
  });

  if (!registerRes.ok) {
    const errBody = await registerRes.text();
    throw new Error(`注册失败: ${registerRes.status} ${errBody}`);
  }

  const body = await registerRes.json();
  console.log('[global-setup] 注册成功');
  return body.data as AuthData;
}

async function globalSetup(config: FullConfig) {
  const storageStatePath =
    (config.projects[0]?.use?.storageState as string) ??
    './e2e/.auth/storage-state.json';

  // 确保 .auth 目录存在
  const authDir = path.dirname(storageStatePath);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 通过 API 获取认证 token
  const authData = await getAuthToken();

  // 构造 storageState JSON（模拟 localStorage 内容）
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: BASE_URL,
        localStorage: [
          { name: 'accessToken', value: authData.accessToken },
          { name: 'refreshToken', value: authData.refreshToken },
          { name: 'user', value: JSON.stringify(authData.user) },
        ],
      },
    ],
  };

  fs.writeFileSync(storageStatePath, JSON.stringify(storageState, null, 2));
  console.log(`[global-setup] 认证状态已保存: ${storageStatePath}`);
}

export default globalSetup;
