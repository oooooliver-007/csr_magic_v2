import { test, expect } from '@playwright/test';

/**
 * 手机端管理页 UI 验证（2026-09-05 UI 修复回归）
 * - 390×844 视口下各管理页不应出现横向溢出
 * - 问卷管理页按钮应为品牌绿 rgb(46,184,122)
 */

test.use({ viewport: { width: 390, height: 844 } });

const ADMIN = { name: 'zhuyu', pass: '123456' };
const GREEN = 'rgb(46, 184, 122)'; // #2EB87A

test.describe('手机端管理页 UI 检查', () => {
  test('无横向溢出 + 问卷管理按钮为绿色', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill(ADMIN.name);
    await page.locator('#password').fill(ADMIN.pass);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 20_000 });

    const pages = [
      { path: '/admin/surveys', name: '问卷管理' },
      { path: '/admin/activities', name: '活动管理' },
      { path: '/admin', name: '数据看板' },
      { path: '/admin/events', name: '事件管理' },
      { path: '/admin/participations', name: '参与审核' },
      { path: '/admin/users', name: '用户管理' },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await page.waitForTimeout(1_200);
      const m = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      console.log(`[${p.name}] scrollW=${m.scrollW} clientW=${m.clientW} 横向溢出=${m.scrollW > m.clientW}`);
      await page.screenshot({
        path: `test-results/mobile${p.path.replace(/\//g, '_')}.png`,
        fullPage: false,
      });
      expect(m.scrollW, `${p.name} 在 390px 视口下存在横向溢出`).toBeLessThanOrEqual(m.clientW);
    }

    // 问卷管理页：两个头部按钮应为品牌绿
    await page.goto('/admin/surveys');
    await page.waitForTimeout(1_000);
    for (const name of ['AI 生成问卷', '手动创建问卷']) {
      const btn = page.getByRole('button', { name }).first();
      await expect(btn).toBeVisible();
      const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
      console.log(`[按钮颜色] ${name}: ${bg}`);
      expect(bg, `${name} 应为品牌绿 #2EB87A`).toBe(GREEN);
    }

    // ── 对齐断言（边缘坐标差 < 2px 视为对齐）──
    const near = (a: number, b: number) => Math.abs(a - b) < 2;

    // 活动管理：搜索框 / 两个下拉 / 新建按钮 全部同宽对齐
    await page.goto('/admin/activities');
    await page.waitForTimeout(1_000);
    const search = page.locator('input[placeholder="搜索活动名称..."]');
    const sel1 = page.locator('select').nth(0);
    const sel2 = page.locator('select').nth(1);
    const sb = await search.boundingBox();
    const s1 = await sel1.boundingBox();
    const s2 = await sel2.boundingBox();
    expect(near(s1!.x, sb!.x), '事件下拉左缘应与搜索框左缘对齐').toBeTruthy();
    expect(near(s1!.y, s2!.y), '两个下拉应在同一行').toBeTruthy();
    expect(
      near(s2!.x + s2!.width, sb!.x + sb!.width),
      '状态下拉右缘应与搜索框右缘对齐',
    ).toBeTruthy();
    const cb = (await page.getByRole('button', { name: '新建活动' }).boundingBox())!;
    expect(
      near(cb.x, sb!.x) && near(cb.x + cb.width, sb!.x + sb!.width),
      '新建活动按钮应与筛选栏同宽对齐',
    ).toBeTruthy();
    await page.screenshot({ path: 'test-results/mobile_admin_activities_aligned.png' });

    // 问卷管理：两个按钮等宽且与标题左右边缘对齐
    await page.goto('/admin/surveys');
    await page.waitForTimeout(1_000);
    const ai = page.getByRole('button', { name: 'AI 生成问卷' });
    const manual = page.getByRole('button', { name: '手动创建问卷' });
    const ab = await ai.boundingBox();
    const mb = await manual.boundingBox();
    expect(near(ab!.y, mb!.y), '两个问卷按钮应在同一行').toBeTruthy();
    expect(near(ab!.width, mb!.width), '两个问卷按钮应等宽').toBeTruthy();
    const hb = (await page.getByRole('heading', { name: '问卷管理' }).boundingBox())!;
    console.log(`[对齐调试] 按钮: x=${ab!.x} w=${ab!.width} right=${ab!.x + ab!.width} | 标题: x=${hb.x} w=${hb.width} right=${hb.x + hb.width}`);
    expect(
      near(ab!.x, hb.x) && near(mb!.x + mb!.width, hb.x + hb.width),
      '问卷按钮组应与标题左右边缘对齐',
    ).toBeTruthy();
    await page.screenshot({ path: 'test-results/mobile_admin_surveys_aligned.png' });
  });
});
