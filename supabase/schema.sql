-- ============================================================
-- Echo 数据库 Schema
-- 在 Supabase Dashboard → SQL Editor → New query 中整段运行
-- ============================================================

-- gen_random_uuid 需要
create extension if not exists pgcrypto;

-- 用户表（匿名，按前端生成的 device_id 标识）
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  device_id text unique,
  created_at timestamptz default now()
);

-- 对话消息（供 /insights 聚合分析；mirror 存为 jsonb）
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_id text,
  role text not null,            -- 'user' | 'ai'
  content text,
  mirror jsonb,                  -- { signals, strategy, blindspots, limitation }
  created_at timestamptz default now()
);

-- 日记（完全私密，不送 AI）
create table if not exists journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  content text,
  emotion text,                 -- 焦虑|低落|平静|感激|迷茫|希望
  preview text,
  created_at timestamptz default now()
);

-- 现实任务完成记录
create table if not exists quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  quest_id text,
  created_at timestamptz default now()
);

-- 索引（加速按用户 + 时间的查询）
create index if not exists idx_messages_user_time on messages(user_id, created_at);
create index if not exists idx_journals_user_time on journals(user_id, created_at desc);
create index if not exists idx_quests_user_time on quests(user_id, created_at);

-- 说明：
-- 后端用 service_role key 访问，会绕过 RLS，因此无需额外配置 RLS policy。
-- 如果你后续接入 Supabase 匿名登录，可再为 anon key 配置 RLS。
