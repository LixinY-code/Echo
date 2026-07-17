# Echo · 会呼吸的陪伴手帐

> 深夜里的一盏小台灯。一个面向深夜与 AI 倾诉的孤独大学生的 AI 陪伴素养平台。
> 在提供情绪支持的同时，用透明化面板揭示 AI 的回答机制，帮助用户理解 AI、反思自我。

## ✨ 特性

- **情境化开场**：根据客户端时间显示不同问候语 + 手绘台灯小书桌场景
- **AI 对话**：温暖气泡流，AI 回复可展开「Response Mirror」透明化面板
- **Response Mirror**：揭示情绪信号 / 回应策略 / 可能盲点 / 限制声明
- **Conversation Lab**：同一问题的三种回应风格对比（安慰 / 挑战 / 换框）
- **呼吸暂停提醒**：深夜时段或停留超 15 分钟，浮现 4-7-8 呼吸引导
- **情绪日记**：手撕纸张卡片，6 种情绪标签，完全私密
- **洞察周报**：以「写给你的一封信」形式呈现，逐行淡入
- **我的角落**：随现实任务完成而生长的手绘小花园

## 🎨 设计系统

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `cream` | `#FFF8F0` | 暖奶油主背景 |
| `ink` | `#4A3F35` | 深棕主文字 |
| `apricot` | `#F4C7A1` | 温柔杏色（用户气泡 / 主按钮） |
| `sage` | `#A8C5A0` | 鼠尾草绿（链接 / 次要） |
| `amber` | `#FFB347` | 琥珀光点缀 |
| 字体 | Nunito + Caveat | 圆体 UI + 手写标题 |
| 圆角 | 16px / 24px / 32px | 大圆角手作感 |
| 阴影 | `0 4px 20px rgba(0,0,0,0.03)` | 柔和阴影 |
| 动效 | `cubic-bezier(0.4,0,0.2,1)` 0.3s | 柔和过渡 |

所有交互遵循 `prefers-reduced-motion`，支持键盘焦点与无障碍。

## 🛠 技术栈

- React 18 + TypeScript
- Vite 5 构建
- Tailwind CSS 3（无外部 UI 库，纯手写样式保持手作感）
- react-router-dom 6 路由
- React Context 全局状态

## 🚀 运行方式

```bash
# 1. 进入项目目录
cd echo

# 2. 安装依赖（首次）
npm install

# 3. 启动开发服务器
npm run dev
# 默认 http://localhost:5173，会自动打开浏览器

# 4. 生产构建
npm run build

# 5. 预览构建产物
npm run preview
```

## 🔌 后端对接

前端已封装统一 API 服务（`src/services/api.ts`），通过环境变量 `VITE_USE_MOCK` 切换：

- **`VITE_USE_MOCK=true`**（默认，当前状态）：走前端 mock 数据，日记与任务计数用 localStorage 持久化，完整流程可体验。
- **`VITE_USE_MOCK=false`**：走真实后端，请求 `VITE_API_BASE_URL`。

后端就绪后，只需在 `.env.local` 改为 `VITE_USE_MOCK=false` 并设置正确的 `VITE_API_BASE_URL` 即可，**无需改任何前端代码**。

### 需要后端实现的端点

| 方法 | 路径 | 请求体 | 响应 |
| --- | --- | --- | --- |
| POST | `/chat` | `{ message, sessionId? }` | `{ reply, mirror:{signals,strategy,blindspots,limitation}, sessionId }` |
| POST | `/lab` | `{ message, originalReply? }` | `{ versions:[{style,description,text}] }` |
| GET | `/insights` | — | `{ mainTheme, peakHours, dependencySign, reflection, completedQuests, journalCount, blindspotCount }` |
| GET | `/journal` | — | `[{ id, date, emotion, preview }]` |
| POST | `/journal` | `{ content, emotion }` | `{ id, date, emotion, preview, content }` |
| DELETE | `/journal/:id` | — | `{ success }` |
| POST | `/quest/complete` | `{ questId }` | `{ success }` |

> 详见 `后端需求清单.md`。

## 📁 项目结构

```
echo/
├── index.html
├── src/
│   ├── main.tsx               # 入口
│   ├── App.tsx                # 路由
│   ├── index.css              # 全局样式 + Tailwind + 手作工具类
│   ├── components/
│   │   ├── common/            # WarmButton / HandDrawnIcon / PageTransition
│   │   └── layout/            # Layout / Navbar
│   ├── features/chat/         # ChatBubble / MirrorPanel / LabVersions / BreathingOverlay
│   ├── pages/                 # Welcome / Chat / Journal / Insights / Corner
│   ├── services/api.ts        # 统一 API + mock 开关
│   ├── context/AppContext.tsx # 全局状态
│   ├── types/index.ts         # 类型定义
│   └── utils/time.ts          # 时间工具
└── 配置文件（vite / tailwind / tsconfig）
```

## ♿ 无障碍

- WCAG AA 色彩对比（深棕文字 on 奶油背景）
- 键盘可达，可见焦点环
- 语义化按钮 + aria-label
- 尊重 `prefers-reduced-motion`
- 触摸目标 ≥ 40px

---

一盏小灯，慢慢亮着。
