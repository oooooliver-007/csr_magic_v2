import { test, expect } from '@playwright/test';

/**
 * 用户管理页 E2E 测试
 * 前置条件：
 * 1. 后端服务已启动（http://localhost:8080）
 * 2. 前端服务已启动（http://localhost:3000）
 * 3. globalSetup 已自动完成 ADMIN 登录并保存 storageState
 */

const API_URL = 'http://localhost:8080';
let adminToken: string;

test.beforeAll(async () => {
  // 用 ADMIN 账号登录获取 token（E2E globalSetup 可能用的是普通用户）
  const loginRes = await fetch(`${API_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123456' }),
  });
  if (loginRes.ok) {
    const body = await loginRes.json();
    adminToken = body.data.accessToken;
  }
});

test.describe('用户管理页', () => {
  test.beforeEach(async ({ page }) => {
    // 注入 admin token 到 localStorage
    if (adminToken) {
      await page.addInitScript((token) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify({
          id: 1, username: 'admin', displayName: '管理员', role: 'ADMIN',
        }));
      }, adminToken);
    }
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
  });

  test('页面渲染：显示标题和搜索框', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();
    await expect(page.getByPlaceholder('搜索用户名或姓名...')).toBeVisible();
  });

  test('页面渲染：显示地区筛选下拉', async ({ page }) => {
    await expect(page.locator('select')).toBeVisible();
  });

  test('页面渲染：用户表格（桌面端）显示表头', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // 表头中应包含"用户"、"角色"、"地区"、"注册时间"、"操作"
    await expect(page.getByRole('columnheader', { name: '用户' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '角色' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '地区' })).toBeVisible();
  });

  test('正常业务：搜索不存在的用户显示空状态', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const input = page.getByPlaceholder('搜索用户名或姓名...');
    await input.fill('zzz_no_match_ever_99999');
    await page.waitForTimeout(500);
    await expect(page.getByRole('cell', { name: '暂无用户数据' })).toBeVisible({ timeout: 5000 });
  });

  test('正常业务：点击用户行打开详情面板', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // 等待加载完成（表格渲染出数据行或空状态）
    await page.waitForTimeout(2000);

    // 检查是否有数据行（非空状态行）
    const dataRows = page.locator('tbody tr').filter({ hasNot: page.getByText('暂无用户数据') }).filter({ hasNot: page.getByText('加载中') });
    const rowCount = await dataRows.count();

    if (rowCount > 0) {
      await dataRows.first().click();
      // 详情面板应出现
      await expect(page.getByText('用户详情')).toBeVisible({ timeout: 5000 });
      // 应显示“保存更改”和“重置密码”按钮
      await expect(page.getByRole('button', { name: '保存更改' })).toBeVisible();
      await expect(page.getByRole('button', { name: '重置密码' })).toBeVisible();
    }
  });

  test('正常业务：点击重置密码打开弹窗', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(2000);

    const dataRows = page.locator('tbody tr').filter({ hasNot: page.getByText('暂无用户数据') }).filter({ hasNot: page.getByText('加载中') });
    const rowCount = await dataRows.count();

    if (rowCount > 0) {
      await dataRows.first().click();
      await expect(page.getByText('用户详情')).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: '重置密码' }).click();
      // 重置密码弹窗应出现
      await expect(page.getByPlaceholder('输入新密码（至少 6 位）')).toBeVisible();
      await expect(page.getByPlaceholder('确认新密码')).toBeVisible();
    }
  });

  test('响应式：移动端显示卡片列表而非表格', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // 表格应隐藏（md:block 在移动端不可见）
    const table = page.locator('table');
    await expect(table).toBeHidden();
  });
});
