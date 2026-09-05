import { test, expect, type Page } from '@playwright/test';

/** 复现：管理员登录 → 退出 → 历史记录重开网页 → 疑似恢复会话进入用户页 */

const ADMIN = { name: 'zhuyu', pass: '123456' };

async function dumpState(page: Page, label: string) {
  const ls = await page.evaluate(() => ({
    accessToken: localStorage.getItem('accessToken')?.slice(0, 20) ?? null,
    user: localStorage.getItem('user')?.slice(0, 60) ?? null,
  }));
  const cookies = await page.context().cookies();
  const rt = cookies.find((c) => c.name === 'refreshToken');
  console.log(
    `[${label}] url=${page.url()} | ls.accessToken=${ls.accessToken}… | ls.user=${ls.user} | refreshTokenCookie=${rt ? `存在(到期${new Date(rt.expires * 1000).toISOString().slice(0, 10)})` : '无'}`,
  );
  return { ls, hasCookie: !!rt };
}

test.describe('登出后会话复活问题复现', () => {
  test('登录→退出→历史重开', async ({ page }) => {
    test.setTimeout(120_000);

    // 1. 登录
    await page.goto('/login');
    await page.locator('#username').fill(ADMIN.name);
    await page.locator('#password').fill(ADMIN.pass);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 20_000 });
    await dumpState(page, '① 登录后');

    // 2. 退出
    await page.getByRole('button', { name: '退出登录' }).first().click();
    await page.waitForURL((u) => u.pathname.startsWith('/login'), { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_500); // 等 logout API 完成
    const afterLogout = await dumpState(page, '② 退出后');

    // 3. 模拟历史记录重开：新开页面上下文之外的同 context 导航（同浏览器档案的历史）
    await page.goto('/');
    await page.waitForTimeout(1_500);
    const s3 = await dumpState(page, '③ 历史重开 /');

    // 4. 历史重开用户页
    await page.goto('/activities');
    await page.waitForTimeout(1_500);
    const s4 = await dumpState(page, '④ 历史重开 /activities');

    // 5. 浏览器后退
    await page.goBack();
    await page.waitForTimeout(1_500);
    await dumpState(page, '⑤ goBack 后');

    // 断言：退出后 localStorage 必须为空
    expect(afterLogout.ls.accessToken, '退出后 localStorage.accessToken 应为空').toBeNull();
    expect(afterLogout.ls.user, '退出后 localStorage.user 应为空').toBeNull();
    // 若 cookie 仍存在即为后端清除失败
    if (afterLogout.hasCookie) {
      console.log('‼️ 发现问题：退出后 refreshToken Cookie 仍然存在');
    }
    // 复现断言：历史重开不应恢复登录态
    expect(s3.ls.accessToken, '历史重开后不应恢复 accessToken').toBeNull();
    expect(s4.ls.accessToken, '历史重开用户页后不应恢复 accessToken').toBeNull();
  });

  test('新标签页（模拟重开浏览器后从历史进入）', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/login');
    await page.locator('#username').fill(ADMIN.name);
    await page.locator('#password').fill(ADMIN.pass);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 20_000 });
    await page.getByRole('button', { name: '退出登录' }).first().click();
    await page.waitForURL((u) => u.pathname.startsWith('/login'), { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_500);
    await page.close();

    // 模拟：重开浏览器后从历史记录再次打开网页
    const page2 = await ctx.newPage();
    await page2.goto('/');
    await page2.waitForTimeout(2_000);
    await dumpState(page2, '⑥ 新标签页打开 /');
    console.log('最终 URL:', page2.url());
    await page2.screenshot({ path: 'test-results/reopen-after-logout.png' });
    await ctx.close();
  });

  test('不登出直接关闭页面，管理员从历史重开应进入管理端（而非用户页）', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // 管理员登录
    await page.goto('/login');
    await page.locator('#username').fill(ADMIN.name);
    await page.locator('#password').fill(ADMIN.pass);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 20_000 });

    // 不登出，直接关闭页面
    await page.close();

    // 从历史记录再次打开（同浏览器会话，localStorage 保留登录态）
    const page2 = await ctx.newPage();
    await page2.goto('/');
    await page2.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 15_000 });
    await expect(page2.getByText('数据看板').first()).toBeVisible({ timeout: 10_000 });
    console.log('[管理员重开] 落点:', page2.url(), '✅ 进入管理端');

    // 管理员访问员工端页面 → 一律重定向回管理端（含 /my）
    await page2.goto('/my');
    await page2.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 15_000 });
    console.log('[管理员] /my 重定向到管理端 ✅');
    await page2.goto('/activities');
    await page2.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 15_000 });
    console.log('[管理员] /activities 重定向到管理端 ✅');

    // 员工不受影响：登录后首页仍是员工端
    const ctx2 = await browser.newContext();
    const p3 = await ctx2.newPage();
    await p3.goto('/login');
    await p3.locator('#username').fill('tester_boundary');
    await p3.locator('#password').fill('Test12Pro!');
    await p3.getByRole('button', { name: '登录', exact: true }).click();
    await p3.waitForURL((u) => u.pathname === '/', { timeout: 20_000 });
    await expect(p3.getByText(/Hi，/).first()).toBeVisible({ timeout: 10_000 });
    console.log('[员工] 首页保持员工端 ✅');

    await ctx2.close();
    await ctx.close();
  });
});
