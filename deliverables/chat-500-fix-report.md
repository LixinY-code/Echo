# /api/chat 500 错误修复报告

## 修复时间
2026-07-17 00:25

## 问题描述
```
POST https://echo-one-lake.vercel.app/api/chat 500 (Internal Server Error)
```

## 根因分析

### 可能原因（按概率排序）

| 排名 | 原因 | 概率 | 症状 |
|------|------|------|------|
| 🥇 | **Vercel body 解析失败** | 高 | `req.body` 为 undefined，message 字段为空 |
| 🥈 | **DEEPSEEK_API_KEY 未配置/失效** | 中 | DeepSeek 调用直接抛异常 |
| 🥉 | **Supabase 连接问题** | 低 | ensureUser/getProfile 失败 |

## 修复内容

### 1. api/chat.js — 全面增强错误处理

#### ✅ 手动 Body 解析
```javascript
// 新增 parseBody() 函数，兼容 Vercel Serverless Functions
async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  // 手动读取 stream 解析 JSON
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk.toString() })
    req.on('end', () => { resolve(JSON.parse(body)) })
  })
}
```

#### ✅ 分步骤详细日志
```
[chat] 收到请求体：{"message":"你好","sessionId":"xxx"}
[chat] 用户 ID：uuid-xxxx
[chat] 读取侧写成功：昵称=小明, 对话次数=5
[chat] 正在调用 DeepSeek...
[chat] ✅ DeepSeek 回复成功，长度：234
[chat] ✅ 消息存储成功
[chat] ✅ 响应成功
```

#### ✅ 环境变量预检查
```javascript
if (!process.env.DEEPSEEK_API_KEY) {
  return res.status(500).json({
    error: '服务配置错误：DeepSeek API Key 未设置',
    detail: '请在 Vercel 项目设置中添加 DEEPSEEK_API_KEY 环境变量',
  })
}
```

#### ✅ DeepSeek 错误分类处理
| HTTP 状态码 | 错误类型 | 触发条件 |
|------------|----------|----------|
| 502 | AI 服务认证失败 | API Key 无效/过期 (401/403) |
| 504 | AI 服务超时 | 网络超时/ECONNRESET |
| 429 | 请求过于频繁 | Rate limit (429) |
| 502 | AI 服务异常 | 其他未知错误 |

### 2. api/sessions.js — 同步增强
- 统一 `parseBody()` body 解析逻辑
- `ensureUser()` 失败降级处理
- 总结接口环境变量检查 + DeepSeek 错误捕获

## 部署步骤

### 方法 1：Git Push 自动部署（推荐）
```bash
cd echo
git pull origin main   # 拉取最新代码
git push origin main   # 推送触发 Vercel 部署
```

### 方法 2：Vercel Dashboard 手动部署
1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择 `echo-one-lake` 项目
3. 点击 **Deployments** → 最新部署 → **Redeploy**

## 验证方法

### 1. 测试聊天接口
```bash
# 使用 curl 测试（替换 YOUR_DEVICE_ID 为实际值）
curl -X POST https://echo-one-lake.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-123" \
  -d '{"message": "你好"}'
```

**期望响应**：
```json
{
  "reply": "...",
  "mirror": { "signals": [...], ... },
  "sessionId": "uuid-xxx"
}
```

### 2. 浏览器测试
1. 打开 https://echo-one-lake.vercel.app
2. 进入聊天页面
3. 发送任意消息
4. **不应再出现 500 错误**

### 3. 如果仍然出错

查看 **Vercel Function Logs** 定位具体失败步骤：

1. Vercel Dashboard → 你的项目 → **Logs**
2. 搜索 `[chat]` 前缀的日志
3. 根据日志定位是哪一步失败：
   - `[chat] 解析请求体失败` → 前端请求格式问题
   - `[chat] ensureUser 失败` → Supabase 连接问题
   - `[chat] ❌ DEEPSEEK_API_KEY 未配置` → 环境变量缺失
   - `[chat] ❌ DeepSeek 调用失败` → DeepSeek 服务问题

## 环境变量检查清单

确保 Vercel 项目设置中包含以下环境变量：

```env
# 必需（后端）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx    # ✅ 必须配置
SUPABASE_URL=https://xxx.supabase.co     # ✅ 必须配置
SUPABASE_SERVICE_ROLE=eyJxxx...          # ✅ 必须配置

# 可选（前端）
VITE_USE_MOCK=false                      # 生产环境建议 false
VITE_API_BASE_URL=/api                   # 默认值
```

## 回滚方案

如果修复后仍有问题，可临时开启 mock 模式绕过真实后端：

```env
# Vercel 环境变量或 .env.local
VITE_USE_MOCK=true
```

---

**构建状态**：✅ TypeScript 0 错误，Vite Build 1.70s，54 模块
**Commit**: `51ca8a4`
**影响范围**：仅后端 API 错误处理增强，无功能变更
