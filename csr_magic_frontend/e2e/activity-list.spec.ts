import { test, expect } from '@playwright/test';

/**
 * 活动列表页 E2E 测试
 * 前置条件：
 * 1. 后端服务已启动（http://localhost:8080）
 * 2. 前端服务已启动（http://localhost:3000）
 * 3. globalSetup 已自动完成登录并保存 storageState
 */

test.describe('活动列表页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/activities');
    await page.waitForLoadState('networkidle');
  });

  test('页面渲染：显示标题和搜索框', async ({ page }) => {
    await expect(page.getByText('探索活动')).toBeVisible();
    await expect(page.getByPlaceholder('搜索活动...')).toBeVisible();
  });

  test('页面渲染：显示类型筛选按钮', async ({ page }) => {
    await expect(page.getByRole('button', { name: '全部类型' })).toBeVisible();
    await expect(page.getByRole('button', { name: /志愿者/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /捐赠/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /签到/ })).toBeVisible();
  });

  test('页面渲染：显示状态筛选按钮', async ({ page }) => {
    await expect(page.getByRole('button', { name: '全部状态' })).toBeVisible();
    await expect(page.getByRole('button', { name: '进行中' })).toBeVisible();
    await expect(page.getByRole('button', { name: '即将开始' })).toBeVisible();
    await expect(page.getByRole('button', { name: '已结束' })).toBeVisible();
  });

  test('正常业务：活动卡片正确渲染', async ({ page }) => {
    // 有活动数据时应显示卡片（包含"查看详情"按钮）
    const cards = page.getByRole('button', { name: '查看详情' });
    const emptyState = page.getByText('暂无可参与的活动');

    // 等待页面加载完成后，要么有卡片，要么显示空状态
    await expect(cards.first().or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test('正常业务：搜索按名称筛选', async ({ page }) => {
    const input = page.getByPlaceholder('搜索活动...');
    await input.fill('不存在的活动名称xyz');
    // 等待防抖 + 请求
    await page.waitForTimeout(500);
    await expect(page.getByText('暂无可参与的活动')).toBeVisible({ timeout: 5000 });
  });

  test('正常业务：点击类型筛选切换高亮', async ({ page }) => {
    const volunteerBtn = page.getByRole('button', { name: /志愿者/ });
    await volunteerBtn.click();
    // 按钮应变为激活状态（带绿色背景）
    await expect(volunteerBtn).toHaveClass(/bg-\[#2EB87A\]/);
  });

  test('正常业务：查看详情按钮存在且可点击', async ({ page }) => {
    const detailBtn = page.getByRole('button', { name: '查看详情' }).first();
    const emptyState = page.getByText('暂无可参与的活动');

    // 先等数据加载
    await expect(detailBtn.or(emptyState)).toBeVisible({ timeout: 10000 });

    // 仅在有活动数据时验证按钮可点击
    if (await detailBtn.isVisible()) {
      await expect(detailBtn).toBeEnabled();
    }
  });

  test('空状态：无数据时显示占位信息', async ({ page }) => {
    // 用一个极其不可能匹配的关键词触发空状态
    await page.getByPlaceholder('搜索活动...').fill('zzz_no_match_ever_12345');
    await page.waitForTimeout(500);
    await expect(page.getByText('暂无可参与的活动')).toBeVisible({ timeout: 5000 });
  });

  test('响应式：移动端视口显示筛选切换按钮', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/activities');
    await page.waitForLoadState('networkidle');

    // 移动端应有筛选切换按钮（SlidersHorizontal 图标）
    // 筛选区域默认隐藏，点击后展开
    const filterToggle = page.locator('button').filter({ has: page.locator('svg.lucide-sliders-horizontal') });
    await expect(filterToggle).toBeVisible();
  });
});
