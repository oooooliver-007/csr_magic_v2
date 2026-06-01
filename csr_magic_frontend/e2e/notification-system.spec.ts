import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080';
const ADMIN_CREDENTIALS = { username: 'zhangsan', password: '123456' };
const USER_CREDENTIALS = {
  displayName: 'E2E测试员工',
  username: 'e2e_test_user',
  password: 'e2eTest123456',
};

let oldestActivityName = '';
let latestSignupActivityName = '';
let reviewApprovedActivityName = '';

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

  if (!response.ok) {
    return null;
  }

  const body = await response.json() as { data?: AuthData };
  return body.data ?? null;
}

async function loginOrRegister(credentials: { displayName: string; username: string; password: string }): Promise<AuthData> {
  const existingAuth = await login(credentials.username, credentials.password);
  if (existingAuth) {
    return existingAuth;
  }

  const registerResponse = await fetch(`${API_URL}/api/v2/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!registerResponse.ok) {
    const errorText = await registerResponse.text();
    throw new Error(`注册测试用户失败: ${registerResponse.status} ${errorText}`);
  }

  const body = await registerResponse.json() as { data?: AuthData };
  if (!body.data) {
    throw new Error('注册成功但未返回认证信息');
  }

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
      description: 'E2E notification event',
      type: 'ONLINE',
      visible: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`创建事件失败: ${response.status} ${errorText}`);
  }

  const body = await response.json() as { data?: { id?: number } };
  const eventId = body.data?.id;
  if (!eventId) {
    throw new Error('创建事件成功但未返回 id');
  }

  return eventId;
}

async function createActivity(adminToken: string, eventId: number, name: string): Promise<number> {
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
      description: 'E2E notification activity',
      templateType: 'BASIC',
      status: 'ONGOING',
      maxParticipants: 20,
      startTime: new Date(now - 60 * 60 * 1000).toISOString(),
      endTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`创建活动失败: ${response.status} ${errorText}`);
  }

  const body = await response.json() as { data?: { id?: number } };
  const activityId = body.data?.id;
  if (!activityId) {
    throw new Error('创建活动成功但未返回 id');
  }

  return activityId;
}

async function signupByApi(userToken: string, activityId: number): Promise<number> {
  const response = await fetch(`${API_URL}/api/v2/participations/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ activityId, formData: '{}' }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`报名失败: ${response.status} ${errorText}`);
  }

  const body = await response.json() as { data?: { id?: number } };
  const participationId = body.data?.id;
  if (!participationId) {
    throw new Error('报名成功但未返回参与记录 id');
  }

  return participationId;
}

async function approveParticipation(adminToken: string, participationId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/v2/participations/${participationId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ action: 'APPROVE' }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`审核失败: ${response.status} ${errorText}`);
  }
}

async function markAllNotificationsAsRead(userToken: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v2/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`全部标记已读失败: ${response.status} ${errorText}`);
  }
}

test.describe('通知系统', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const adminAuth = await login(ADMIN_CREDENTIALS.username, ADMIN_CREDENTIALS.password);
    if (!adminAuth) {
      throw new Error('管理员登录失败');
    }

    const userAuth = await loginOrRegister(USER_CREDENTIALS);
    await markAllNotificationsAsRead(userAuth.accessToken);

    const uniqueSuffix = Date.now();
    const eventId = await createEvent(adminAuth.accessToken, `E2E通知事件-${uniqueSuffix}`);

    const signupActivityNames = Array.from({ length: 5 }, (_, index) => `E2E通知报名活动-${uniqueSuffix}-${index + 1}`);
    oldestActivityName = signupActivityNames[0];
    latestSignupActivityName = signupActivityNames[4];

    for (const activityName of signupActivityNames) {
      const activityId = await createActivity(adminAuth.accessToken, eventId, activityName);
      await signupByApi(userAuth.accessToken, activityId);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    reviewApprovedActivityName = `E2E通知审核活动-${uniqueSuffix}`;
    const reviewActivityId = await createActivity(adminAuth.accessToken, eventId, reviewApprovedActivityName);
    const participationId = await signupByApi(userAuth.accessToken, reviewActivityId);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await approveParticipation(adminAuth.accessToken, participationId);
  });

  test('铃铛角标：超过 99 时显示 99+', async ({ page }) => {
    await page.route('**/api/v2/notifications/unread-count', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data: { count: 120 } }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('span').filter({ hasText: /99\+/ }).first()).toBeVisible({ timeout: 5000 });
   });

  test('点击铃铛展开最近 5 条通知，且不显示第 6 条最早通知', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: '查看通知' }).click();

    const reviewApprovedNotification = page.getByRole('button', { name: /报名审核通过/ }).filter({ hasText: reviewApprovedActivityName });
    const latestSignupNotification = page.getByRole('button', { name: /报名提交成功/ }).filter({ hasText: latestSignupActivityName });
    const oldestSignupNotification = page.getByRole('button', { name: /报名提交成功/ }).filter({ hasText: oldestActivityName });

    await expect(reviewApprovedNotification).toBeVisible({ timeout: 10000 });
    await expect(latestSignupNotification).toBeVisible({ timeout: 10000 });
    await expect(oldestSignupNotification).toHaveCount(0);
    await expect(page.getByTestId('notification-dropdown').getByRole('button', { name: /查看全部/i })).toBeVisible();
  });

  test('通知列表页按时间倒序展示，且报名与审核操作都会触发通知', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const notificationButtons = page.locator('button').filter({ hasText: /E2E通知/ });
    const approvedNotification = page.getByRole('button', { name: /报名审核通过/ }).filter({ hasText: reviewApprovedActivityName });
    const signupNotification = page.getByRole('button', { name: /报名提交成功/ }).filter({ hasText: latestSignupActivityName });

    await expect(notificationButtons.first()).toContainText(reviewApprovedActivityName);
    await expect(approvedNotification).toBeVisible();
    await expect(signupNotification).toBeVisible();
  });

  test('点击通知后自动标记已读并跳转到参与记录页', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const reviewNotification = page.locator('button').filter({ hasText: reviewApprovedActivityName }).first();
    await expect(reviewNotification).toHaveClass(/bg-\[#2EB87A\]\/\[0\.04\]/);
    await reviewNotification.click();

    await expect(page).toHaveURL(/\/my\?tab=participations/);
    await expect(page.getByRole('button', { name: '参与记录' })).toHaveClass(/text-\[#2EB87A\]/);

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button').filter({ hasText: reviewApprovedActivityName }).first()).not.toHaveClass(/bg-\[#2EB87A\]\/\[0\.04\]/);
  });

  test('全部标记已读功能正常', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const latestNotification = page.locator('button').filter({ hasText: latestSignupActivityName }).first();
    await expect(latestNotification).toHaveClass(/bg-\[#2EB87A\]\/\[0\.04\]/);

    await page.getByRole('button', { name: '全部标记已读' }).click();
    await expect(page.getByText('已全部标记为已读')).toBeVisible({ timeout: 10000 });
    await expect(latestNotification).not.toHaveClass(/bg-\[#2EB87A\]\/\[0\.04\]/);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '查看通知' }).locator('span')).toHaveCount(0);
  });
});

test.describe('通知系统未登录拦截', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('未登录访问 /notifications 应重定向到 /login', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/login/);
  });
});
