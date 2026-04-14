import { test, expect } from '@playwright/test';

/**
 * 参与审核页 E2E 测试
 * 前置条件：
 * 1. 后端服务已启动（http://localhost:8080）
 * 2. 前端服务已启动（http://localhost:3000）
 * 3. globalSetup 已自动完成登录并保存 storageState
 */

const API_URL = 'http://localhost:8080';
const USER_CREDENTIALS = { username: 'e2e_test_user', password: 'e2eTest123456' };
let adminToken: string;
let testParticipationId: number | null = null;

async function createEventForReview(name: string): Promise<number | null> {
  if (!adminToken) {
    return null;
  }

  const response = await fetch(`${API_URL}/api/v2/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name,
      description: 'E2E review event',
      type: 'ONLINE',
      visible: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  if (!response.ok) {
    return null;
  }

  const body = await response.json() as { data?: { id?: number } };
  return body.data?.id ?? null;
}

async function createActivityForReview(eventId: number, name: string): Promise<number | null> {
  if (!adminToken) {
    return null;
  }

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
      description: 'E2E review activity',
      templateType: 'BASIC',
      status: 'ONGOING',
      maxParticipants: 10,
      startTime: new Date(now - 60 * 60 * 1000).toISOString(),
      endTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  if (!response.ok) {
    return null;
  }

  const body = await response.json() as { data?: { id?: number } };
  return body.data?.id ?? null;
}

async function createPendingParticipation(): Promise<number | null> {
  const userLoginRes = await fetch(`${API_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(USER_CREDENTIALS),
  });

  if (!userLoginRes.ok) {
    return null;
  }

  const userBody = await userLoginRes.json() as { data?: { accessToken?: string } };
  const userToken = userBody.data?.accessToken;
  if (!userToken) {
    return null;
  }

  const actRes = await fetch(`${API_URL}/api/v2/activities?page=0&size=20`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (!actRes.ok) {
    return null;
  }

  const actBody = await actRes.json() as { data?: { content?: Array<{ id: number; status?: string }> } };
  const activities = actBody.data?.content ?? [];

  for (const activity of activities) {
    if (activity.status === 'ENDED') {
      continue;
    }

    const signupRes = await fetch(`${API_URL}/api/v2/participations/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ activityId: activity.id, formData: '{"备注":"E2E测试报名"}' }),
    });

    if (signupRes.ok) {
      const signupBody = await signupRes.json() as { data?: { id?: number } };
      return signupBody.data?.id ?? null;
    }
  }

  // 如果没有可用的活动，则创建一个新的活动
  const eventName = 'E2E Review Event';
  const eventRes = await createEventForReview(eventName);
  if (!eventRes) {
    return null;
  }

  const activityName = 'E2E Review Activity';
  const activityRes = await createActivityForReview(eventRes, activityName);
  if (!activityRes) {
    return null;
  }

  const signupRes = await fetch(`${API_URL}/api/v2/participations/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ activityId: activityRes, formData: '{"备注":"E2E测试报名"}' }),
  });

  if (signupRes.ok) {
    const signupBody = await signupRes.json() as { data?: { id?: number } };
    return signupBody.data?.id ?? null;
  }

  return null;
}

test.beforeAll(async () => {
  // 用 ADMIN 账号 zhangsan 登录
  const loginRes = await fetch(`${API_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'zhangsan', password: '123456' }),
  });
  if (loginRes.ok) {
    const body = await loginRes.json();
    adminToken = body.data.accessToken;
  }

  // 尝试用普通用户报名一个活动，以产生测试数据
  testParticipationId = await createPendingParticipation();
});

test.describe('参与审核页', () => {
  test.beforeEach(async ({ page }) => {
    if (adminToken) {
      await page.addInitScript((token) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify({
          id: 1, username: 'zhangsan', displayName: '张三', role: 'ADMIN',
        }));
      }, adminToken);
    }
    await page.goto('/admin/participations');
    await page.waitForLoadState('networkidle');
  });

  test('页面渲染：显示标题和筛选栏', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '参与审核' })).toBeVisible();
    await expect(page.getByPlaceholder('搜索员工姓名或活动名称...')).toBeVisible();
    await expect(page.getByRole('button', { name: '导出' })).toBeVisible();
  });

  test('页面渲染：状态筛选下拉显示所有选项', async ({ page }) => {
    const selects = page.locator('select');
    const statusSelect = selects.nth(1);
    await expect(statusSelect).toBeVisible();
    // 检查选项
    await expect(statusSelect.locator('option')).toHaveCount(5); // 全部状态 + 4个状态
  });

  test('页面渲染：活动筛选下拉可用', async ({ page }) => {
    const selects = page.locator('select');
    // 第三个 select 是活动筛选
    if (await selects.count() >= 3) {
      const activitySelect = selects.nth(2);
      await expect(activitySelect).toBeVisible();
    }
  });

  test('正常业务：无数据时显示空状态提示', async ({ page }) => {
    // 搜索不存在的关键词触发空状态
    const input = page.getByPlaceholder('搜索员工姓名或活动名称...');
    await input.fill('zzz_no_match_99999');
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('暂无参与记录')).toBeVisible({ timeout: 5000 });
  });

  test('正常业务：有数据时桌面端显示表格', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(1000);

    // 如有测试数据，应看到表格
    if (testParticipationId) {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 5000 });
      // 表头应包含 员工、活动、报名时间、状态、操作
      await expect(page.getByRole('columnheader', { name: '员工' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '活动' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '状态' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible();
    }
  });

  test('正常业务：有数据时可展开详情行', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(1000);

    if (testParticipationId) {
      // 点击展开按钮（ChevronDown 图标按钮）
      const expandBtn = page.locator('tbody tr').first().locator('button').last();
      await expandBtn.click();
      // 应展示"报名信息"或"审核信息"
      await expect(page.getByText('报名信息').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('正常业务：状态筛选切换后重新加载', async ({ page }) => {
    const statusSelect = page.locator('select').nth(1);
    await statusSelect.selectOption('PENDING');
    await page.waitForLoadState('networkidle');
    // 页面不应崩溃
    await expect(page.getByRole('heading', { name: '参与审核' })).toBeVisible();
  });

  test('正常业务：有数据时全选 checkbox 工作', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(1000);

    if (testParticipationId) {
      // 点击表头 checkbox
      const headerCheckbox = page.locator('thead input[type="checkbox"]');
      if (await headerCheckbox.isVisible()) {
        await headerCheckbox.check();
        // 批量通过按钮应出现
        await expect(page.getByText('批量通过')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('正常业务：审核操作（通过）', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(1000);

    if (testParticipationId) {
      // 找到通过按钮（绿色 Check 图标）
      const approveBtn = page.locator('tbody tr').first().locator('button[title="通过"]');
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
        await page.waitForLoadState('networkidle');
        // 审核后状态应变为"审核已通过"
        await expect(page.getByText('审核已通过')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('正常业务：驳回时必须填写原因', async ({ page }) => {
    const pendingId = await createPendingParticipation();
    test.skip(!pendingId, '无可用于驳回的测试数据，跳过');

    await page.reload();
    await page.waitForLoadState('networkidle');

    const rejectBtn = page.locator('tbody tr').first().locator('button[title="驳回"]');
    await rejectBtn.click();

    await expect(page.getByRole('button', { name: '确认驳回' })).toBeDisabled();
  });

  test('正常业务：审核操作（驳回）', async ({ page }) => {
    const pendingId = await createPendingParticipation();
    test.skip(!pendingId, '无可用于驳回的测试数据，跳过');

    await page.reload();
    await page.waitForLoadState('networkidle');

    const rejectBtn = page.locator('tbody tr').first().locator('button[title="驳回"]');
    await rejectBtn.click();
    await page.locator('textarea').fill('E2E驳回原因');
    await page.getByRole('button', { name: '确认驳回' }).click();

    await expect(page.getByText('驳回成功')).toBeVisible({ timeout: 5000 });
  });

  test('响应式：移动端显示卡片而非表格', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/participations');
    await page.waitForLoadState('networkidle');

    // 表格应隐藏
    const table = page.locator('table');
    await expect(table).toBeHidden();
    // 标题仍可见
    await expect(page.getByRole('heading', { name: '参与审核' })).toBeVisible();
  });

  test('响应式：移动端有数据时显示卡片详情按钮', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/participations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    if (testParticipationId) {
      // 移动端应有"查看详情"按钮
      await expect(page.getByText('查看详情').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('未登录拦截', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('未登录访问 /admin/participations 应重定向到 /login', async ({ page }) => {
    await page.goto('/admin/participations');
    await expect(page).toHaveURL(/\/login/);
  });
});
