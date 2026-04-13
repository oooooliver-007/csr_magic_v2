import { test, expect } from '@playwright/test';

/**
 * 活动详情页 E2E 测试
 * 前置条件：
 * 1. 后端服务已启动（http://localhost:8080）
 * 2. 前端服务已启动（http://localhost:3000）
 * 3. globalSetup 已自动完成登录并保存 storageState
 * 4. 至少一个活动已存在
 */

test.describe('活动详情页', () => {
  let activityId: string;

  test.beforeAll(async () => {
    // 从活动列表 API 获取第一个活动的 ID（直接调后端，避免走前端 baseURL）
    try {
      const res = await fetch('http://localhost:8080/api/v2/activities?page=0&size=1');
      const body = await res.json();
      if (body.data?.content?.length > 0) {
        activityId = String(body.data.content[0].id);
      }
    } catch {
      // 后端不可用时 activityId 保持 undefined，测试会被 skip
    }
  });

  test('页面渲染：从活动列表进入详情页', async ({ page }) => {
    test.skip(!activityId, '无活动数据，跳过');

    await page.goto('/activities');
    await page.waitForLoadState('networkidle');

    const detailBtn = page.getByRole('button', { name: '查看详情' }).first();
    await expect(detailBtn).toBeVisible({ timeout: 10000 });
    await detailBtn.click();

    // 等待详情页加载
    await page.waitForURL(/\/activities\/\d+/);
    await page.waitForLoadState('networkidle');

    // 应显示活动名称（h1 标签）
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('页面渲染：显示活动详情信息', async ({ page }) => {
    test.skip(!activityId, '无活动数据，跳过');

    await page.goto(`/activities/${activityId}`);
    await page.waitForLoadState('networkidle');

    // 验证信息卡存在
    await expect(page.getByText('开始时间')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('结束时间')).toBeVisible();
    await expect(page.getByText('参与人数')).toBeVisible();
    await expect(page.getByText('所属事件')).toBeVisible();
  });

  test('页面渲染：显示报名区域', async ({ page }) => {
    test.skip(!activityId, '无活动数据，跳过');

    await page.goto(`/activities/${activityId}`);
    await page.waitForLoadState('networkidle');

    // 桌面端应显示报名卡（包含"立即报名"或"报名状态"或"活动已结束"）
    const signupHeading = page.getByText('立即报名');
    const statusHeading = page.getByText('报名状态');
    const endedText = page.getByText('活动已结束');

    await expect(
      signupHeading.or(statusHeading).or(endedText)
    ).toBeVisible({ timeout: 10000 });
  });

  test('页面渲染：显示返回按钮', async ({ page }) => {
    test.skip(!activityId, '无活动数据，跳过');

    await page.goto(`/activities/${activityId}`);
    await page.waitForLoadState('networkidle');

    // 封面图区域有返回按钮（ChevronRight rotated 图标）
    const backBtn = page.locator('button').filter({
      has: page.locator('svg.lucide-chevron-right'),
    });
    await expect(backBtn).toBeVisible({ timeout: 10000 });
  });

  test('交互：返回按钮导航到活动列表', async ({ page }) => {
    test.skip(!activityId, '无活动数据，跳过');

    await page.goto(`/activities/${activityId}`);
    await page.waitForLoadState('networkidle');

    const backBtn = page.locator('button').filter({
      has: page.locator('svg.lucide-chevron-right'),
    });
    await backBtn.click();

    await page.waitForURL('/activities');
  });

  test('错误处理：不存在的活动 ID 显示错误状态', async ({ page }) => {
    await page.goto('/activities/999999');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('加载活动详情失败')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('返回活动列表')).toBeVisible();
  });

  test('响应式：移动端显示底部操作栏', async ({ page }) => {
    test.skip(!activityId, '无活动数据，跳过');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/activities/${activityId}`);
    await page.waitForLoadState('networkidle');

    // 移动端底部栏应可见（包含报名按钮或已报名提示或已结束提示）
    const mobileBar = page.locator('.fixed.bottom-0');
    await expect(mobileBar).toBeVisible({ timeout: 10000 });
  });
});
