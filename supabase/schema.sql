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

-- 用户侧写（来自新用户引导问卷 + 每次对话累积的长期记忆）
create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  nickname text,
  personality text,            -- 'I' | 'E'，可为空（跳过）
  tags text[] default '{}',    -- 自我描述关键词（来自问卷）
  onboarded boolean default false,
  -- 长期记忆侧写（每次对话后由 DeepSeek profile_update 累积）
  known_topics text[] default '{}',      -- 已知关注话题（去重累积，最多 20）
  last_emotion text,                     -- 上次主要情绪
  detected_scenario text,                -- 上次场景（学业/职业/心理/社交/考试）
  interaction_count int default 0,       -- 累计对话次数
  profile_insights text[] default '{}',  -- 累积洞察（最多 10 条）
  updated_at timestamptz default now()
);

-- 若 user_profiles 表已存在（旧版只有 nickname/personality/tags），补字段：
alter table user_profiles add column if not exists known_topics text[] default '{}';
alter table user_profiles add column if not exists last_emotion text;
alter table user_profiles add column if not exists detected_scenario text;
alter table user_profiles add column if not exists interaction_count int default 0;
alter table user_profiles add column if not exists profile_insights text[] default '{}';
