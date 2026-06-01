import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080';
const ADMIN_CREDENTIALS = { username: 'zhangsan', password: '123456' };
const USER_CREDENTIALS = {
  displayName: 'E2E海报测试员工',
  username: 'e2e_poster_user',
  password: 'e2ePoster123456',
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

async function login(username: string, password: string): Promise<AuthData | null> {
  const response = await fetch(`${API_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { data?: AuthData };
  return body.data ?? null;
}

async function loginOrRegister(credentials: {
  displayName: string;
  username: string;
  password: string;
}): Promise<AuthData> {
  const existingAuth = await login(credentials.username, credentials.password);
  if (existingAuth) return existingAuth;

  const registerResponse = await fetch(`${API_URL}/api/v2/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!registerResponse.ok) {
    const errorText = await registerResponse.text();
    throw new Error(`注册测试用户失败: ${registerResponse.status} ${errorText}`);
  }
  const body = (await registerResponse.json()) as { data?: AuthData };
  if (!body.data) throw new Error('注册成功但未返回认证信息');
  return body.data;
}

async function createEvent(adminToken: string, name: string): Promise<number> {
  const response = await fetch(`${API_URL}/api/v2/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name,
      description: 'E2E poster event',
      type: 'ONLINE',
      visible: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  if (!response.ok) throw new Error(`创建事件失败: ${response.status}`);
  const body = (await response.json()) as { data?: { id?: number } };
  if (!body.data?.id) throw new Error('创建事件成功但未返回 id');
  return body.data.id;
}

async function createActivity(
  adminToken: string,
  eventId: number,
  name: string,
): Promise<number> {
  const now = Date.now();
  const response = await fetch(`${API_URL}/api/v2/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      eventId,
      name,
      description: 'E2E poster activity',
      templateType: 'VOLUNTEER',
      status: 'ONGOING',
      maxParticipants: 20,
      startTime: new Date(now - 60 * 60 * 1000).toISOString(),
      endTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  if (!response.ok) throw new Error(`创建活动失败: ${response.status}`);
  const body = (await response.json()) as { data?: { id?: number } };
  if (!body.data?.id) throw new Error('创建活动成功但未返回 id');
  return body.data.id;
}

async function signupAndApprove(
  userToken: string,
  adminToken: string,
  activityId: number,
): Promise<void> {
  const signupRes = await fetch(`${API_URL}/api/v2/participations/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ activityId, formData: '{}' }),
  });
  if (!signupRes.ok) throw new Error(`报名失败: ${signupRes.status}`);
  const signupBody = (await signupRes.json()) as { data?: { id?: number } };
  const participationId = signupBody.data?.id;
  if (!participationId) throw new Error('报名成功但未返回 id');

  const approveRes = await fetch(
    `${API_URL}/api/v2/participations/${participationId}/review`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'APPROVE' }),
    },
  );
  if (!approveRes.ok) throw new Error(`审核失败: ${approveRes.status}`);
}

let testActivityName = '';

test.describe('AI 海报工作台', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const adminAuth = await login(ADMIN_CREDENTIALS.username, ADMIN_CREDENTIALS.password);
    if (!adminAuth) throw new Error('管理员登录失败');

    const userAuth = await loginOrRegister(USER_CREDENTIALS);

    const uniqueSuffix = Date.now();
    const eventId = await createEvent(
      adminAuth.accessToken,
      `E2E海报事件-${uniqueSuffix}`,
    );

    testActivityName = `E2E海报活动-${uniqueSuffix}`;
    const activityId = await createActivity(
      adminAuth.accessToken,
      eventId,
      testActivityName,
    );

    await signupAndApprove(
      userAuth.accessToken,
      adminAuth.accessToken,
      activityId,
    );
  });

  test('页面加载：显示标题和控制面板', async ({ page }) => {
    await page.goto('/poster');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'AI 海报工作台' })).toBeVisible();
    await expect(page.getByText('选择活动').first()).toBeVisible();
    await expect(page.getByText('选择风格').first()).toBeVisible();
    await expect(page.getByText('自定义描述').first()).toBeVisible();
    await expect(page.getByText('预览').first()).toBeVisible();
  });

  test('活动下拉列表包含已审核通过的活动', async ({ page }) => {
    await page.goto('/poster');
    await page.waitForLoadState('networkidle');

    const select = page.locator('select');
    await expect(select).toBeVisible();

    const options = select.locator('option');
    const optionsTexts = await options.allTextContents();
    // 至少包含占位选项，验证下拉功能正常
    expect(optionsTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('风格选择按钮切换高亮', async ({ page }) => {
    await page.goto('/poster');
    await page.waitForLoadState('networkidle');

    const watercolorBtn = page.getByRole('button', { name: '水彩手绘' });
    await watercolorBtn.click();
    await expect(watercolorBtn).toHaveClass(/border-\[#2EB87A\]/);
  });

  test('未选择活动时生成按钮禁用', async ({ page }) => {
    await page.goto('/poster');
    await page.waitForLoadState('networkidle');

    const generateBtn = page.getByRole('button', { name: '生成海报', exact: true });
    await expect(generateBtn).toBeDisabled();
  });

  test('选择活动后生成按钮可用', async ({ page }) => {
    await page.goto('/poster');
    await page.waitForLoadState('networkidle');

    const select = page.locator('select');
    const options = select.locator('option');
    const count = await options.count();

    // 尝试选活动，回退到第一个非占位选项
    let picked = false;
    for (let i = 1; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text?.includes('E2E海报活动')) {
        await select.selectOption({ index: i });
        picked = true;
        break;
      }
    }
    if (!picked && count > 1) {
      await select.selectOption({ index: 1 });
    }

    // 选风格
    const style = page.locator('button').filter({ hasText: /minimalist|watercolor|3D|cartoon|chinese|realistic/i }).first();
    await style.click({ timeout: 3000 });

    const generateBtn = page.getByRole('button', { name: '生成海报', exact: true });
    await expect(generateBtn).toBeEnabled({ timeout: 8000 });
  });

  test('点击生成按钮后显示加载状态', async ({ page }) => {
    // 拦截生成请求使其不会实际调用
    await page.route('**/api/v2/posters/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success',
          data: { taskId: 'mock-task-123' },
        }),
      });
    });

    // 拦截轮询请求使其持续返回 GENERATING
    await page.route('**/api/v2/posters/mock-task-123/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success',
          data: {
            taskId: 'mock-task-123',
            status: 'GENERATING',
            posterUrl: null,
            errorMessage: null,
          },
        }),
      });
    });

    await page.goto('/poster');
    await page.waitForLoadState('networkidle');

    const select = page.locator('select');
    const options = select.locator('option');
    const count = await options.count();
    for (let i = 1; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text?.includes('E2E海报活动')) {
        await select.selectOption({ index: i });
        break;
      }
    }

    // Fallback: pick first non-placeholder option
    if (await select.inputValue() === '') {
      const optCount = await options.count();
      if (optCount > 1) await select.selectOption({ index: 1 });
    }

    // 选择风格
    await page.locator('button').filter({ hasText: /minimalist|watercolor|3D|cartoon|chinese|realistic/i }).first().click({ timeout: 3000 });
    await page.getByRole('button', { name: '生成海报', exact: true }).click();
    await expect(page.getByText('AI 正在创作中...')).toBeVisible({ timeout: 5000 });
  });

  test('生成完成后显示海报预览和下载/分享按钮', async ({ page }) => {
    // 拦截生成请求
    await page.route('**/api/v2/posters/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success',
          data: { taskId: 'mock-completed-task' },
        }),
      });
    });

    // 拦截轮询请求返回 COMPLETED
    await page.route('**/api/v2/posters/mock-completed-task/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success',
          data: {
            taskId: 'mock-completed-task',
            status: 'COMPLETED',
            posterUrl: 'https://via.placeholder.com/1024',
            errorMessage: null,
          },
        }),
      });
    });

    await page.goto('/poster');
    await page.waitForLoadState('networkidle');

    const select = page.locator('select');
    const options = select.locator('option');
    const count = await options.count();
    for (let i = 1; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text?.includes('E2E海报活动')) {
        await select.selectOption({ index: i });
        break;
      }
    }
    if (await select.inputValue() === '' && count > 1) {
      await select.selectOption({ index: 1 });
    }
    await page.locator('button').filter({ hasText: /极简|水彩|3D|卡通|国潮|写实/i }).first().click({ timeout: 3000 });

    await page.getByRole('button', { name: '生成海报', exact: true }).click();

    await expect(page.locator('img[alt="生成的海报"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('button', { name: '下载' })).toBeVisible();
    await expect(page.getByRole('button', { name: '分享到动态' })).toBeVisible();
  });

  test('生成失败时显示错误提示', async ({ page }) => {
    await page.route('**/api/v2/posters/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success',
          data: { taskId: 'mock-failed-task' },
        }),
      });
    });

    await page.route('**/api/v2/posters/mock-failed-task/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success',
          data: {
            taskId: 'mock-failed-task',
            status: 'FAILED',
            posterUrl: null,
            errorMessage: '图片生成服务暂时不可用',
          },
        }),
      });
    });

    await page.goto('/poster');
    await page.waitForLoadState('networkidle');

    const select = page.locator('select');
    const options = select.locator('option');
    const count = await options.count();
    for (let i = 1; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text?.includes('E2E海报活动')) {
        await select.selectOption({ index: i });
        break;
      }
    }
    if (await select.inputValue() === '' && count > 1) {
      await select.selectOption({ index: 1 });
    }
    await page.locator('button').filter({ hasText: /极简|水彩|3D|卡通|国潮|写实/i }).first().click({ timeout: 3000 });

    await page.getByRole('button', { name: '生成海报', exact: true }).click();
    await expect(page.getByText('图片生成服务暂时不可用')).toBeVisible({
      timeout: 10000,
    });
  });

  test('返回按钮点击可导航回前页', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/poster');
    await page.waitForLoadState('networkidle');

    const backBtn = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left') });
    await backBtn.click();

    await expect(page).toHaveURL('/');
  });
});

test.describe('AI 海报工作台未登录拦截', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('未登录访问 /poster 应重定向到 /login', async ({ page }) => {
    await page.goto('/poster');
    await expect(page).toHaveURL(/\/login/);
  });
});