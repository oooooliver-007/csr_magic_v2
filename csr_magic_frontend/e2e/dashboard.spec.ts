import { test, expect } from '@playwright/test';

/**
 * 数据看板 E2E 测试
 * 前置条件：
 * 1. 后端服务已启动（http://localhost:8080）
 * 2. 前端服务已启动（http://localhost:3000）
 * 3. globalSetup 已自动完成登录（需 ADMIN 角色）
 */

test.describe('数据看板', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('页面渲染：显示页面标题', async ({ page }) => {
    await expect(page.getByText('数据看板')).toBeVisible({ timeout: 10000 });
  });

  test('页面渲染：显示 4 个统计卡片', async ({ page }) => {
    await expect(page.getByText('总活动数')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('累计参与人次')).toBeVisible();
    await expect(page.getByText('累计捐赠额')).toBeVisible();
    await expect(page.getByText('本月新增参与')).toBeVisible();
  });

  test('页面渲染：显示参与趋势图表', async ({ page }) => {
    await expect(page.getByText('参与趋势（月度）')).toBeVisible({ timeout: 10000 });
  });

  test('页面渲染：显示活动类型分布图表', async ({ page }) => {
    await expect(page.getByText('活动类型分布')).toBeVisible({ timeout: 10000 });
  });

  test('页面渲染：显示最活跃员工列表', async ({ page }) => {
    await expect(page.getByText('最活跃员工 Top 10')).toBeVisible({ timeout: 10000 });
    // 表头
    await expect(page.getByText('排名')).toBeVisible();
    await expect(page.getByText('员工')).toBeVisible();
    await expect(page.getByText('参与次数')).toBeVisible();
  });

  test('页面渲染：显示近期活动列表', async ({ page }) => {
    await expect(page.getByText('近期活动')).toBeVisible({ timeout: 10000 });
  });

  test('加载状态：先显示骨架屏再显示数据', async ({ page }) => {
    // 刷新页面并拦截 API 延迟
    await page.route('**/api/v2/dashboard/stats', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await page.goto('/admin');

    // 骨架屏应该出现（animate-pulse class）
    const skeleton = page.locator('.animate-pulse');
    await expect(skeleton).toBeVisible({ timeout: 3000 });

    // 数据加载完后骨架屏消失
    await expect(page.getByText('数据看板')).toBeVisible({ timeout: 15000 });
  });

  test('响应式布局：统计卡片正确渲染', async ({ page }) => {
    // 验证统计卡片区域存在
    await expect(page.getByText('总活动数')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('累计捐赠额')).toBeVisible();
  });
});
