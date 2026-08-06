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

-- 用户画像扩展字段（全量记录 + 行为分析）
alter table user_profiles add column if not exists emotion_history jsonb default '[]';
alter table user_profiles add column if not exists pattern_hints text[] default '{}';
alter table user_profiles add column if not exists chat_preferences jsonb;
alter table user_profiles add column if not exists first_seen_at timestamptz;
alter table user_profiles add column if not exists last_active_at timestamptz;
alter table user_profiles add column if not exists total_sessions int default 0;
alter table user_profiles add column if not exists favorite_time_range jsonb;

-- 会话表（每次新建聊天 = 一个 session，消息按 session_id 归档）
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text default '新的对话',
  message_count int default 0,
  summary text,
  analysis text,
  reflection_question text,
  summarized_at timestamptz,
  -- EmotionTree 果实数据（v4.0 情绪果实功能）
  emotion_type text,              -- 'joy'|'warm'|'sad'|'anxious'|'confused'|'calm'
  emotion_color text,             -- 马卡龙色 hex（如 '#FFB6C1'）
  full_summary text,              -- 300 字详细总结（用于悬停弹窗）
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sessions_user_updated on sessions(user_id, updated_at desc);
create index if not exists idx_messages_session on messages(session_id);

-- 若 sessions 表已存在（旧版无 emotion 字段），补字段：
alter table sessions add column if not exists emotion_type text;
alter table sessions add column if not exists emotion_color text;
alter table sessions add column if not exists full_summary text;
alter table sessions add column if not exists analysis text;
alter table sessions add column if not exists reflection_question text;

-- 微光任务（Glimmer Quests）：轻量日常彩蛋任务
-- 每天 1-3 个，date 为上海时区日期；午夜后自然过期（不再返回）
create table if not exists glimmer_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  quest_key text,                -- 任务池标识（如 'sky-photo'）
  text text not null,            -- 任务文案快照
  emoji text,                    -- 小图标
  date date not null,            -- 所属日期（Asia/Shanghai）
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_glimmer_user_date on glimmer_quests(user_id, date);
-- 防并发重复生成：同一用户同一天同一任务唯一
create unique index if not exists idx_glimmer_user_date_key on glimmer_quests(user_id, date, quest_key);

-- 盲点花园（Blindspot Garden）：把 AI 的"可能盲点"种下，靠反思行为养大
create table if not exists blindspot_seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  blindspot_text text not null,      -- 盲点原文（来自 Response Mirror）
  theme text,                        -- 主题（命名前半段，种下时提取）
  plant_name text,                   -- 植物名（成熟时随机揭晓）
  growth int default 0,              -- 成长点数（内部状态，UI 不展示）
  stage text default 'seed',         -- 'seed' | 'sprout' | 'mature'
  message text,                      -- 成熟后的个性化提示语
  triggers jsonb default '[]',       -- [{type:'view'|'journal'|'lab', date:'YYYY-MM-DD'}] 按日去重
  source_session_id text,            -- 来源会话（种下时记录）
  source_session_title text,         -- 来源会话标题（提示语引用）
  planted_at timestamptz default now(),
  matured_at timestamptz
);

-- 同一盲点不重复种
create unique index if not exists idx_blindspot_user_text on blindspot_seeds(user_id, blindspot_text);
create index if not exists idx_blindspot_user on blindspot_seeds(user_id, planted_at);
