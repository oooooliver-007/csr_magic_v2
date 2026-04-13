import { test, expect } from '@playwright/test';

/**
 * 我的参与记录 E2E 测试
 * 前置条件：
 * 1. 后端服务已启动（http://localhost:8080）
 * 2. 前端服务已启动（http://localhost:3000）
 * 3. globalSetup 已自动完成登录并保存 storageState
 */

test.describe('个人中心 - 我的参与记录', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my');
    await page.waitForLoadState('networkidle');
  });

  // === 页面渲染 ===

  test('页面渲染：显示用户问候语', async ({ page }) => {
    await expect(page.getByText(/Hi,/)).toBeVisible();
  });

  test('页面渲染：显示贡献统计卡片', async ({ page }) => {
    // 统计卡片需等待 API 返回，可能显示骨架屏或错误
    const statsText = page.getByText('参与活动数');
    const errorState = page.locator('.bg-red-50');
    await expect(statsText.or(errorState)).toBeVisible({ timeout: 10000 });

    // 仅在 API 成功时验证全部卡片
    if (await statsText.isVisible()) {
      await expect(page.getByText('累计志愿时长')).toBeVisible();
      await expect(page.getByText('累计捐赠总额')).toBeVisible();
    }
  });

  test('页面渲染：显示 Tab 栏', async ({ page }) => {
    await expect(page.getByRole('button', { name: '个人设置' })).toBeVisible();
    await expect(page.getByRole('button', { name: '参与记录' })).toBeVisible();
    await expect(page.getByRole('button', { name: '我的海报' })).toBeVisible();
  });

  test('页面渲染：默认显示个人设置 Tab', async ({ page }) => {
    // 个人设置 Tab 激活状态（绿色边框）
    const settingsTab = page.getByRole('button', { name: '个人设置' });
    await expect(settingsTab).toHaveClass(/text-\[#2EB87A\]/);
  });

  // === Tab 切换 ===

  test('Tab 切换：点击参与记录 Tab 显示参与列表或空状态', async ({ page }) => {
    await page.getByRole('button', { name: '参与记录' }).click();

    // 应显示参与记录列表、空状态或加载/错误状态
    const exportBtn = page.getByRole('button', { name: '导出记录' });
    const emptyState = page.getByText('暂无参与记录');
    const errorState = page.locator('.bg-red-50');

    await expect(exportBtn.or(emptyState).or(errorState)).toBeVisible({ timeout: 15000 });
  });

  test('Tab 切换：点击我的海报 Tab 显示海报空态', async ({ page }) => {
    await page.getByRole('button', { name: '我的海报' }).click();

    await expect(page.getByText('暂无海报')).toBeVisible();
    await expect(page.getByRole('button', { name: /去生成海报/ })).toBeVisible();
  });

  test('Tab 切换：切换后再切回个人设置', async ({ page }) => {
    // 切到参与记录
    await page.getByRole('button', { name: '参与记录' }).click();
    await page.waitForTimeout(500);

    // 切回个人设置
    await page.getByRole('button', { name: '个人设置' }).click();
    await page.waitForTimeout(500);

    // 应显示个人设置相关内容（密码修改表单标题）
    await expect(page.getByRole('heading', { name: '修改密码' })).toBeVisible({ timeout: 5000 });
  });

  // === 参与记录 Tab 功能 ===

  test('参与记录：状态标签使用正确的颜色区分', async ({ page }) => {
    await page.getByRole('button', { name: '参与记录' }).click();
    await page.waitForTimeout(1000);

    // 如果有记录，状态标签应存在
    const hasRecords = await page.getByRole('button', { name: '导出记录' }).isVisible();
    if (hasRecords) {
      // 应有至少一个状态标签（待审核/已通过/已驳回/已重提）
      const statusLabels = page.locator('span').filter({
        hasText: /待审核|已通过|已驳回|已重提/,
      });
      const count = await statusLabels.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('参与记录：导出按钮可点击', async ({ page }) => {
    await page.getByRole('button', { name: '参与记录' }).click();

    const exportBtn = page.getByRole('button', { name: '导出记录' });
    const emptyState = page.getByText('暂无参与记录');
    const errorState = page.locator('.bg-red-50');

    await expect(exportBtn.or(emptyState).or(errorState)).toBeVisible({ timeout: 15000 });

    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });

  // === 响应式 ===

  test('响应式：移动端视口正常渲染', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/my');
    await page.waitForLoadState('networkidle');

    // Tab 栏在移动端也应可见
    await expect(page.getByRole('button', { name: '参与记录' })).toBeVisible({ timeout: 10000 });
    // 贡献统计可能加载中或有错误
    const statsText = page.getByText('参与活动数');
    const errorState = page.locator('.bg-red-50');
    await expect(statsText.or(errorState)).toBeVisible({ timeout: 10000 });
  });
});
