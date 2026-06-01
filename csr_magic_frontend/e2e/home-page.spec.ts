import { test, expect } from '@playwright/test';

test.describe('员工首页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('页面渲染：显示欢迎语和统计卡片区域', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Hi，/ })).toBeVisible();
    await expect(page.getByText('参与活动数').first()).toBeVisible({ timeout: 10000 });
  });

  test('页面渲染：显示推荐活动区', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '推荐活动' })).toBeVisible();

    const activityCard = page.getByRole('button', { name: '查看详情' }).first();
    const emptyState = page.getByText('暂无推荐活动');
    const errorState = page.getByText('加载推荐活动失败，请稍后重试');
    await expect(activityCard.or(emptyState).or(errorState)).toBeVisible({ timeout: 15000 });
  });

  test('页面渲染：显示最近参与区或空状态', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '最近参与' })).toBeVisible();

    const timelineItem = page.getByText('参与时间：').first();
    const emptyState = page.getByText('还没有参与记录');
    const errorState = page.getByText('加载最近参与记录失败，请稍后重试');
    await expect(timelineItem.or(emptyState).or(errorState)).toBeVisible({ timeout: 15000 });
  });

  test('正常业务：点击查看全部跳转到活动列表页', async ({ page }) => {
    await page.getByRole('button', { name: '查看全部' }).click();
    await expect(page).toHaveURL(/\/activities$/);
    await expect(page.getByPlaceholder('搜索活动...')).toBeVisible();
  });

  test('正常业务：点击海报 CTA 跳转到个人中心海报 Tab', async ({ page }) => {
    const ctaButton = page.getByRole('button', { name: '去我的海报' });
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();

    await expect(page).toHaveURL(/\/my\?tab=posters$/);
    await expect(page.getByRole('button', { name: '我的海报' })).toBeVisible();
    await expect(page.getByText('暂无海报')).toBeVisible();
  });

  test('响应式：移动端视口下首页和底部海报 CTA 正常渲染', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Hi，/ })).toBeVisible();
    await expect(page.getByRole('button', { name: '去我的海报' })).toBeVisible();
  });
});

test.describe('员工首页未登录拦截', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('未登录访问 / 应重定向到 /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
