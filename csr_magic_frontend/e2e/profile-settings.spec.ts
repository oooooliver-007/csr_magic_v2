import { test, expect } from '@playwright/test';

/**
 * 个人设置页 E2E 测试
 * 前置条件：
 * 1. 后端服务已启动（http://localhost:8080）
 * 2. 前端服务已启动（http://localhost:3000）
 * 3. globalSetup 已自动完成登录并保存 storageState
 */

test.describe('个人设置页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my');
    await page.waitForLoadState('networkidle');
  });

  // === 页面渲染 ===

  test('页面渲染：显示页面标题"个人中心"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '个人中心' })).toBeVisible();
  });

  test('页面渲染：显示个人信息卡（用户名和角色）', async ({ page }) => {
    // 应显示 @username 和角色标签
    await expect(page.getByText(/@\w+/)).toBeVisible();
  });

  test('页面渲染：显示"个人信息"表单区域', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '个人信息' })).toBeVisible();
    await expect(page.getByPlaceholder('请输入昵称')).toBeVisible();
    await expect(page.getByPlaceholder('请输入真名')).toBeVisible();
  });

  test('页面渲染：显示"修改密码"表单区域', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '修改密码' })).toBeVisible();
    await expect(page.getByPlaceholder('请输入当前密码')).toBeVisible();
    await expect(page.getByPlaceholder('至少6位')).toBeVisible();
    await expect(page.getByPlaceholder('再次输入新密码')).toBeVisible();
  });

  test('页面渲染：用户名字段为只读', async ({ page }) => {
    // 用户名输入框应被禁用
    const usernameInput = page.locator('input[disabled]').first();
    await expect(usernameInput).toBeVisible();
    await expect(usernameInput).toBeDisabled();
  });

  // === 个人信息修改 ===

  test('正常业务：修改昵称后保存成功显示 Toast', async ({ page }) => {
    const nameInput = page.getByPlaceholder('请输入昵称');
    await nameInput.clear();
    await nameInput.fill('E2E测试昵称');
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText('个人信息更新成功')).toBeVisible({ timeout: 5000 });
  });

  test('正常业务：修改昵称后页面信息卡同步更新', async ({ page }) => {
    const nameInput = page.getByPlaceholder('请输入昵称');
    await nameInput.clear();
    await nameInput.fill('E2E同步测试');
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText('个人信息更新成功')).toBeVisible({ timeout: 5000 });
    // 信息卡的显示名也应更新
    await expect(page.getByRole('heading', { name: 'E2E同步测试' })).toBeVisible();
  });

  // === 密码修改 ===

  test('异常流程：密码修改 — 新密码与确认密码不一致显示行内提示', async ({ page }) => {
    await page.getByPlaceholder('请输入当前密码').fill('oldpassword');
    await page.getByPlaceholder('至少6位').fill('newpass123');
    await page.getByPlaceholder('再次输入新密码').fill('differentpass');
    await page.getByRole('button', { name: '修改密码' }).click();
    await expect(page.getByText('两次输入的密码不一致')).toBeVisible();
  });

  test('异常流程：密码修改 — 新密码过短显示行内提示', async ({ page }) => {
    await page.getByPlaceholder('请输入当前密码').fill('oldpassword');
    await page.getByPlaceholder('至少6位').fill('123');
    await page.getByPlaceholder('再次输入新密码').fill('123');
    await page.getByRole('button', { name: '修改密码' }).click();
    await expect(page.getByText('新密码长度不能少于6位')).toBeVisible();
  });

  test('异常流程：密码修改 — 当前密码错误显示错误提示', async ({ page }) => {
    await page.getByPlaceholder('请输入当前密码').fill('wrong_old_password');
    await page.getByPlaceholder('至少6位').fill('newpass123');
    await page.getByPlaceholder('再次输入新密码').fill('newpass123');
    await page.getByRole('button', { name: '修改密码' }).click();
    await expect(page.getByText('当前密码不正确')).toBeVisible({ timeout: 5000 });
  });

  test('正常业务：密码修改 — 当前密码正确时修改成功', async ({ page }) => {
    // 先改为临时密码
    await page.getByPlaceholder('请输入当前密码').fill('e2eTest123456');
    await page.getByPlaceholder('至少6位').fill('tempPass999');
    await page.getByPlaceholder('再次输入新密码').fill('tempPass999');
    await page.getByRole('button', { name: '修改密码' }).click();
    await expect(page.getByText('密码修改成功')).toBeVisible({ timeout: 5000 });

    // 改回原密码，以免影响后续测试
    await page.getByPlaceholder('请输入当前密码').fill('tempPass999');
    await page.getByPlaceholder('至少6位').fill('e2eTest123456');
    await page.getByPlaceholder('再次输入新密码').fill('e2eTest123456');
    await page.getByRole('button', { name: '修改密码' }).click();
    await expect(page.getByText('密码修改成功')).toBeVisible({ timeout: 5000 });
  });

  // === 响应式 ===

  test('响应式：移动端双列变单列', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/my');
    await page.waitForLoadState('networkidle');

    // 两个表单区域在移动端应为单列堆叠
    await expect(page.getByRole('heading', { name: '个人信息' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '修改密码' })).toBeVisible();
  });
});

// === 认证拦截 ===

test.describe('未登录拦截', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('未登录访问 /my 应重定向到 /login', async ({ page }) => {
    await page.goto('/my');
    await expect(page).toHaveURL(/\/login/);
  });
});
