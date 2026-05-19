---
module: participation
feature: family-companion
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/api-guidelines.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/AdminApp.tsx
    lines: 557-757
    desc: 参与审核页（用于扩展家属信息展示区块）
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/participation/design-signup.md
  - docs/modules/activity/design-activity-crud.md
---

# 家属同行报名 — 技术设计

## 概述
在现有报名流程上扩展"家属同行"能力：在 `activity` 表新增 2 列控制是否允许及上限，在 `user_activity` 表新增 1 列以 JSONB 形式存储家属列表（姓名 + 关系）。前端 SignupForm 条件渲染独立的 `FamilyMembersInput` 组件，管理端活动表单加开关，参与审核详情展示家属列表。家属仅作为附属信息，不独立审核、不独立通知、不独立生成海报。

## 决策摘要

| 决策点 | 方案 | 原因 |
|--------|------|------|
| 名额计算 | 员工 + 家属合并占用 `maxParticipants` | 直观、避免现场超员 |
| 家属字段 | 仅姓名 + 关系（4 种枚举） | 最小集，规避身份证/电话隐私合规 |
| 配置粒度 | 活动级开关 + 每人上限 | 灵活，不绑死模板类型 |
| 存储方式 | `user_activity.family_members` JSONB | 家属仅附属，无独立查询/审核需求；删除主记录时自动级联 |
| 数据迁移 | 旧活动默认 `allowFamily=false` | 完全向后兼容 |

## API 端点变更

### 现有端点扩展（无新增路径）

| 方法 | 路径 | 字段变更 |
|------|------|----------|
| POST | `/api/v2/activities`（CreateActivityRequest） | 请求体新增 `allowFamily`、`maxFamilyPerUser` |
| PUT | `/api/v2/activities/{id}`（UpdateActivityRequest） | 请求体新增 `allowFamily`、`maxFamilyPerUser` |
| GET | `/api/v2/activities`、`/api/v2/activities/{id}` | ActivityResponse / ActivityDetailResponse 新增 `allowFamily`、`maxFamilyPerUser`、`currentOccupiedSlots` |
| POST | `/api/v2/participations/signup` | 请求体新增 `familyMembers: [{name, relation}]` |
| GET | `/api/v2/participations/my` | MyParticipationResponse 新增 `familyMembers` |
| GET | `/api/v2/participations` | ParticipationResponse 新增 `familyMembers`（管理端审核详情） |

### 请求体示例

**SignupRequest（扩展后）**：
```json
{
  "activityId": 1,
  "formData": "{\"hours\": 4}",
  "familyMembers": [
    { "name": "张小明", "relation": "SPOUSE" },
    { "name": "张小红", "relation": "CHILD" }
  ]
}
```

**CreateActivityRequest 与 UpdateActivityRequest（扩展后）**：
```json
{
  "name": "周末植树活动",
  "templateType": "VOLUNTEER",
  "maxParticipants": 50,
  "allowFamily": true,
  "maxFamilyPerUser": 3,
  "...": "其他原有字段"
}
```

## 数据模型

### 表结构变更

**`activity` 表新增 2 列**：

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `allow_family` | BOOLEAN | `false` | 是否允许携带家属 |
| `max_family_per_user` | INT | NULL | 每人最多携带家属数；NULL = 不限 |

**`user_activity` 表新增 1 列**：

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `family_members` | JSONB | NULL | 家属数组：`[{"name":"张小明","relation":"SPOUSE"}]` |

### 关系枚举（`FamilyRelation`）

| 值 | 中文 |
|----|------|
| `SPOUSE` | 配偶 |
| `CHILD` | 子女 |
| `PARENT` | 父母 |
| `OTHER` | 其他 |

### 名额聚合公式

```sql
-- 已占用名额
SELECT COALESCE(SUM(1 + COALESCE(JSONB_ARRAY_LENGTH(family_members), 0)), 0) AS occupied
FROM user_activity
WHERE activity_id = :activityId;
```

报名校验：`occupied + 1 + familyMembers.length ≤ activity.max_participants`（仅 `max_participants` 非 NULL 时校验）。

## 前端实现

### 类型定义（`types/`）

- `types/activity.ts`：`Activity` 接口加 `allowFamily: boolean` 与 `maxFamilyPerUser: number | null`
- `types/participation.ts`：
  - 新增 `FamilyRelation` 字面量类型
  - 新增 `FamilyMember` 接口 `{ name: string; relation: FamilyRelation }`
  - `SignupRequest` / `Participation` / `MyParticipation` 加 `familyMembers: FamilyMember[]`

### 常量

- 新建 `constants/familyRelation.ts`：
  - `FAMILY_RELATION_LABELS: Record<FamilyRelation, string>`
  - `FAMILY_RELATION_OPTIONS: Array<{value, label}>`（下拉选项）

### 组件

**新建 `components/FamilyMembersInput.tsx`**：
- Props：`value: FamilyMember[]`, `onChange`, `maxCount: number | null`, `disabled?`
- 顶部提示文案 + 当前/最大计数
- 列表项：姓名 input + 关系下拉 + 删除按钮
- 底部"+ 添加家属"按钮（达上限禁用）
- 校验：姓名 trim 后为空的项不参与 onChange 输出
- 移动端响应：每行 flex-wrap，姓名占满宽度，关系下拉与删除按钮在第二行

**修改 `components/SignupForm.tsx`**：
- 新增 props：`activity: Activity`（作为可选参数补充现有的 templateType / formSchemaJson，避免 breaking change）
- 在 `DynamicForm` 与提交按钮之间条件渲染 `FamilyMembersInput`（仅当 `activity?.allowFamily=true` 时）
- 提交时将 `familyMembers` 以 `onSubmit` 第二个参数（如 `onSubmit(formData, familyMembers)`）传递
- 重新提交场景：接受 `initialFamilyMembers` props 用于驳回后回填

**修改 `pages/ActivityDetailPage.tsx`**：
- 把 activity 整体传给 SignupForm
- `onSignup` 回调签名增加 `familyMembers` 参数
- "剩余名额"仍用 `maxParticipants - currentParticipants`（后端已合并计算）

**修改 `components/ParticipationList.tsx`**（个人中心“我的参与”列表）：
- 在每行活动名下方追加 `· 携带 N 名家属`（仅 N>0）
- MyParticipation 类型增加 `familyMembers` 字段后自动可用

### 管理端

**修改 `components/admin/ActivityFormDrawer.tsx`**：
- 在“人数上限”字段下方新增分组“家属同行配置”
  - Switch：“允许携带家属”
  - Switch 打开时展开 NumberInput：“每人最多携带家属数”（占位 “不限”，留空表示不限制）

**修改 `pages/admin/ParticipationPage.tsx` 内的 `ExpandedDetail` 子组件**：
- 在 formData 渲染区下方新增“家属列表”区块
- 显示“家属信息（共 N 人）”标题 + 列表 `姓名（中文关系）`
- 顶部信息行追加：“本次报名占用名额：(1 + N) 个”

**修改 `pages/admin/ParticipationPage.tsx` 表格列/卡片摘要**：
- 桌面端表格“参与内容摘要”单元格、移动端卡片摘要区都在原内容后追加 `· +N 家属`

### 服务层（`services/`）

无新增 API 端点，现有接口的请求/响应类型自动更新。

## 后端实现

### 包结构

复用现有包，不新增子包：
- `com.csr.activity` — Entity / DTO / Service 扩展
- `com.csr.participation` — Entity / DTO / Service 扩展，新增 `FamilyMemberDto`、枚举 `FamilyRelation`

### Entity 变更

**`Activity` Entity**：
```java
@Column(name = "allow_family", nullable = false)
private boolean allowFamily = false;

@Column(name = "max_family_per_user")
private Integer maxFamilyPerUser;
```

**`UserActivity` Entity**：
```java
@Column(columnDefinition = "jsonb")
@JdbcTypeCode(SqlTypes.JSON)
private String familyMembers;  // 序列化后的 JSON 数组字符串
```

> 注：保持与现有 `formData` 一致的 String + JdbcTypeCode 方案，避免引入额外的 JPA Converter；Service 层用 Jackson 序列化/反序列化为 `List<FamilyMemberDto>`。

### DTO

**新建 `participation/dto/FamilyMemberDto`（record）**：
```java
public record FamilyMemberDto(
    @NotBlank(message = "家属姓名不能为空")
    @Size(max = 100, message = "家属姓名不能超过100字")
    String name,
    @NotNull(message = "家属关系不能为空")
    FamilyRelation relation
) {}
```

**修改 `SignupRequest`（record）**：
```java
public record SignupRequest(
    @NotNull Long activityId,
    String formData,
    @Valid List<FamilyMemberDto> familyMembers  // 可空，等价于无家属
) {}
```

**修改 `ParticipationResponse` / `MyParticipationResponse`**：
- 新增字段 `List<FamilyMemberDto> familyMembers`
- `from(entity)` 工厂方法负责 JSON 反序列化（复用 ObjectMapper bean，不在 record 内部 new）

**修改 `CreateActivityRequest` / `UpdateActivityRequest`**：
- 新增字段 `Boolean allowFamily`（包装类型以容许 UpdateActivityRequest 中未传为 null）、`Integer maxFamilyPerUser`

**修改 `ActivityResponse` / `ActivityDetailResponse`**：
- 新增字段 `boolean allowFamily`、`Integer maxFamilyPerUser`、`long currentOccupiedSlots`

### 枚举

**新建 `participation/entity/FamilyRelation`**：
```java
public enum FamilyRelation { SPOUSE, CHILD, PARENT, OTHER }
```

### Service 层逻辑

**`ActivityServiceImpl.create / update`**：
- 直接持久化 `allowFamily` / `maxFamilyPerUser` 字段
- 校验：若 `allowFamily=false`，强制将 `maxFamilyPerUser` 置 NULL
- 校验：若 `maxFamilyPerUser != null`，必须 ≥ 1

**`ParticipationServiceImpl.signup`**（在现有逻辑插入家属校验）：
1. 加载 `Activity`（已有）
2. 校验活动状态（已有）
3. **新增**：若 `request.familyMembers` 非空：
   - `activity.allowFamily=false` → throw `BusinessException(400, "本活动不允许携带家属")`
   - `activity.maxFamilyPerUser != null && size > maxFamilyPerUser` → throw `BusinessException(400, "超出家属人数限制")`
4. 校验重复报名（已有）
5. **修改名额校验**：调用 `userActivityRepository.sumOccupiedSlots(activityId)`，比较 `occupied + 1 + companions ≤ maxParticipants`
6. 持久化：将 `familyMembers` Jackson 序列化为 JSON 字符串存入 `UserActivity.familyMembers`
7. 通知发送（已有，无变更）

**`ParticipationServiceImpl.review`**：无逻辑变更（家属不独立审核）

**`ParticipationServiceImpl.withdraw`**：无逻辑变更（删除主记录时家属随之消失）

### Repository

**`UserActivityRepository`** 新增聚合查询：
```java
@Query(value = "SELECT COALESCE(SUM(1 + COALESCE(JSONB_ARRAY_LENGTH(family_members), 0)), 0) " +
               "FROM user_activity WHERE activity_id = :activityId",
       nativeQuery = true)
long sumOccupiedSlots(@Param("activityId") Long activityId);
```

> 现有 `countByActivityId` 仍保留供他处使用（如显示员工人数），名额校验改用 `sumOccupiedSlots`。

### Activity.currentParticipants 计算

`ActivityResponse.from(...)` 中 `currentParticipants` 字段含义不变（参与记录数，即员工人数）。前端需要新字段或在前端展示时调整：

**方案选择**：保持 `currentParticipants = 参与记录数`（不变），新增 `currentOccupiedSlots`（含家属）字段返回给前端。

- `ActivityResponse` 新增 `currentOccupiedSlots: long`
- 前端"剩余名额"按 `maxParticipants - currentOccupiedSlots` 计算
- 现有"参与人数"展示仍可用 `currentParticipants`（员工数）

### Dashboard 影响

`DashboardService` 现有"参与人次"统计基于 `user_activity` 行数，需选择口径：
- **本期决策**：保留现有"参与人次 = 参与记录数（员工数）"；新增"含家属总人次"指标，前端 Dashboard 可选展示
- 若时间紧张，可在 P1 阶段补齐 Dashboard 改造，本期 spec 不强制

## Flyway 迁移

新建 `csr_magic_backend/src/main/resources/db/migration/V8__add_family_companion.sql`（当前最大版本为 V7__create_ai_poster_table.sql）：

```sql
ALTER TABLE activity
  ADD COLUMN allow_family BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN max_family_per_user INT;

ALTER TABLE user_activity
  ADD COLUMN family_members JSONB;

COMMENT ON COLUMN activity.allow_family IS '是否允许员工报名时携带家属';
COMMENT ON COLUMN activity.max_family_per_user IS '每位员工最多携带家属数；NULL 表示不限';
COMMENT ON COLUMN user_activity.family_members IS '家属列表 JSON：[{name, relation}]';
```

> 迁移务必在事务内执行完成，Flyway 默认行为即可。

## 实现步骤清单（Implementation Checklist）

### 后端
1. [x] Flyway 迁移 V8：`activity.allow_family` + `max_family_per_user`、`user_activity.family_members`
2. [x] 新建枚举 `FamilyRelation`（SPOUSE/CHILD/PARENT/OTHER）
3. [x] 新建 DTO `FamilyMemberDto`（带 @Valid 校验）
4. [x] `Activity` Entity：加 `allowFamily`、`maxFamilyPerUser` 字段及访问器
5. [x] `UserActivity` Entity：加 `familyMembers` JSONB 字段（String + @JdbcTypeCode(SqlTypes.JSON)）
6. [x] 修改 `CreateActivityRequest` / `UpdateActivityRequest`：新增字段
7. [x] 修改 `ActivityResponse` / `ActivityDetailResponse`：新增字段及 `currentOccupiedSlots`
8. [x] 修改 `ActivityServiceImpl.create/update`：开关与上限校验，关闭时清空 maxFamilyPerUser，计算 currentOccupiedSlots
9. [x] 修改 `SignupRequest`：新增 `familyMembers`（@Valid）
10. [x] 修改 `ParticipationResponse` / `MyParticipationResponse`：返回 familyMembers（Jackson 反序列化）
11. [x] 修改 `ParticipationServiceImpl.signup`：开关校验 + 上限校验 + 合并名额校验 + 持久化
12. [x] `UserActivityRepository`：新增 `sumOccupiedSlots(activityId)` native query
13. [ ] 后端 Service 单元测试（JUnit 5 + Mockito）：
    - [ ] `ActivityServiceImplTest`：allowFamily 关闭时 maxFamilyPerUser 被清空 / maxFamilyPerUser < 1 拒绝
    - [ ] `ParticipationServiceImplTest.signup`：开关关闭拒绝带家属
    - [ ] `ParticipationServiceImplTest.signup`：超 maxFamilyPerUser 拒绝
    - [ ] `ParticipationServiceImplTest.signup`：合并名额超 maxParticipants 拒绝
    - [ ] `ParticipationServiceImplTest.signup`：正常带家属持久化成功并反序列化正确
14. [ ] 后端 Controller 权限集成测试（@WebMvcTest）：
    - [ ] `ParticipationControllerTest`：signup 带 familyMembers 请求参数校验（空姓名 400、非法枚举 400）
    - [ ] `ActivityControllerTest`：create/update 带 allowFamily、maxFamilyPerUser 参数校验

### 前端
15. [x] 修改 `types/activity.ts`：`Activity` 加 `allowFamily`、`maxFamilyPerUser`、`currentOccupiedSlots`（同步 ActivityDetail 类型）
16. [x] 修改 `types/participation.ts`：新增 `FamilyRelation`、`FamilyMember`，扩展 `SignupRequest` / `Participation` / `MyParticipation`
17. [ ] 新建 `constants/familyRelation.ts`：枚举 label 映射 + 下拉选项
18. [x] 新建组件 `components/FamilyMembersInput.tsx`：可重复字段块，接受 `value`/`onChange`/`maxCount`/`disabled`
19. [x] 修改 `components/SignupForm.tsx`：可选接 activity 参数，条件渲染 FamilyMembersInput，`onSubmit` 参数扩展 `(formData, familyMembers)`，接受 `initialFamilyMembers` 驳回后回填
20. [x] 修改 `pages/ActivityDetailPage.tsx`：
    - [x] 传 activity 给 SignupForm
    - [x] `onSignup` 回调透传 familyMembers
    - [x] 剩余名额改用 `currentOccupiedSlots`、名额满判断也以该字段为准
    - [x] 驳回后重提交时，从 `currentUserParticipation.familyMembers` 取 initialFamilyMembers 回填
21. [x] 修改 `components/ParticipationList.tsx`：在活动名下方显示“携带 N 名家属”（仅 N>0）
22. [x] 修改管理端 `components/admin/ActivityFormDrawer.tsx`：加 Switch + NumberInput 分组，关闭 Switch 时提交 maxFamilyPerUser=null
23. [x] 修改管理端 `pages/admin/ParticipationPage.tsx` 内的 `ExpandedDetail` 子组件：渲染家属列表 + 占用名额显示
24. [x] 修改管理端 `pages/admin/ParticipationPage.tsx` 表格列/卡片摘要：参与摘要追加 `· +N 家属`
25. [x] 前端单元测试（vitest + RTL）：
    - [x] `FamilyMembersInput.test.tsx`：添加/删除/上限禁用/空姓名过滤/驳回回填
    - [x] `SignupForm.test.tsx`：allowFamily=true 渲染家属区块，=false 隐藏
26. [x] Playwright E2E（`e2e/family-companion.spec.ts`）：
    - [x] 管理员创建 allowFamily 活动 → 员工报名带 2 名家属 → 名额减 3
    - [x] 关闭 allowFamily 活动 → 报名表单不显示家属区块
    - [x] 带家属报名超上限被拒绝（剩余名额 ≦ 本人+家属数）
    - [x] 管理端审核详情正确显示家属列表
    - [x] 个人中心参与列表显示“携带 N 名家属”

### 文档与决策
27. [x] 更新 `docs/shared/data-models.md`：activity / user_activity 表结构
28. [x] 更新 `docs/shared/api-contracts.md`：SignupRequest / CreateActivityRequest / UpdateActivityRequest / ActivityResponse / ActivityDetailResponse / ParticipationResponse / MyParticipationResponse 字段
29. [x] 更新 `docs/modules/participation/_index.md`：将“家属同行”状态改为 ✅ 已实现
30. [x] 更新 `agent.md`：Decision Log 记录核心决策（名额合并、JSONB 存储、按活动配置开关）
31. [x] 对照 `spec-family-companion.md` 验收标准逐项自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/AdminApp.tsx` | 557-757 | 参与审核详情区（在此基础上扩展家属信息块） |

> 本期家属信息区为新增内容，原型未直接覆盖，遵循现有设计令牌（`docs/shared/ui-design-tokens.md`）的色彩、间距与圆角规范。

## 边界与风险

| 风险点 | 缓解 |
|--------|------|
| 旧活动数据 | `allow_family DEFAULT FALSE`，行为完全不变 |
| 旧参与记录 | `family_members` NULL，前端识别为空数组 |
| 名额并发竞争 | 复用现有 signup 事务隔离；本期不引入额外悲观锁 |
| 家属姓名重复 | 不强制去重，仅做非空校验 |
| 关闭 allowFamily 后旧数据 | 历史 family_members 保留可见，不清空 |
| 隐私合规 | 仅姓名 + 关系，不含身份证/电话，合规风险低 |
| Dashboard 口径 | 本期保留员工数口径；后续可补"含家属总人次" |

## 不在本期范围

- 家属独立账号 / 独立通知
- 家属独立海报生成
- 家属独立审核（驳回单个家属）
- 家属字段扩展（年龄段 / 电话 / 身份证）
- AI 对话报名询问家属（待 ai-chat-registration 模块实现时再加）
- 海报 prompt 提及家属

## 引用
- 对应功能规格：`spec-family-companion.md`
- 依赖功能：`design-signup.md`、`design-activity-crud.md`
- 参考实现：`docs/exemplar/`
- 设计令牌：`docs/shared/ui-design-tokens.md`
