import { test, expect } from '@playwright/test';

test.describe('海报画廊', () => {
  test.describe('海报工作台页面画廊区域', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/poster');
      await page.waitForLoadState('networkidle');
    });

    test('页面渲染画廊标题', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '我的海报' })).toBeVisible();
    });

    test('无海报时显示空状态', async ({ page }) => {
      // 如果当前用户无海报，应显示空状态
      const emptyState = page.getByText('暂无海报');
      const posterCard = page.locator('[class*="grid"] button').first();

      // 要么有空状态，要么有卡片
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      const hasCard = await posterCard.isVisible().catch(() => false);

      expect(hasEmpty || hasCard).toBe(true);
    });

    test('空状态显示"去生成海报"按钮', async ({ page }) => {
      const emptyState = page.getByText('暂无海报');
      const hasEmpty = await emptyState.isVisible().catch(() => false);

      if (hasEmpty) {
        await expect(page.getByRole('button', { name: '去生成海报' })).toBeVisible();
      }
    });
  });

  test.describe('个人中心"我的海报" Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/my?tab=posters');
      await page.waitForLoadState('networkidle');
    });

    test('Tab 切换到"我的海报"', async ({ page }) => {
      await expect(page.getByRole('button', { name: '我的海报' })).toBeVisible();

      // 画廊区域应存在（空状态或卡片网格）
      const emptyState = page.getByText('暂无海报');
      const posterCard = page.locator('[class*="grid"] button').first();

      const hasEmpty = await emptyState.isVisible().catch(() => false);
      const hasCard = await posterCard.isVisible().catch(() => false);

      expect(hasEmpty || hasCard).toBe(true);
    });
  });

  test.describe('未登录拦截', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('未登录访问 /poster 应重定向到 /login', async ({ page }) => {
      await page.goto('/poster');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
