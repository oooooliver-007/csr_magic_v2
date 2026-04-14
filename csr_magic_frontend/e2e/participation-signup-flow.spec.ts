import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080';
const ADMIN_CREDENTIALS = { username: 'zhangsan', password: '123456' };
const USER_CREDENTIALS = {
  displayName: 'E2E测试员工',
  username: 'e2e_test_user',
  password: 'e2eTest123456',
};
const CAPACITY_USER_CREDENTIALS = {
  displayName: 'E2E容量用户',
  username: 'e2e_capacity_user',
  password: 'e2eCapacity123456',
};

let signupActivityId = '';
let withdrawActivityId = '';
let fullActivityId = '';

async function login(username: string, password: string): Promise<string | null> {
  const response = await fetch(`${API_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    return null;
  }

  const body = await response.json() as { data?: { accessToken?: string } };
  return body.data?.accessToken ?? null;
}

async function loginOrRegister(credentials: { displayName: string; username: string; password: string }): Promise<string> {
  const existingToken = await login(credentials.username, credentials.password);
  if (existingToken) {
    return existingToken;
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

  const registerBody = await registerResponse.json() as { data?: { accessToken?: string } };
  const registerToken = registerBody.data?.accessToken;
  if (!registerToken) {
    throw new Error('注册成功但未返回 accessToken');
  }

  return registerToken;
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
      description: 'E2E participation signup flow',
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

async function createActivity(adminToken: string, eventId: number, name: string, maxParticipants: number): Promise<number> {
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
      description: 'E2E participation activity',
      templateType: 'BASIC',
      status: 'ONGOING',
      maxParticipants,
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
    throw new Error(`创建报名记录失败: ${response.status} ${errorText}`);
  }

  const body = await response.json() as { data?: { id?: number } };
  const participationId = body.data?.id;
  if (!participationId) {
    throw new Error('报名成功但未返回 id');
  }

  return participationId;
}

test.beforeAll(async () => {
  const adminToken = await login(ADMIN_CREDENTIALS.username, ADMIN_CREDENTIALS.password);
  if (!adminToken) {
    throw new Error('管理员登录失败');
  }

  const userToken = await loginOrRegister(USER_CREDENTIALS);
  const capacityUserToken = await loginOrRegister(CAPACITY_USER_CREDENTIALS);
  const uniqueSuffix = Date.now();
  const eventId = await createEvent(adminToken, `E2E报名事件-${uniqueSuffix}`);

  signupActivityId = String(await createActivity(adminToken, eventId, `E2E报名活动-${uniqueSuffix}`, 5));
  withdrawActivityId = String(await createActivity(adminToken, eventId, `E2E退出活动-${uniqueSuffix}`, 5));
  fullActivityId = String(await createActivity(adminToken, eventId, `E2E满员活动-${uniqueSuffix}`, 1));

  await signupByApi(userToken, Number(withdrawActivityId));
  await signupByApi(capacityUserToken, Number(fullActivityId));
});

test.describe('报名/退出成功流', () => {
  test('员工可报名活动，提交后状态变为审核中', async ({ page }) => {
    await page.goto(`/activities/${signupActivityId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('立即报名')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: '提交报名' }).click();

    await expect(page.getByText('报名提交成功，请等待审核')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('报名状态')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('审核中')).toBeVisible({ timeout: 10000 });
  });

  test('已报名用户可退出活动', async ({ page }) => {
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.goto(`/activities/${withdrawActivityId}`);
    await page.waitForLoadState('networkidle');

    const withdrawButton = page.getByRole('button', { name: '退出活动' });
    await expect(withdrawButton).toBeVisible({ timeout: 10000 });
    await withdrawButton.click();

    await expect(page.getByText('退出活动成功')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('立即报名')).toBeVisible({ timeout: 10000 });
  });

  test('名额满时报名按钮置灰', async ({ page }) => {
    await page.goto(`/activities/${fullActivityId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: '提交报名' })).toBeDisabled({ timeout: 10000 });
  });
});
