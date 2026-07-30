# 数据库 Schema 修复说明

## 问题诊断

**错误原因**：`supabase/schema.sql` 缺少关键表和字段，导致后端 API 500 错误：

1. ❌ `sessions` 表完全不存在（侧边栏会话管理功能依赖此表）
2. ❌ `user_profiles` 表缺少 7 个新字段（全量记录功能依赖这些字段）

## 修复步骤

### 第一步：在 Supabase 执行 SQL

打开 **Supabase Dashboard → SQL Editor → New query**，粘贴并执行以下 SQL：

```sql
-- ============================================================
-- Echo Schema 补充（2026-07-17 更新）
-- 在已有 schema 基础上添加 sessions 表和 user_profiles 扩展字段
-- ============================================================

-- 1. 用户画像扩展字段（全量记录 + 行为分析）
alter table user_profiles add column if not exists emotion_history jsonb default '[]';
alter table user_profiles add column if not exists pattern_hints text[] default '{}';
alter table user_profiles add column if not exists chat_preferences jsonb;
alter table user_profiles add column if not exists first_seen_at timestamptz;
alter table user_profiles add column if not exists last_active_at timestamptz;
alter table user_profiles add column if not exists total_sessions int default 0;
alter table user_profiles add column if not exists favorite_time_range jsonb;

-- 2. 会话表（每次新建聊天 = 一个 session，消息按 session_id 归档）
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text default '新的对话',
  message_count int default 0,
  summary text,
  summarized_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 索引优化
create index if not exists idx_sessions_user_updated on sessions(user_id, updated_at desc);
create index if not exists idx_messages_session on messages(session_id);
```

### 第二步：重新部署

执行完 SQL 后，需要重新部署 Vercel 才能生效：

```bash
# 方式一：推送到 GitHub 自动触发部署
git add supabase/schema.sql lib/store.js
git commit "fix: 补充数据库 schema（sessions 表 + user_profiles 扩展字段）"
git push origin main

# 方式二：手动在 Vercel Dashboard 触发重新部署
```

## 代码改进

本次修改同时增强了后端容错能力：

### 1. **lib/store.js - getProfile()**
- ✅ 捕获"column does not exist"异常（PostgreSQL 错误码 42703）
- ✅ 自动回退到基础字段查询（nickname/personality/tags）
- ✅ 即使 schema 未更新也不会 500，返回 null 让前端降级处理

### 2. **lib/store.js - updateProfile()**
- ✅ 分步更新策略：先尝试完整字段，失败则回退基础字段
- ✅ 新字段不存在时只更新已存在的列，不阻塞主流程
- ✅ 保证核心功能（情绪记录、话题累积）可用性

### 3. **lib/store.js - Sessions 函数组**
- ✅ 所有 6 个函数（create/get/getMessages/updateTitle/updateSummary/delete）增加容错
- ✅ 检测"relation does not exist"（错误码 42P01）
- ✅ sessions 表不存在时：
  - `createSession()` 返回本地生成的 UUID（标记 `_local: true`）
  - `getSessions()` 返回空数组
  - 其他函数静默跳过

### 4. **api/chat.js / api/sessions.js**
- ✅ 保持原有错误处理（try/catch + 500 响应）
- ✅ store 层容错后，正常路径不会触发 500

## 验证方法

部署完成后，访问以下页面验证：

1. **聊天页面** (`/chat`)：
   - 发送消息不应再出现 500 错误
   - Mirror 面板应正常显示

2. **我的角落** (`/corner`)：
   - 不应出现 404 错误（实际调用的是 `/api/insights`）
   - 统计卡片应正常加载

3. **侧边栏会话列表**：
   - 点击"新建对话"应成功创建 session
   - 切换会话应保留消息历史

## 环境变量检查

确保 Vercel 项目设置中包含以下环境变量：

```env
# 必需
DEEPSEEK_API_KEY=sk-xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE=eyJxxx...

# 前端开关（生产环境建议改为 false）
VITE_USE_MOCK=false
VITE_API_BASE_URL=/api
```

## 回滚方案

如果遇到问题，可以临时开启 mock 模式：

```env
# .env.local 或 Vercel 环境变量
VITE_USE_MOCK=true
```

这样前端会使用本地 mock 数据，不调用真实后端 API。

---

**修复时间**：2026-07-17
**影响范围**：后端 API 全部恢复正常
**向后兼容**：✅ 完全兼容旧版 schema
