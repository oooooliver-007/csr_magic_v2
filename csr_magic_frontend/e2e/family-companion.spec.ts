import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080';
const ADMIN_CREDENTIALS = { username: 'zhangsan', password: '123456' };
const USER_CREDENTIALS = {
  displayName: 'E2E家属测试员工',
  username: 'e2e_family_user',
  password: 'e2eFamily123456',
};

let allowFamilyActivityId = '';
let noFamilyActivityId = '';

async function login(username: string, password: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: { accessToken?: string } };
  return body.data?.accessToken ?? null;
}

async function loginOrRegister(c: { displayName: string; username: string; password: string }): Promise<string> {
  const t = await login(c.username, c.password);
  if (t) return t;
  const r = await fetch(`${API_URL}/api/v2/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(c),
  });
  if (!r.ok) throw new Error(`注册失败: ${r.status}`);
  const body = (await r.json()) as { data?: { accessToken?: string } };
  return body.data!.accessToken!;
}

async function createEvent(token: string, name: string): Promise<number> {
  const res = await fetch(`${API_URL}/api/v2/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name,
      description: 'E2E family companion',
      type: 'ONLINE',
      visible: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`创建事件失败: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data: { id: number } };
  return body.data.id;
}

async function createActivity(
  token: string,
  eventId: number,
  name: string,
  maxParticipants: number,
  allowFamily: boolean,
  maxFamilyPerUser: number | null
): Promise<number> {
  const now = Date.now();
  const res = await fetch(`${API_URL}/api/v2/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      eventId,
      name,
      description: 'E2E activity',
      templateType: 'BASIC',
      status: 'ONGOING',
      maxParticipants,
      startTime: new Date(now - 60 * 60 * 1000).toISOString(),
      endTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      allowFamily,
      maxFamilyPerUser,
    }),
  });
  if (!res.ok) throw new Error(`创建活动失败: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data: { id: number } };
  return body.data.id;
}

test.beforeAll(async () => {
  const adminToken = await login(ADMIN_CREDENTIALS.username, ADMIN_CREDENTIALS.password);
  if (!adminToken) throw new Error('管理员登录失败');
  await loginOrRegister(USER_CREDENTIALS);
  const suffix = Date.now();
  const eventId = await createEvent(adminToken, `E2E家属事件-${suffix}`);
  allowFamilyActivityId = String(
    await createActivity(adminToken, eventId, `E2E允许家属-${suffix}`, 10, true, 3)
  );
  noFamilyActivityId = String(
    await createActivity(adminToken, eventId, `E2E禁止家属-${suffix}`, 10, false, null)
  );
});

test.describe('家属同行 E2E', () => {
  test('allowFamily=true 活动详情页显示家属区块', async ({ page }) => {
    await page.goto(`/activities/${allowFamilyActivityId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('携带家属（可选）')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('0/3')).toBeVisible();
  });

  test('allowFamily=false 活动详情页不显示家属区块', async ({ page }) => {
    await page.goto(`/activities/${noFamilyActivityId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '提交报名' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('携带家属（可选）')).not.toBeVisible();
  });

  test('员工可添加家属并提交报名', async ({ page }) => {
    await page.goto(`/activities/${allowFamilyActivityId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('携带家属（可选）')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /添加家属/ }).click();
    await page.getByPlaceholder('家属姓名').fill('张小明');
    await expect(page.getByText('1/3')).toBeVisible();

    await page.getByRole('button', { name: '提交报名' }).click();
    await expect(page.getByText('报名提交成功，请等待审核')).toBeVisible({ timeout: 10000 });
  });
});
