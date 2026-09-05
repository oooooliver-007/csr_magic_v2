import { test, expect, type Page } from '@playwright/test';

/**
 * joy4giving.cn 黑盒回归测试（对应 Desktop/joy4giving-blackbox-test-report.md 的 BUG-01~13）
 * 账号来自测试报告（测试专用账号）；写操作用例自带清理（报名后退出）。
 */

const TS = Date.now().toString().slice(-6);
const USER = { name: 'tester_boundary', pass: 'Test12Pro!' };
const ADMIN = { name: 'zhuyu', pass: '123456' };

// ---------- 工具函数 ----------

async function uiLogin(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function logout(page: Page) {
  const btn = page.getByRole('button', { name: '退出登录' }).first();
  if (await btn.count()) {
    await btn.click();
    await page.waitForURL((u) => u.pathname.startsWith('/login'), { timeout: 10_000 }).catch(() => {});
  }
}

/** API 登录后把 token 注入 localStorage（等价于已登录会话） */
async function apiLoginAndInject(page: Page, username: string, password: string) {
  const res = await page.request.post('/api/v2/auth/login', { data: { username, password } });
  if (!res.ok()) throw new Error(`API 登录失败: ${res.status()}`);
  const body = await res.json();
  const { accessToken, user } = body.data;
  await page.goto('/');
  await page.evaluate(
    ([t, u]) => {
      localStorage.setItem('accessToken', t as string);
      localStorage.setItem('user', u as string);
    },
    [accessToken, JSON.stringify(user)],
  );
  await page.reload();
}

interface RegisterOpts {
  region?: string;
  gender?: 'MALE' | 'FEMALE';
}

async function uiRegister(
  page: Page,
  displayName: string,
  username: string,
  password: string,
  opts: RegisterOpts = {},
) {
  await page.goto('/register');
  await page.locator('#displayName').fill(displayName);
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  if (opts.region) await page.locator('#region').selectOption(opts.region);
  if (opts.gender) await page.locator(`input[type="radio"][value="${opts.gender}"]`).check();
  await page.getByRole('button', { name: '注册', exact: true }).click();
}

/** 提取文本中的 "x / y" 参与人数 */
function parseCount(text: string | null): number | null {
  const m = text?.match(/(\d+)\s*\/\s*(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/** 从活动列表打开指定名称活动的详情（卡片结构：div > 标题 + 查看详情按钮） */
async function openActivityDetail(page: Page, name: string) {
  await page.goto('/activities');
  const heading = page.getByRole('heading', { name, exact: true }).first();
  if (await heading.count()) {
    await heading
      .locator('xpath=../..')
      .getByRole('button', { name: '查看详情' })
      .click({ timeout: 5_000 })
      .catch(async () => {
        await page.getByRole('button', { name: '查看详情' }).first().click();
      });
  } else {
    await page.getByRole('button', { name: '查看详情' }).first().click();
  }
  await page.waitForURL(/\/activities\/\d+/, { timeout: 15_000 });
}

// ---------- 用例 ----------

test.describe('joy4giving.cn 黑盒回归（2026-09-05）', () => {
  test('BUG-01 登录失败应有明确错误提示且不清空用户名', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome to CSR Magic')).toBeVisible();
    await page.locator('#username').fill('nonexistent_user_xyz');
    await page.locator('#password').fill('WrongPass123!');
    await page.getByRole('button', { name: '登录', exact: true }).click();

    const errBox = page.locator('div.bg-red-50');
    await expect(errBox).toBeVisible({ timeout: 10_000 });
    const errText = (await errBox.textContent())?.trim() ?? '';
    expect(errText.length, `错误提示应有文案，实际为空。文案:"${errText}"`).toBeGreaterThan(0);
    // 用户名不被清空
    await expect(page.locator('#username')).toHaveValue('nonexistent_user_xyz');
  });

  test('BUG-03 重复用户名注册应提示已被占用', async ({ page }) => {
    await page.goto('/register');
    await page.locator('#displayName').fill('E2E黑盒回归');
    await page.locator('#username').fill('probe3'); // 报告中已存在的用户
    await page.locator('#password').fill('DupTest123!');
    await page.getByRole('button', { name: '注册', exact: true }).click();

    await expect(
      page.getByText(/已存在|已被占用|失败|错误/).first(),
      '注册失败应有任何可见提示',
    ).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/register/); // 留在注册页（预期），但必须有提示
  });

  test('BUG-05 不选性别应能注册成功（性别为可选）', async ({ page }) => {
    await uiRegister(page, 'E2E无性别回归', `pw_ng_${TS}`, 'NgTest123456!', { region: '北京' });
    // 成功 → 自动登录进入首页
    await page.waitForURL((u) => u.pathname === '/', { timeout: 20_000 });
    await expect(page.getByText('E2E无性别回归').first()).toBeVisible({ timeout: 10_000 });
  });

  test('BUG-09 注册选择的性别应同步到个人资料', async ({ page }) => {
    await uiRegister(page, 'E2E性别同步', `pw_g_${TS}`, 'GsTest123456!', {
      region: '北京',
      gender: 'MALE',
    });
    await page.waitForURL((u) => u.pathname === '/', { timeout: 20_000 });
    await page.goto('/my');
    // 进入个人设置标签（若默认不在）
    const settingTab = page.getByText('个人设置').first();
    if (await settingTab.count()) await settingTab.click();
    await page.waitForTimeout(500);
    const values = await page.locator('select').evaluateAll((els) =>
      els.map((e) => (e as HTMLSelectElement).value),
    );
    expect(values, `性别应同步为 MALE，实际下拉值: ${JSON.stringify(values)}`).toContain('MALE');
  });

  test('BUG-04 已登录访问 /register 应重定向首页', async ({ page }) => {
    await uiLogin(page, USER.name, USER.pass);
    await page.goto('/register');
    await page.waitForURL((u) => u.pathname === '/', { timeout: 10_000 });
    expect(page.url(), '登录态不应停留在注册页').not.toContain('/register');
  });

  test('BUG-06 活动列表页与详情页参与人数一致', async ({ page }) => {
    await apiLoginAndInject(page, USER.name, USER.pass);
    await page.goto('/activities');
    const listText = await page
      .getByText(/\d+\s*\/\s*\d+\s*人参与/)
      .first()
      .textContent({ timeout: 15_000 });
    const listCount = parseCount(listText);
    expect(listCount, `列表页人数文本: "${listText}"`).not.toBeNull();

    // 打开同一活动的详情（卡片上的「查看详情」按钮）
    await page.getByRole('button', { name: '查看详情' }).first().click();
    await page.waitForURL(/\/activities\/\d+/, { timeout: 15_000 });
    await page.waitForTimeout(800);
    const detailText = await page
      .getByText(/\d+\s*\/\s*\d+\s*人/)
      .first()
      .textContent();
    const detailCount = parseCount(detailText);
    expect(detailCount, `详情页人数文本: "${detailText}"`).not.toBeNull();
    expect(
      detailCount,
      `列表页=${listCount} 详情页=${detailCount}，两处口径应一致`,
    ).toBe(listCount);
  });

  test('报名闭环回归 BUG-02/07/08/13（报名→家属校验→退出→驳回→重提）', async ({ page }) => {
    test.setTimeout(300_000);
    const nativeDialogs: string[] = [];
    page.on('dialog', (d) => {
      nativeDialogs.push(d.type());
      void d.dismiss();
    });

    const uname = `pw_flow_${TS}`;
    const dname = 'E2E流程回归';

    // 注册并登录（后端对注册有 IP 限流，被拦则等待窗口重置后重试）
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      await uiRegister(page, dname, attempt === 1 ? uname : `${uname}_${attempt}`, 'Flow123456!', {
        region: '北京',
        gender: 'MALE',
      });
      ok = await page
        .waitForURL((u) => u.pathname === '/', { timeout: 15_000 })
        .then(() => true)
        .catch(() => false);
      if (!ok && attempt < 3) await page.waitForTimeout(65_000);
    }
    if (!ok) throw new Error('注册连续被限流，请稍后重跑');

    // 打开 Running1 详情（不存在则取第一个活动）
    await openActivityDetail(page, 'Running1');
    const detailUrl = page.url();

    // 展开报名表单（若需要）
    const openBtn = page.getByRole('button', { name: '立即报名' }).first();
    if (await openBtn.count()) await openBtn.click();

    // ── BUG-07：空姓名家属行应被校验拦截 ──
    await page.getByRole('button', { name: '添加家属' }).click();
    await page.locator('form button[type="submit"]').last().click();
    await expect(
      page.getByText(/家属姓名不能为空/).first(),
      '空姓名家属提交应出现校验提示（BUG-07）',
    ).toBeVisible({ timeout: 10_000 });
    expect(nativeDialogs, '不应出现浏览器原生对话框').toHaveLength(0);

    // ── BUG-08：填写家属后正常报名 ──
    await page.getByPlaceholder('家属姓名').fill('黑盒家属');
    const note = page.locator('textarea:visible').first();
    if (await note.count()) await note.fill('E2E 自动化报名说明');
    await page.locator('form button[type="submit"]').last().click();
    await expect(page.getByText('报名提交成功，请等待审核')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('审核中').filter({ visible: true }).first()).toBeVisible({ timeout: 10_000 });
    // 家属信息回显（BUG-08 展示侧）
    await expect(
      page.getByText(/携带\s*1\s*名家属|携带1名家属|黑盒家属/).filter({ visible: true }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // ── BUG-02：退出活动应为站内自定义模态框，而非原生 confirm ──
    await page.getByRole('button', { name: '退出活动' }).first().click();
    const modal = page.locator('[role="alertdialog"]');
    await expect(modal, '应弹出自定义确认模态框').toBeVisible({ timeout: 10_000 });
    await expect(modal.getByRole('heading', { name: '确认退出' })).toBeVisible();
    expect(nativeDialogs, '退出确认不应使用浏览器原生 confirm（BUG-02）').toHaveLength(0);
    await modal.getByRole('button', { name: '确认退出' }).click();
    await expect(page.getByText('退出活动成功')).toBeVisible({ timeout: 10_000 });

    // 重新报名（待审核），为 BUG-13 做准备
    const openBtn2 = page.getByRole('button', { name: '立即报名' }).first();
    if (await openBtn2.count()) await openBtn2.click();
    const note2 = page.locator('textarea:visible').first();
    if (await note2.count()) await note2.fill('E2E 第二次报名');
    await page.locator('form button[type="submit"]').last().click();
    await expect(page.getByText('报名提交成功，请等待审核')).toBeVisible({ timeout: 15_000 });

    // ── 管理员驳回该报名（走管理端 UI）──
    await logout(page);
    await uiLogin(page, ADMIN.name, ADMIN.pass); // 管理员登录后直达 /admin
    await page.goto('/admin/participations');
    const search = page.getByPlaceholder(/搜索员工姓名/);
    if (await search.count()) await search.fill(dname);
    await page.waitForTimeout(800);
    const row = page.locator('tr').filter({ hasText: dname }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.getByRole('button', { name: '驳回' }).first().click();
    const rejectModal = page.locator('text=驳回报名').locator('..').locator('..');
    await page.getByPlaceholder('请输入驳回原因...').fill('E2E 回归测试驳回');
    await page.getByRole('button', { name: '确认驳回' }).click();
    await expect(page.getByText('驳回成功')).toBeVisible({ timeout: 15_000 });

    // ── BUG-13：驳回后「修改后重新提交」应成功 ──
    await logout(page);
    await apiLoginAndInject(page, uname, 'Flow123456!');
    await page.goto(detailUrl);
    await expect(page.getByText('已驳回').filter({ visible: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/驳回原因/).filter({ visible: true }).first()).toBeVisible();
    await page.getByRole('button', { name: '修改后重新提交' }).filter({ visible: true }).first().click();
    const note3 = page.locator('textarea:visible').first();
    if (await note3.count()) await note3.fill('E2E 驳回后重新提交说明');
    await page.locator('form button[type="submit"]').last().click();
    await expect(
      page.getByText('重新提交成功，请等待审核'),
      '驳回后重提应成功（BUG-13）',
    ).toBeVisible({ timeout: 15_000 });
    expect(nativeDialogs, '全流程不应出现原生对话框').toHaveLength(0);

    // 清理：重提后的记录为「已重提」状态，按规则仅待审核可退出——
    // 接受「退出成功」或明确的规则提示两种结果
    await page.getByRole('button', { name: '退出活动' }).first().click();
    await page.locator('[role="alertdialog"]').getByRole('button', { name: '确认退出' }).click();
    await expect(
      page.getByText(/退出活动成功|仅待审核状态可退出活动/).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('BUG-10 管理端深链接与刷新保持会话（不再撞登录墙）', async ({ page }) => {
    await uiLogin(page, ADMIN.name, ADMIN.pass);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText('数据看板').first()).toBeVisible({ timeout: 15_000 });

    // 整页打开深链接
    await page.goto('/admin/participations');
    expect(page.url(), '不应被踢到废弃管理端登录墙 (#/login)').not.toContain('#/login');
    expect(await page.title(), '应由新 SPA 接管').toBe('CSR Magic');
    await expect(page.getByText('数据看板').first()).toBeVisible({ timeout: 15_000 });

    // 刷新后仍保持管理端
    await page.reload();
    expect(page.url()).not.toContain('#/login');
    await expect(page.getByText('数据看板').first()).toBeVisible({ timeout: 15_000 });
  });

  test('BUG-11 删除带报名记录的活动应有成功或明确报错反馈', async ({ page }) => {
    await uiLogin(page, ADMIN.name, ADMIN.pass);
    await page.goto('/admin/activities');
    // 先等列表加载完成（不能立即 count，否则数据未返回会误判为不存在）
    const row = page.locator('tr').filter({ hasText: '黑盒测试活动' }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    await row.getByRole('button', { name: '删除' }).first().click();
    const confirmBtn = page.getByRole('button', { name: '确认删除' });
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });
    await confirmBtn.click();

    // 期望：行消失（成功）或出现明确错误提示（模态内展示后端 message）；不允许静默
    await expect(row).toBeHidden({ timeout: 15_000 }).catch(async () => {
      const errShown = await page
        .getByText(/失败|请先|无法|还有\s*\d+\s*条/)
        .first()
        .isVisible()
        .catch(() => false);
      expect(errShown, '删除被拒时必须展示明确错误（BUG-11 静默失败未修复）').toBeTruthy();
    });
  });

  test('BUG-12 海报「分享到动态」应有可见反馈', async ({ page }) => {
    test.setTimeout(180_000);
    await apiLoginAndInject(page, USER.name, USER.pass);
    await page.goto('/poster');

    // 选择活动（第一个非占位项）
    const activitySelect = page.locator('select').first();
    await expect(activitySelect).toBeVisible({ timeout: 15_000 });
    const optCount = await activitySelect.locator('option').count();
    test.skip(optCount < 2, '无可生成海报的活动（tester_boundary 无已通过报名），跳过');

    await activitySelect.selectOption({ index: 1 });
    // 选择风格（第一个风格卡片）
    const styleBtn = page
      .getByRole('button')
      .filter({ hasText: /卡通|插画|简约|清新|热血|文艺|商务/ })
      .first();
    await styleBtn.click();
    await page.getByPlaceholder(/阳光明媚/).fill('E2E 回归测试：志愿者在公园植树');
    await page.getByRole('button', { name: '生成海报' }).click();

    // 等待生成完成（AI 生成约 20-60s）
    await expect(
      page.locator('img[alt="生成的海报"]'),
      '海报应生成成功',
    ).toBeVisible({ timeout: 120_000 });

    // 强制走降级路径（headless 下 Web Share 面板不可观察），验证反馈 toast
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });
    await page.getByRole('button', { name: '分享到动态' }).click();
    await expect(
      page.getByText(/海报链接已复制|分享失败/).first(),
      '分享后应出现明确反馈（BUG-12）',
    ).toBeVisible({ timeout: 10_000 });
  });
});
