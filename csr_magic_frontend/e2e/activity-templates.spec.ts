import { test, expect } from '@playwright/test';

/**
 * 活动模板 E2E 测试
 * 前置条件：
 * 1. 后端服务已启动（http://localhost:8080）
 * 2. 前端服务已启动（http://localhost:3000）
 * 3. 数据库中已有至少一个事件
 * 4. globalSetup 已自动完成登录（需 ADMIN 角色）
 */

test.describe('活动模板系统', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/activities');
    await page.waitForLoadState('networkidle');
  });

  test('管理端创建活动时显示 5 种模板卡片', async ({ page }) => {
    await page.getByRole('button', { name: /新建活动|创建活动/ }).click();
    await page.waitForSelector('text=活动模板');

    await expect(page.getByText('基础活动')).toBeVisible();
    await expect(page.getByText('捐赠活动')).toBeVisible();
    await expect(page.getByText('志愿者活动')).toBeVisible();
    await expect(page.getByText('签到活动')).toBeVisible();
    await expect(page.getByText('自定义活动')).toBeVisible();
  });

  test('选择 BASIC 模板后显示字段预览', async ({ page }) => {
    await page.getByRole('button', { name: /新建活动|创建活动/ }).click();
    await page.getByText('基础活动').click();

    await expect(page.getByText('文字说明')).toBeVisible();
    await expect(page.getByText('选填')).toBeVisible();
  });

  test('选择 DONATION 模板后显示金额和留言字段', async ({ page }) => {
    await page.getByRole('button', { name: /新建活动|创建活动/ }).click();
    await page.getByText('捐赠活动').click();

    await expect(page.getByText('捐赠金额')).toBeVisible();
    await expect(page.getByText('留言')).toBeVisible();
  });

  test('选择 VOLUNTEER 模板后显示时长和照片字段', async ({ page }) => {
    await page.getByRole('button', { name: /新建活动|创建活动/ }).click();
    await page.getByText('志愿者活动').click();

    await expect(page.getByText('服务时长')).toBeVisible();
    await expect(page.getByText('活动照片')).toBeVisible();
  });

  test('选择 CHECKIN 模板后显示签到照片字段', async ({ page }) => {
    await page.getByRole('button', { name: /新建活动|创建活动/ }).click();
    await page.getByText('签到活动').click();

    await expect(page.getByText('签到照片')).toBeVisible();
  });

  test('选择 CUSTOM 模板后显示自定义提示', async ({ page }) => {
    await page.getByRole('button', { name: /新建活动|创建活动/ }).click();
    await page.getByText('自定义活动').click();

    await expect(page.getByText('formSchema')).toBeVisible();
  });

  test('模板切换时字段预览正确更新', async ({ page }) => {
    await page.getByRole('button', { name: /新建活动|创建活动/ }).click();

    await page.getByText('基础活动').click();
    await expect(page.getByText('文字说明')).toBeVisible();

    await page.getByText('捐赠活动').click();
    await expect(page.getByText('捐赠金额')).toBeVisible();
    await expect(page.getByText('文字说明')).not.toBeVisible();

    await page.getByText('志愿者活动').click();
    await expect(page.getByText('服务时长')).toBeVisible();
    await expect(page.getByText('捐赠金额')).not.toBeVisible();
  });
});
