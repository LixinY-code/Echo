# Echo 部署指南（Vercel + DeepSeek + Supabase）

全栈部署：前端静态托管 + `/api` Serverless 函数同源，后端调 DeepSeek 生成回复、读写 Supabase。

---

## 总览

```
浏览器 → Vercel（前端 dist + /api 函数）→ DeepSeek API（生成回复）
                                       → Supabase Postgres（存对话/日记/任务）
```

需要准备 3 样东西：**DeepSeek API Key**、**Supabase 项目**、**GitHub 仓库**（已有）。

---

## 第 1 步：本地推送最新代码

后端代码刚提交，需要再 push 一次（你的终端已认证过，直接推）：

```bash
cd "C:/Users/28713/WorkBuddy/2026-07-17-00-44-03/echo"
git push
```

## 第 2 步：建 Supabase 数据库

1. 打开 https://supabase.com 注册/登录 → **New Project**
   - Name: `echo`
   - Database Password: 设一个强密码并记好
   - Region: 选最近的（如 Singapore / Hong Kong）
2. 等待项目初始化完成（约 2 分钟）
3. 进入项目 → 左侧 **SQL Editor** → **New query**
4. 打开本仓库的 `supabase/schema.sql`，**整段复制粘贴**到编辑器 → **Run**
5. 执行成功后，左侧 **Table Editor** 能看到 4 张表：`users / messages / journals / quests`
6. 回到 **Settings → API**，记下两个值：
   - **Project URL**（形如 `https://xxxxx.supabase.co`）
   - **service_role** secret key（⚠️ 注意是 service_role，不是 anon；这个 key 千万不要泄露）

## 第 3 步：申请 DeepSeek API Key

1. 打开 https://platform.deepseek.com 注册
2. **API Keys → Create API Key** → 复制 `sk-` 开头的 key
3. 充值少量余额（新用户通常有赠送；DeepSeek 很便宜，¥1 约可聊上千轮）

## 第 4 步：Vercel 部署

1. 打开 https://vercel.com → 用 GitHub 登录
2. **Add New → Project → Import Git Repository** → 选 `LixinY-code/Echo`
3. Vercel 会自动识别为 Vite 项目，构建配置无需改动：
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 展开 **Environment Variables**，添加这 5 个：

   | Name | Value | 说明 |
   | --- | --- | --- |
   | `VITE_USE_MOCK` | `false` | 关掉前端 mock，走真实后端 |
   | `VITE_API_BASE_URL` | `/api` | 同源，免跨域 |
   | `DEEPSEEK_API_KEY` | `sk-你的key` | 仅服务端可见 |
   | `SUPABASE_URL` | `https://xxxxx.supabase.co` | 第 2 步获取 |
   | `SUPABASE_SERVICE_ROLE` | `eyJ...` | 第 2 步获取（service_role） |

5. 点 **Deploy**，等待 1-2 分钟构建完成
6. 部署成功后会得到一个 `https://echo-xxx.vercel.app` 地址

## 第 5 步：验证

打开部署地址，测试：
- `/chat` 发一条消息 → AI 应回复温暖文字，点「为什么这样回？」能展开 Mirror 面板（真实 DeepSeek 生成）
- `/journal` 写一篇日记 → 刷新还在（已存进 Supabase）
- `/insights` 等积累一些对话后，会有「写给你的一封信」
- `/corner` 点「我做了」→ 花园生长

如果对话报错，去 Vercel 项目 → **Logs** 查看函数日志（多半是 DeepSeek key 或 Supabase 变量没填对）。

---

## 本地调试（可选）

```bash
npm install -g vercel      # 装 Vercel CLI
cd echo
vercel dev                 # 一个端口跑前端 + /api
```

`vercel dev` 会读取本地 `.env.local`（按 `.env.example` 填好后端变量），可在本地调通真实后端，再推送。

---

## 常见问题

**Q：对话返回 500 / 超时？**
A：Vercel Hobby 版函数限时 10 秒。DeepSeek 偶尔慢。如频繁超时，升级 Vercel Pro（函数可到 60 秒），或我帮你把 `/lab` 改成更短的 prompt。

**Q：前端还是 mock 数据？**
A：确认 Vercel 环境变量 `VITE_USE_MOCK=false` 已生效（改完需 Redeploy）。`VITE_` 前缀变量是构建时注入的，改完必须重新部署。

**Q：service_role key 安全吗？**
A：它只在 `/api` 服务端函数用，前端 bundle 里没有。但不要把它写进代码或提交到 git——只放 Vercel 环境变量。

**Q：怎么清空数据重来？**
A：Supabase SQL Editor 跑 `truncate users, messages, journals, quests;`
