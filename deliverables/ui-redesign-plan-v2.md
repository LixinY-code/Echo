# Echo 深夜陪伴 AI — UI 改版执行方案

> **版本**: v2.0 Design System Update
> **日期**: 2026-07-31
> **设计师**: UI Designer (像素君)
> **状态**: 待执行

---

## 📋 设计规范变更摘要

### 1. 色彩系统更新

| Token | 现有值 | **新规范值** | 变更类型 |
|-------|--------|-------------|---------|
| `cream` (主背景) | `#FFF8F0` | **`#FFF9EF`** | 微调 |
| `apricot` (用户气泡) | `#F4C7A1` | **`#F5E6D3`** | ⚠️ 大幅调整（变浅） |
| `amber` (强调色) | `#FFB347` | **`#F2B880`** | 调整（偏暖） |
| `milk-brown` (奶棕) | — | **`#A67C52`** | ✨ 新增 |
| `hint-text` (提示文字) | — | **`#B5A899`** | ✨ 新增 |
| 卡片/气泡背景 | `#FFFCF7` | **`#FFFBF5`** | 微调 |
| 马卡龙点缀色系 | 无 | **6 色** | ✨ 新增 |

#### 马卡龙色系定义（新增）
```javascript
macaron: {
  orange: '#FFB347',   // 暖橙
  pink: '#FFB6C1',     // 樱花粉
  purple: '#DDA0DD',   // 薰衣草紫
  yellow: '#F0E68C',   // 鹅黄
  green: '#98FB98',    // 薄荷绿
  blue: '#ADD8E6',     // 天蓝
}
```

### 2. 圆角系统（保持不变）
- 按钮/卡片: `16-20px` (`rounded-2xl` / `rounded-3xl`)
- 消息气泡/输入框: `24-28px` (`rounded-3xl` / `rounded-[28px]`)
- 全页面无锐角 ✅

### 3. 阴影系统统一
```css
/* 新规范：极淡弥散软阴影 */
box-shadow: 0 4px 20px rgba(166, 124, 82, 0.08);
```
现有阴影已接近，需微调透明度为 `0.08`。

### 4. 交互规范
- 可点击元素 hover 上移 `2px`: `transform: translateY(-2px)`
- 阴影轻微加深: `box-shadow: 0 6px 24px rgba(166, 124, 82, 0.12)`

---

## 🎯 改版优先级与文件清单

### P0 — 设计 Token 基础层（必须先完成）

#### 1.1 `tailwind.config.js` 更新

**修改内容**：
```javascript
colors: {
  cream: {
    DEFAULT: '#FFF9EF',  // ← 从 #FFF8F0 改为 #FFF9EF
    50: '#FFFEFA',
    100: '#FFF9EF',
    200: '#FDF0E0',
  },
  ink: {
    DEFAULT: '#4A3F35',
    light: '#6B5D4F',
    soft: '#8B7D6B',      // ← 从 #8A7B6B 微调
    hint: '#B5A899',      // ✨ 新增提示文字色
  },
  apricot: {
    DEFAULT: '#F5E6D3',   // ← 从 #F4C7A1 大幅调整（变浅）
    light: '#FBEBD9',
    deep: '#E8D4B8',
  },
  amber: {
    DEFAULT: '#F2B880',   // ← 从 #FFB347 调整
    light: '#FFD4A3',
    glow: '#FFCBA6',
  },
  milkBrown: {             // ✨ 新增奶棕色
    DEFAULT: '#A67C52',
    light: '#C49A72',
    deep: '#7A5A38',
  },
  macaron: {               // ✨ 新增马卡龙色系
    orange: '#FFB347',
    pink: '#FFB6C1',
    purple: '#DDA0DD',
    yellow: '#F0E68C',
    green: '#98FB98',
    blue: '#ADD8E6',
  },
  // ... 其他保持不变
}

// 阴影统一更新
boxShadow: {
  soft: '0 4px 20px rgba(166, 124, 82, 0.08)',        // ← 统一使用新规范
  'soft-hover': '0 6px 24px rgba(166, 124, 82, 0.12)', // ✨ 新增 hover 状态
  soft-md: '0 6px 28px rgba(166, 124, 82, 0.10)',
  soft-lg: '0 12px 40px rgba(166, 124, 82, 0.12)',
  glow: '0 0 24px rgba(242, 184, 128, 0.35)',
}
```

#### 1.2 `src/index.css` 更新

**新增全局样式**：
```css
@layer base {
  :root {
    /* 更新背景色 */
    body {
      background-color: #FFF9EF;  /* ← 从 #fff8f0 更新 */
    }
    
    /* 新增 hover 交互 */
    .interactive-hover {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .interactive-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(166, 124, 82, 0.12);
    }
  }
}

/* 新增马卡龙果实颜色工具类 */
@layer utilities {
  .text-macaron-orange { color: #FFB347; }
  .text-macaron-pink { color: #FFB6C1; }
  .text-macaron-purple { color: #DDA0DD; }
  .text-macaron-yellow { color: #F0E68C; }
  .text-macaron-green { color: #98FB98; }
  .text-macaron-blue { color: #ADD8E6; }
  
  .bg-macaron-orange { background-color: #FFB347; }
  .bg-macaron-pink { background-color: #FFB6C1; }
  .bg-macaron-purple { background-color: #DDA0DD; }
  .bg-macaron-yellow { background-color: #F0E68C; }
  .bg-macaron-green { background-color: #98FB98; }
  .bg-macaron-blue { background-color: #ADD8E6; }
}
```

#### 1.3 新增 `EchoLogo.tsx` 组件

**路径**: `src/components/common/EchoLogo.tsx`

**设计规格**：
- 简约线条风果树（SVG 手绘风格）
- 棕色树干分枝（`#A67C52`）
- 12-15 颗圆形马卡龙色果实（随机分布）
- 部分带极小绿叶
- 下方配衬线体 "Echo" 文字（深奶棕 `#A67C52`）
- 支持两种尺寸：`size="lg"` (导航栏) / `size="sm"` (空状态/加载)

**Props 接口**：
```typescript
interface EchoLogoProps {
  size?: 'sm' | 'lg'      // 默认 lg
  showText?: boolean       // 是否显示 "Echo" 文字，默认 true
  className?: string       // 自定义样式
}
```

---

### P1 — 核心页面重构（视觉重点）

#### 2.1 `ChatPage.tsx` 聊天主界面重构

**布局调整**：
```
┌─────────────────────────────────────────────────────┐
│  Navbar (sticky top)                                │
│  [Echo Logo]          [日记] [周信] [角落] [+新对话] │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  主聊天区                                  │
│ (20%)    │  ┌─────────────────────────────────────┐ │
│          │  │ Echo 深夜陪伴你                      │ │
│ 对话记录  │  ├─────────────────────────────────────┤ │
│ + 新建    │  │                                     │ │
│          │  │  [🔵 AI: 白色圆角气泡]               │ │
│ 会话列表  │  │                                     │ │
│ - 标题    │  │         [🟤 用户: 暖杏色气泡]       │ │
│ - 时间    │  │                                     │ │
│          │  ├─────────────────────────────────────┤ │
│          │  │ [✨ 看看AI还能怎么回]                  │ │
│          │  │ [━━━━ 输入框 ━━━━ 🔺]              │ │
│          │  └─────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────┘
```

**具体修改点**：

1. **左侧边栏宽度固定 20%**（`w-1/5` 或 `w-[20%]`）
2. **右侧聊天区占 80%**（`flex-1` 或 `w-[80%]`）
3. **顶部标题改为 "Echo 深夜陪伴你"**
4. **输入区重新设计**：
   - "看看AI还能怎么回" 按钮改为浅米色小按钮（居中）
   - 输入框改为长条大圆角（`rounded-full` 或 `rounded-[28px]`）
   - 占位符："想说点什么……就敲在这里"
   - 发送按钮改为圆形浅杏色 + 纸飞机图标

#### 2.2 `Sidebar.tsx` 侧边栏优化

**样式更新**：
- 背景色：浅杏色 `bg-apricot/30` 或 `bg-[#F5E6D3]/40`
- 选中项：圆角卡片背景 `rounded-xl bg-white shadow-soft`
- 未选中项：透明背景，hover 时显示浅色底
- 时间文字：`text-hint`（`#B5A899`）

**结构保持**：
- 顶部 "对话记录" 标题 + 新建/排序图标
- 会话列表（标题 + 时间）
- 底部 Echo 品牌标识（小尺寸 Logo）

#### 2.3 `Navbar.tsx` 导航栏重构

**布局调整**：
```
┌────────────────────────────────────────────────────┐
│  [🌳 Echo Logo]              [📔] [✉️] [🏠]  [＋新对话] │
└────────────────────────────────────────────────────┘
```

**修改点**：
1. 左侧替换为 **EchoLogo 组件**（果树 Logo + "Echo" 文字）
2. 右侧图标改为：日记 / 周信（洞察）/ 我的角落
3. 新增 "+ 新对话" 圆角按钮（暖橙色 `bg-amber`）

#### 2.4 `CornerPage.tsx` 我的角落页重构

**新布局**（上下流式居中）：

```
┌─────────────────────────────────────────────────────┐
│  [< 返回]                                          │
│                                                     │
│        🌳 [大幅水彩情绪果树]        我的角落 🌱       │
│           这里记着你一点一点长大的痕迹。                │
│                                                     │
│            悄悄开花了                                 │
│         这些小小的坚持，会变成光                       │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  🌸  6  │  │  🌿  1  │  │  👁 19  │            │
│  │ 本周任务 │  │ 日记数  │  │ 盲点数  │            │
│  └─────────┘  └─────────┘  └─────────┘            │
│                                                     │
│      [＋ 今天我做成了一件小事]                        │
│                                                     │
│    这里没有评判，只有一盏亮着的小灯。                   │
└─────────────────────────────────────────────────────┘
```

**关键修改**：

1. **背景改为暖杏色柔和渐变**：
   ```css
   background: linear-gradient(180deg, #FFF9EF 0%, #F5E6D3 100%);
   ```

2. **主视觉：水彩情绪果树**
   - 替换现有 SVG Garden 组件
   - 使用更丰富的插画风格（参考提供的图片 #3）
   - 果实带笑脸表情（可爱治愈风）
   - 背景添加暖黄光晕效果

3. **数据卡片样式更新**：
   - 白色圆角卡片（`bg-white rounded-2xl shadow-soft`）
   - 图标改为：红花 / 嫩枝 / 小树+眼睛
   - 数字大字号加粗（`text-3xl font-extrabold`）
   - 单位文字小号灰色

4. **操作按钮**：
   - 居中暖橙色大圆角按钮
   - 文字："+ 今天我做成了一件小事"
   - hover 效果：上移 2px + 阴影加深

5. **底部收尾文案**：
   - "这里没有评判，只有一盏亮着的小灯。"
   - 浅灰小字（`text-hint text-sm`）

#### 2.5 `ChatBubble.tsx` 消息气泡样式调整

**AI 消息（左对齐）**：
- 头像：圆形浅橙（`bg-amber/60 rounded-full`）
- 气泡：白色圆角（`bg-white rounded-3xl`）
- 边框：极淡暖橙边框（`border border-amber/20`）

**用户消息（右对齐）**：
- 气泡：暖杏色（`bg-apricot rounded-3xl`）
- 无边框，纯色填充
- 文字颜色：深棕（`text-ink`）

---

### P2 — 细节打磨（增强体验）

#### 3.1 `WarmButton.tsx` 按钮组件增强

**新增 hover 交互**：
```typescript
className={cn(
  'interactive-hover',  // ✨ 新增通用 hover 类
  // ... 其他样式
)}
```

#### 3.2 `HandDrawnIcon.tsx` 图标库扩展

**新增图标**（用于我的角落页面）：
- `flower-red` — 红花（任务卡片）
- `sprout-green` — 嫩枝（日记卡片）
- `tree-eye` — 小树+眼睛（盲点卡片）

#### 3.3 `WelcomePage.tsx` 欢迎页适配

- 导航栏使用新的 EchoLogo
- 背景色同步更新为 `#FFF9EF`
- 台灯元素可保留（符合温暖氛围）

#### 3.4 `JournalPage.tsx` & `InsightsPage.tsx`

- 统一应用新的色彩 token
- 卡片圆角、阴影、hover 效果统一
- 返回按钮样式统一

---

## 🎨 品牌Logo 详细规格

### Echo 情绪果实树 Logo

**用途场景**：
1. 导航栏品牌标识（`size="lg"`）
2. 空状态插图（`size="lg"`）
3. 加载页动画（`size="sm"` + 旋转/呼吸动画）
4. 我的角落页主视觉（放大版 + 水彩效果）

**视觉规格**：

| 属性 | 规格 |
|------|------|
| 风格 | 简约线条风 |
| 树干颜色 | `#A67C52`（奶棕） |
| 树枝数量 | 5-7 个分枝 |
| 果实数量 | 12-15 颗 |
| 果实颜色 | 马卡龙色系（随机分布） |
| 果实大小 | 8-12px 直径 |
| 绿叶 | 部分果实带极小绿叶 |
| 文字 | "Echo" 衬线体（Georgia/Palatino） |
| 文字颜色 | `#A67C52`（深奶棕） |
| 文字大小 | lg: 24px / sm: 18px |

**SVG 结构示意**：
```svg
<svg viewBox="0 0 200 160">
  <!-- 树干 -->
  <path d="M100 140 L100 80" stroke="#A67C52" stroke-width="4" stroke-linecap="round"/>
  <!-- 分枝 -->
  <path d="M100 110 Q85 95 70 90" stroke="#A67C52" stroke-width="2.5" fill="none"/>
  <path d="M100 100 Q115 85 130 80" stroke="#A67C52" stroke-width="2.5" fill="none"/>
  <!-- 更多分枝... -->
  
  <!-- 马卡龙果实 -->
  <circle cx="65" cy="85" r="9" fill="#FFB6C1"/>  <!-- 粉 -->
  <circle cx="135" cy="75" r="10" fill="#DDA0DD"/> <!-- 紫 -->
  <circle cx="75" cy="65" r="8" fill="#ADD8E6"/>  <!-- 蓝 -->
  <circle cx="125" cy="60" r="9" fill="#F0E68C"/>  <!-- 黄 -->
  <circle cx="95" cy="55" r="8" fill="#98FB98"/>  <!-- 绿 -->
  <circle cx="55" cy="70" r="7" fill="#FFB347"/>  <!-- 橙 -->
  <!-- 更多果实... -->
  
  <!-- Echo 文字 -->
  <text x="100" y="155" text-anchor="middle" 
        font-family="Georgia, serif" font-size="24" 
        fill="#A67C52" font-style="italic">Echo</text>
</svg>
```

---

## ✅ 执行检查清单

### Phase 1: 基础层（P0）
- [ ] 更新 `tailwind.config.js` 色彩 token
- [ ] 更新 `src/index.css` 全局样式
- [ ] 创建 `EchoLogo.tsx` 组件
- [ ] 验证构建通过（`tsc` + `vite build`）

### Phase 2: 核心页面（P1）
- [ ] 重构 `ChatPage.tsx` 布局和样式
- [ ] 优化 `Sidebar.tsx` 视觉
- [ ] 重构 `Navbar.tsx`（集成 EchoLogo）
- [ ] 重构 `CornerPage.tsx`（水彩果树 + 数据卡片）
- [ ] 调整 `ChatBubble.tsx` 样式

### Phase 3: 细节打磨（P2）
- [ ] 增强 `WarmButton.tsx` hover 交互
- [ ] 扩展 `HandDrawnIcon.tsx` 图标
- [ ] 适配 `WelcomePage.tsx`
- [ ] 统一 `JournalPage.tsx` / `InsightsPage.tsx`

### Phase 4: 验证与交付
- [ ] 全页面视觉走查
- [ ] 响应式测试（移动端/平板/桌面）
- [ ] 无障碍检查（对比度、焦点管理）
- [ ] 性能验证（Lighthouse > 90）
- [ ] 截图对比（新旧版本）

---

## 📐 设计原则提醒

在执行改版时，请始终遵循以下原则：

1. **温暖治愈感优先** — 所有视觉元素都应传达安全、被接纳的感觉
2. **无尖锐棱角** — 圆角是硬性要求，禁止出现直角/锐角
3. **纸质柔光质感** — 背景和卡片都要有纸张的温润感
4. **色彩克制使用** — 主色调不超过 3 种，点缀色用于重点引导
5. **交互反馈温和** — hover/active 状态变化要轻柔，避免突兀
6. **手作感一致性** — 保持现有的手绘/手写风格元素

---

## 🔄 向后兼容性说明

本次改版 **仅涉及视觉层**，不影响：
- ✅ 功能逻辑（聊天/会话/日记等）
- ✅ API 接口（后端完全兼容）
- ✅ 数据结构（types/index.ts 无需改动）
- ✅ 状态管理（AppContext 无需改动）

**风险点**：
- ⚠️ 色值变更可能影响已有自定义样式（需全面回归测试）
- ⚠️ CornerPage 的水彩果树需要新的 SVG 资源（或用 CSS 渐变模拟）

---

**文档结束**

下一步：确认方案后，我将开始按优先级逐项实施 UI 改版。
