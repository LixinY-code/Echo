/**
 * Echo i18n — 手写轻量中英文切换（零依赖）
 *
 * 设计：
 *  - LangProvider 提供 lang / setLang / t
 *  - localStorage('echo_lang') 持久化；初始跟随浏览器语言（zh* → 中文，其余英文）
 *  - t(key)：扁平点分 key；当前语言缺失 → 回落中文 → 再缺失返回 key 本身
 *  - 字典与代码同仓，文案即设计的一部分
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'zh' | 'en'

const STORAGE_KEY = 'echo_lang'

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch { /* ignore */ }
  try {
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
  } catch {
    return 'zh'
  }
}

/* ============================================================
 * 文案字典
 * ============================================================ */
const zh: Record<string, string> = {
  // ---- 导航 ----
  'nav.journal': '日记',
  'nav.insights': '周信',
  'nav.corner': '角落',
  'nav.garden': '花园',
  'nav.breathing': '呼吸',
  'nav.newChat': '新对话',

  // ---- 欢迎页 ----
  'welcome.greeting.morning': '早上好。新的一天，带着什么样的心情醒来的？',
  'welcome.greeting.afternoon': '下午的时光，是忙碌还是安静？想聊点什么吗？',
  'welcome.greeting.evening': '夜晚慢慢降临，今天的你辛苦了。有什么想放下的话吗？',
  'welcome.greeting.lateNight': '已经很晚了，世界安静下来。如果你需要陪伴，我在这里。',
  'welcome.subtitle1': '深夜里的一盏小台灯。',
  'welcome.subtitle2': '在这里，AI 会陪你说话，也会让你看见它如何说话。',
  'welcome.btn.chat': '开始对话',
  'welcome.btn.journal': '写写日记',
  'welcome.footer': '这里没有评判，只有一盏亮着的小灯。',

  // ---- 聊天页 ----
  'chat.title': 'Echo 深夜陪伴你',
  'chat.listening': '正在倾听你的声音',
  'chat.initial': '我在。今天，想聊点什么？',
  'chat.placeholder': '想说点什么……就敲在这里',
  'chat.lab': '看看 AI 还能怎么回',
  'chat.send': '发送',
  'chat.history': '对话历史',
  'chat.historyLoading': '正在找回上次的对话…',
  'chat.recap.prefix': '上次你在此处和我聊了{summary}，我的分析是{analysis}',
  'chat.recap.question': '这次想先从这个问题继续：{question}',

  // ---- 气泡 ----
  'bubble.error': '这盏灯好像闪了一下，没能回上来。',
  'bubble.retry': '再试一次',
  'bubble.why': '为什么这样回？',

  // ---- Mirror 面板 ----
  'mirror.signals': '我从你的话里听到的',
  'mirror.strategy': '我是怎么回你的',
  'mirror.blindspots': '我可能没看到的地方',
  'mirror.limitation': '我得老实说',
  'mirror.plant': '种下这个盲点',
  'mirror.planting': '种下中…',
  'mirror.planted': '已在花园里',
  'mirror.justPlanted': '已种下 🌱',
  'mirror.plantTitle': '把这个盲点种进花园，用后来的反思养大它',
  'mirror.plantHint': '它会在你再次查看、写日记、或试试换框模式时，慢慢发芽。',
  'mirror.goGarden': '去花园看看 →',
  'mirror.maturedHint': '你又一次看见它——花园里的「{name}」悄悄长大了。',

  // ---- Conversation Lab ----
  'lab.title': 'AI 还能这样回',
  'lab.loading': '正在准备不同的回应视角…',
  'lab.style.安慰模式': '安慰模式',
  'lab.style.挑战模式': '挑战模式',
  'lab.style.换框模式': '换框模式',

  // ---- 呼吸引导 ----
  'breath.text1': '不需要解决任何问题，',
  'breath.text2': '就和自己待一小会儿。',
  'breath.start': '试试约 40 秒呼吸引导',
  'breath.round': '第 {n} / {total} 轮 · 跟着圆圈呼吸',
  'breath.continue': '关闭引导',
  'breath.share': '转发截图',
  'breath.shareTitle': 'Echo · 呼吸引导',
  'breath.shareText': '在 Echo 跟着圆圈呼吸，很平静。',
  'breath.screenshot': '请截图分享给朋友～',
  'breath.phase.inhale': '慢慢吸气',
  'breath.phase.hold': '屏住一会儿',
  'breath.phase.exhale': '轻轻呼出',

  // ---- 侧边栏 ----
  'sidebar.title': '对话记录',
  'sidebar.new': '新建对话',
  'sidebar.collapse': '收起',
  'sidebar.expand': '展开对话历史',
  'sidebar.loading': '加载中…',
  'sidebar.empty1': '还没有对话记录',
  'sidebar.empty2': '点上方 ➕ 开始吧',
  'sidebar.delete': '删除此对话',
  'sidebar.defaultTitle': '新的对话',
  'sidebar.justNow': '刚刚',
  'sidebar.minAgo': '{n} 分钟前',
  'sidebar.hourAgo': '{n} 小时前',
  'sidebar.dayAgo': '{n} 天前',
  'sidebar.msgs': '{n} 条',

  // ---- 日记页 ----
  'journal.title': '情绪日记',
  'journal.subtitle': '只属于你的纸页，不会被 AI 阅读。',
  'journal.new': '写一页',
  'journal.editTitle': '今天的一页',
  'journal.moodPrompt': '此刻的心情是…',
  'journal.placeholder': '把心里的话慢慢写下来……这里只有你能看到。',
  'journal.cancel': '不写了',
  'journal.save': '收存这一页',
  'journal.saving': '收存中…',
  'journal.count': '共 {n} 页 · 安静地陪你',
  'journal.emptyTitle': '还没有写下任何一页',
  'journal.emptyDesc': '不必写得漂亮，哪怕只是一句"今天有点累"，也值得被记下来。',
  'journal.emptyBtn': '写下第一页',
  'journal.back': '返回',
  'journal.delete': '删除',

  // ---- 情绪标签 ----
  'emotion.焦虑': '焦虑',
  'emotion.低落': '低落',
  'emotion.平静': '平静',
  'emotion.感激': '感激',
  'emotion.迷茫': '迷茫',
  'emotion.希望': '希望',

  // ---- 周信（洞察） ----
  'insights.title': '写给你的一封信',
  'insights.dear': '亲爱的你，',
  'insights.rowTheme': '本周主要情绪主题',
  'insights.rowPeak': 'AI 使用高峰时段',
  'insights.rowDependency': '依赖迹象提示',
  'insights.hintPeak': '深夜使用更频繁，留意一下自己的作息',
  'insights.hintDependency': '这只是观察，不是诊断',
  'insights.reflection': '一句反思',
  'insights.signature': '—— Echo，在台灯下',
  'insights.reread': '重新读一遍',
  'insights.emptyTitle': '多和 AI 聊聊，\n一周后会有一封写给你的信。',
  'insights.emptyDesc': '这封信会安静地总结你这一周的情绪主题，没有评判。',
  'insights.emptyBtn': '再看看',

  // ---- 角落页 ----
  'corner.title': '我的角落 🏠',
  'corner.subtitle': '这里记着你一点一点长大的痕迹。',
  'corner.bloom': '悄悄开花了 🌱',
  'corner.bloomDesc': '每一件小事，都让你长大一点',
  'corner.cardQuest': '本周完成的任务',
  'corner.cardJournal': '记录的日记',
  'corner.cardBlind': '发现的盲点',
  'corner.unitQuest': '件',
  'corner.unitJournal': '页',
  'corner.unitBlind': '次',
  'corner.questBtn': '今天我做成了一件小事',
  'corner.puzzleTitle': '情绪拼图 🧩',
  'corner.puzzleEmpty': '完成微光任务，一块块点亮它',
  'corner.puzzleCollected': '已收集 {n} 个微光',
  'corner.puzzleNewPiece': '刚刚点亮了一块新碎片 ✨',
  'corner.puzzleNext': '再完成 {n} 个微光任务，解锁下一块',
  'corner.gardenLink': '去盲点花园走走',
  'corner.gardenDesc': 'AI 没看到的那些地方，在那里慢慢长大',
  'corner.footer': '这里没有评判，只有一盏亮着的小灯。',
  'corner.refresh': '刷新数据',
  'corner.back': '返回',
  'corner.modal.title': '🌸 记录今天的小事',
  'corner.modal.desc': '哪怕再小的事也值得被记住——喝够八杯水、按时吃了早饭、对陌生人说了谢谢……',
  'corner.modal.placeholder': '今天我做了一件……',
  'corner.modal.save': '记录下来 ✨',
  'corner.modal.saving': '保存中…',
  'corner.modal.successTitle': '记录成功！🎉',
  'corner.modal.successDesc': '这件小事已经变成你成长树上的一片新叶子',

  // ---- 盲点花园 ----
  'garden.title': '盲点花园 🌱',
  'garden.subtitle1': 'AI 坦白说「我可能没看到」的那些地方，',
  'garden.subtitle2': '你用后来的每一次回想，把它们养大。',
  'garden.cornerLink': '我的角落',
  'garden.loading': '花园里起雾了，稍等…',
  'garden.emptyTitle': '这里还空着。',
  'garden.emptyDesc1': '下次聊天时，点开「AI 为什么这样回」，',
  'garden.emptyDesc2': '在「我可能没看到的地方」把一句话种下来。',
  'garden.seed': '一颗种子',
  'garden.sprout': '悄悄发芽了',
  'garden.footerMature': '每一株有名字的植物，都是你跳出单一叙事的一次。',
  'garden.footerGrowing': '再次查看它、在日记里提起它、或试试换框模式——它都会悄悄长大。',
  'garden.fromPrefix': '种自：',

  // ---- 微光任务 ----
  'glimmer.title': '今日微光',
  'glimmer.subtitle': '做不做都没关系，它们 midnight 就会悄悄换掉',
  'glimmer.collapsed': '✨ 微光任务 ×{n}',
  'glimmer.collapsedDone': '🌙 微光已收好',
  'glimmer.didIt': '我做了',
  'glimmer.flying': '飞走啦…',
  'glimmer.saved': '🌱 已收进今天的日记',
  'glimmer.allDone1': '今天的微光都收好了。',
  'glimmer.allDone2': '明天见。',
  'glimmer.puzzleHint': '集满 7 个微光得一块 🧩',
  'glimmer.puzzlePieces': '🧩 {n} 块碎片',
  'glimmer.toast': '🧩 集满 7 个微光，\n一块情绪拼图碎片亮起来了',
  'glimmer.open': '打开今日微光任务',
  'glimmer.close': '收起',
  'glimmer.quest.curtain-green': '拉开窗帘，数一数窗外能看到的三种绿色',
  'glimmer.quest.first-water': '喝今天第一口水时，认真感受它的温度',
  'glimmer.quest.mirror-wink': '路过镜子时，对里面的自己眨一下眼',
  'glimmer.quest.mood-emoji': '给今天的自己挑一个心情表情，不用理由',
  'glimmer.quest.sky-photo': '拍下此刻天空的颜色，存进今天的日记',
  'glimmer.quest.old-song': '找一首很久没听的歌，只听 30 秒',
  'glimmer.quest.desk-angle': '把桌上的一样小东西，摆成你喜欢的角度',
  'glimmer.quest.secret-note': '给未来的自己写一句只有你能看懂的话',
  'glimmer.quest.plant-photo': '给一株植物（或一片叶子）拍张照',
  'glimmer.quest.type-delete': '在聊天框打一句真心话，然后一个字一个字删掉',
  'glimmer.quest.old-photo-smell': '找一张旧照片，试着回想那天空气的味道',
  'glimmer.quest.small-win': '写下今天一个「还不错」的瞬间，哪怕特别小',
  'glimmer.quest.thank-you': '对今天遇到的一个善意说声谢谢，在心里也行',
  'glimmer.quest.star-night': '抬头找一颗星星，跟它说声晚安',
  'glimmer.quest.night-sound': '闭上眼睛，听 30 秒夜晚的声音',
  'glimmer.quest.phone-down': '把手机屏幕朝下，慢慢深呼吸三次',
  'glimmer.quest.pillow-name': '给枕头取一个名字（今晚限定）',
  'glimmer.quest.tomorrow-hope': '想一件明天醒来值得期待的小事',
  'glimmer.quest.soft-hug': '抱一抱你身边最柔软的东西',
  'glimmer.quest.warm-water': '慢慢喝完一杯温水，顺便数一数咽了几次',
  'glimmer.quest.three-things': '说出三件你现在眼睛能看到的东西',
  'glimmer.quest.shoulder-drop': '把肩膀放松下来，保持五秒',

  // ---- 引导问卷 ----
  'onboarding.step0.title': '想让我怎么称呼你？',
  'onboarding.step0.desc': '随便一个你喜欢的名字就好，不用真名。当然，不想说也行。',
  'onboarding.step0.placeholder': '比如：小林',
  'onboarding.step1.title': '你觉得自己更接近哪一种？',
  'onboarding.step1.desc': '没有标准答案，只是帮我看你怎么陪你比较舒服。',
  'onboarding.pers.I.title': 'I 人 · 内向型',
  'onboarding.pers.I.desc': '喜欢安静，能量来自独处和深度思考',
  'onboarding.pers.E.title': 'E 人 · 外向型',
  'onboarding.pers.E.desc': '喜欢交流，能量来自人群和新鲜事',
  'onboarding.step2.title': '挑几个词形容自己吧',
  'onboarding.step2.desc': '选 0-5 个就好，帮我更懂你。也可以都跳过。',
  'onboarding.step2.selected': '已选 {n} / 5',
  'onboarding.skipAll': '全部跳过',
  'onboarding.back': '上一步',
  'onboarding.next': '继续',
  'onboarding.start': '好了，开始吧',
  'onboarding.startEmpty': '直接开始',
  'onboarding.privacy': '这些信息只有你能看到，用来让 Echo 更懂你。',
  // 关键词标签（值即 key，存储仍是中文）
  'onboarding.kw.安静': '安静',
  'onboarding.kw.好奇': '好奇',
  'onboarding.kw.容易焦虑': '容易焦虑',
  'onboarding.kw.乐观': '乐观',
  'onboarding.kw.敏感': '敏感',
  'onboarding.kw.理性': '理性',
  'onboarding.kw.夜猫子': '夜猫子',
  'onboarding.kw.完美主义': '完美主义',
  'onboarding.kw.慢热': '慢热',
  'onboarding.kw.重感情': '重感情',
  'onboarding.kw.独立': '独立',
  'onboarding.kw.容易想太多': '容易想太多',
  'onboarding.kw.温柔': '温柔',
  'onboarding.kw.固执': '固执',
  'onboarding.kw.乐于倾听': '乐于倾听',

  // ---- 语言切换器 ----
  'lang.switch': 'Switch to English',
}

const en: Record<string, string> = {
  // ---- 导航 ----
  'nav.journal': 'Journal',
  'nav.insights': 'Letter',
  'nav.corner': 'Corner',
  'nav.garden': 'Garden',
  'nav.breathing': 'Breathe',
  'nav.newChat': 'New chat',

  // ---- 欢迎页 ----
  'welcome.greeting.morning': 'Good morning. What kind of mood did you wake up with today?',
  'welcome.greeting.afternoon': 'Good afternoon. Busy or quiet — anything on your mind?',
  'welcome.greeting.evening': 'Evening is settling in. You worked hard today. Anything you want to put down?',
  'welcome.greeting.lateNight': "It's late. The world has gone quiet. If you need company, I'm here.",
  'welcome.subtitle1': 'A small lamp in the deep night.',
  'welcome.subtitle2': 'Here, the AI talks with you — and shows you how it talks.',
  'welcome.btn.chat': 'Start chatting',
  'welcome.btn.journal': 'Write journal',
  'welcome.footer': 'No judgment here — only a little lamp left on.',

  // ---- 聊天页 ----
  'chat.title': 'Echo keeps you company',
  'chat.listening': 'Listening to you',
  'chat.initial': "I'm here. What's on your mind today?",
  'chat.placeholder': 'Whatever you want to say… type it here',
  'chat.lab': 'See how else AI could reply',
  'chat.send': 'Send',
  'chat.history': 'Chat history',
  'chat.historyLoading': 'Bringing back your last conversation…',
  'chat.recap.prefix': 'Last time here, you talked with me about {summary}. My reflection is that {analysis}',
  'chat.recap.question': 'To continue this time, here is a new question: {question}',

  // ---- 气泡 ----
  'bubble.error': 'The lamp flickered — the reply got lost.',
  'bubble.retry': 'Try again',
  'bubble.why': 'Why this reply?',

  // ---- Mirror 面板 ----
  'mirror.signals': 'What I heard in your words',
  'mirror.strategy': 'How I replied to you',
  'mirror.blindspots': 'What I might have missed',
  'mirror.limitation': 'To be honest',
  'mirror.plant': 'Plant this blindspot',
  'mirror.planting': 'Planting…',
  'mirror.planted': 'In the garden',
  'mirror.justPlanted': 'Planted 🌱',
  'mirror.plantTitle': 'Plant this blindspot in the garden and grow it with later reflection',
  'mirror.plantHint': 'It will sprout when you view it again, write about it in your journal, or try the reframe mode.',
  'mirror.goGarden': 'Visit the garden →',
  'mirror.maturedHint': 'You saw it again — "{name}" just grew a little in the garden.',

  // ---- Conversation Lab ----
  'lab.title': 'AI could also reply like this',
  'lab.loading': 'Preparing different perspectives…',
  'lab.style.安慰模式': 'Comfort',
  'lab.style.挑战模式': 'Challenge',
  'lab.style.换框模式': 'Reframe',

  // ---- 呼吸引导 ----
  'breath.text1': "You don't have to solve anything —",
  'breath.text2': 'just stay with yourself for a moment.',
  'breath.start': 'Try the 40-second breathing guide',
  'breath.round': 'Round {n} of {total} · breathe with the circle',
  'breath.continue': 'Close guide',
  'breath.share': 'Share a screenshot',
  'breath.shareTitle': 'Echo · Breathing guide',
  'breath.shareText': 'Breathing with the circle in Echo. So calm.',
  'breath.screenshot': 'Take a screenshot and share it with a friend~',
  'breath.phase.inhale': 'Breathe in slowly',
  'breath.phase.hold': 'Hold for a moment',
  'breath.phase.exhale': 'Gently breathe out',

  // ---- 侧边栏 ----
  'sidebar.title': 'Conversations',
  'sidebar.new': 'New conversation',
  'sidebar.collapse': 'Collapse',
  'sidebar.expand': 'Expand chat history',
  'sidebar.loading': 'Loading…',
  'sidebar.empty1': 'No conversations yet',
  'sidebar.empty2': 'Tap ➕ above to start',
  'sidebar.delete': 'Delete this conversation',
  'sidebar.defaultTitle': 'New conversation',
  'sidebar.justNow': 'just now',
  'sidebar.minAgo': '{n}m ago',
  'sidebar.hourAgo': '{n}h ago',
  'sidebar.dayAgo': '{n}d ago',
  'sidebar.msgs': '{n} msgs',

  // ---- 日记页 ----
  'journal.title': 'Mood Journal',
  'journal.subtitle': 'Pages only you can read. The AI never sees them.',
  'journal.new': 'New page',
  'journal.editTitle': "Today's page",
  'journal.moodPrompt': 'How are you feeling right now…',
  'journal.placeholder': 'Write down what\'s on your mind, slowly… only you can see this.',
  'journal.cancel': 'Not now',
  'journal.save': 'Keep this page',
  'journal.saving': 'Keeping…',
  'journal.count': '{n} pages · quietly with you',
  'journal.emptyTitle': 'No pages written yet',
  'journal.emptyDesc': 'It doesn\'t have to be pretty. Even "I\'m a bit tired today" deserves to be kept.',
  'journal.emptyBtn': 'Write the first page',
  'journal.back': 'Back',
  'journal.delete': 'Delete',

  // ---- 情绪标签 ----
  'emotion.焦虑': 'Anxious',
  'emotion.低落': 'Down',
  'emotion.平静': 'Calm',
  'emotion.感激': 'Grateful',
  'emotion.迷茫': 'Lost',
  'emotion.希望': 'Hopeful',

  // ---- 周信（洞察） ----
  'insights.title': 'A letter for you',
  'insights.dear': 'Dear you,',
  'insights.rowTheme': "This week's main emotional theme",
  'insights.rowPeak': 'Peak AI usage hours',
  'insights.rowDependency': 'Dependency signals',
  'insights.hintPeak': 'Late-night use is more frequent — mind your sleep schedule',
  'insights.hintDependency': 'This is an observation, not a diagnosis',
  'insights.reflection': 'A reflection',
  'insights.signature': '—— Echo, by the lamp',
  'insights.reread': 'Read it again',
  'insights.emptyTitle': 'Chat with the AI more —\na letter for you will arrive in a week.',
  'insights.emptyDesc': "It will quietly summarize your week's emotional themes, without judgment.",
  'insights.emptyBtn': 'Check again',

  // ---- 角落页 ----
  'corner.title': 'My Corner 🏠',
  'corner.subtitle': 'This is where your little steps of growing up are kept.',
  'corner.bloom': 'Quietly blooming 🌱',
  'corner.bloomDesc': 'Every small thing makes you grow a little',
  'corner.cardQuest': 'Quests done this week',
  'corner.cardJournal': 'Journal pages',
  'corner.cardBlind': 'Blindspots found',
  'corner.unitQuest': 'done',
  'corner.unitJournal': 'pages',
  'corner.unitBlind': 'times',
  'corner.questBtn': 'I did one small thing today',
  'corner.puzzleTitle': 'Emotion Puzzle 🧩',
  'corner.puzzleEmpty': 'Finish glimmer quests to light it up, piece by piece',
  'corner.puzzleCollected': '{n} glimmers collected',
  'corner.puzzleNewPiece': 'A new piece just lit up ✨',
  'corner.puzzleNext': '{n} more glimmer quests to unlock the next piece',
  'corner.gardenLink': 'Wander into the Blindspot Garden',
  'corner.gardenDesc': 'The places the AI missed are quietly growing there',
  'corner.footer': 'No judgment here — only a little lamp left on.',
  'corner.refresh': 'Refresh data',
  'corner.back': 'Back',
  'corner.modal.title': '🌸 Record a small thing today',
  'corner.modal.desc': 'Even the tiniest thing deserves remembering — eight glasses of water, breakfast on time, a thank-you to a stranger…',
  'corner.modal.placeholder': 'Today I did…',
  'corner.modal.save': 'Keep it ✨',
  'corner.modal.saving': 'Saving…',
  'corner.modal.successTitle': 'Recorded! 🎉',
  'corner.modal.successDesc': 'This small thing just became a new leaf on your growing tree',

  // ---- 盲点花园 ----
  'garden.title': 'Blindspot Garden 🌱',
  'garden.subtitle1': 'The places the AI honestly says "I might have missed" —',
  'garden.subtitle2': 'you grow them with every later look-back.',
  'garden.cornerLink': 'My Corner',
  'garden.loading': 'The garden is misty, one moment…',
  'garden.emptyTitle': "It's still empty here.",
  'garden.emptyDesc1': 'Next time you chat, open "Why this reply?",',
  'garden.emptyDesc2': 'and plant a sentence from "What I might have missed".',
  'garden.seed': 'A seed',
  'garden.sprout': 'Quietly sprouting',
  'garden.footerMature': 'Every named plant is a step you took beyond a single narrative.',
  'garden.footerGrowing': 'View it again, write about it, or try the reframe mode — it will quietly grow.',
  'garden.fromPrefix': 'Planted from:',

  // ---- 微光任务 ----
  'glimmer.title': "Today's Glimmers",
  'glimmer.subtitle': "It's okay not to do them — they quietly change at midnight",
  'glimmer.collapsed': '✨ Glimmer quests ×{n}',
  'glimmer.collapsedDone': '🌙 Glimmers kept',
  'glimmer.didIt': 'I did it',
  'glimmer.flying': 'Flying away…',
  'glimmer.saved': "🌱 Kept in today's journal",
  'glimmer.allDone1': "All of today's glimmers are kept.",
  'glimmer.allDone2': 'See you tomorrow.',
  'glimmer.puzzleHint': 'Collect 7 glimmers for a 🧩 piece',
  'glimmer.puzzlePieces': '🧩 {n} pieces',
  'glimmer.toast': '🧩 Seven glimmers collected —\nan emotion puzzle piece just lit up',
  'glimmer.open': "Open today's glimmer quests",
  'glimmer.close': 'Collapse',
  'glimmer.quest.curtain-green': 'Open the curtains and count three shades of green outside.',
  'glimmer.quest.first-water': 'Notice the temperature of your first sip of water today.',
  'glimmer.quest.mirror-wink': 'Wink at yourself the next time you pass a mirror.',
  'glimmer.quest.mood-emoji': 'Choose one emoji for today’s mood. No reason needed.',
  'glimmer.quest.sky-photo': 'Photograph the color of the sky and keep it in today’s journal.',
  'glimmer.quest.old-song': 'Find a song you have not heard in a long time and listen for 30 seconds.',
  'glimmer.quest.desk-angle': 'Turn one small thing on your desk to an angle you like.',
  'glimmer.quest.secret-note': 'Write one sentence to your future self that only you understand.',
  'glimmer.quest.plant-photo': 'Take a photo of a plant, or simply one leaf.',
  'glimmer.quest.type-delete': 'Type one honest sentence in the chat box, then delete it letter by letter.',
  'glimmer.quest.old-photo-smell': 'Find an old photo and try to remember how the air smelled that day.',
  'glimmer.quest.small-win': 'Write down one moment from today that felt “not bad,” however small.',
  'glimmer.quest.thank-you': 'Thank one kindness you met today, even if only in your mind.',
  'glimmer.quest.star-night': 'Look up for one star and quietly wish it good night.',
  'glimmer.quest.night-sound': 'Close your eyes and listen to the night for 30 seconds.',
  'glimmer.quest.phone-down': 'Place your phone face down and take three slow breaths.',
  'glimmer.quest.pillow-name': 'Give your pillow a name, just for tonight.',
  'glimmer.quest.tomorrow-hope': 'Think of one small thing worth waking up for tomorrow.',
  'glimmer.quest.soft-hug': 'Hug the softest thing near you.',
  'glimmer.quest.warm-water': 'Slowly finish a cup of warm water and count each swallow.',
  'glimmer.quest.three-things': 'Name three things you can see right now.',
  'glimmer.quest.shoulder-drop': 'Let your shoulders drop and stay there for five seconds.',

  // ---- 引导问卷 ----
  'onboarding.step0.title': 'What should I call you?',
  'onboarding.step0.desc': "Any name you like — it doesn't have to be real. It's fine to skip, too.",
  'onboarding.step0.placeholder': 'e.g. Alex',
  'onboarding.step1.title': 'Which one feels closer to you?',
  'onboarding.step1.desc': "There's no right answer — it just helps me keep you company in a way that fits.",
  'onboarding.pers.I.title': 'Type I · Introverted',
  'onboarding.pers.E.title': 'Type E · Extroverted',
  'onboarding.pers.I.desc': 'Quiet spaces; energy from solitude and deep thought',
  'onboarding.pers.E.desc': 'Lively spaces; energy from people and new things',
  'onboarding.step2.title': 'Pick a few words for yourself',
  'onboarding.step2.desc': 'Choose 0-5 to help me understand you. Skipping is fine too.',
  'onboarding.step2.selected': '{n} / 5 selected',
  'onboarding.skipAll': 'Skip all',
  'onboarding.back': 'Back',
  'onboarding.next': 'Next',
  'onboarding.start': "Okay, let's begin",
  'onboarding.startEmpty': 'Start right away',
  'onboarding.privacy': 'Only you can see this. It helps Echo understand you better.',
  // 关键词标签（存储仍是中文值，这里只做显示翻译）
  'onboarding.kw.安静': 'Quiet',
  'onboarding.kw.好奇': 'Curious',
  'onboarding.kw.容易焦虑': 'Anxious-prone',
  'onboarding.kw.乐观': 'Optimistic',
  'onboarding.kw.敏感': 'Sensitive',
  'onboarding.kw.理性': 'Rational',
  'onboarding.kw.夜猫子': 'Night owl',
  'onboarding.kw.完美主义': 'Perfectionist',
  'onboarding.kw.慢热': 'Slow to warm up',
  'onboarding.kw.重感情': 'Sentimental',
  'onboarding.kw.独立': 'Independent',
  'onboarding.kw.容易想太多': 'Overthinker',
  'onboarding.kw.温柔': 'Gentle',
  'onboarding.kw.固执': 'Stubborn',
  'onboarding.kw.乐于倾听': 'Good listener',

  // ---- 语言切换器 ----
  'lang.switch': '切换到中文',
}

const DICTS: Record<Lang, Record<string, string>> = { zh, en }

/* ============================================================
 * Context
 * ============================================================ */
interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  /** 翻译；支持 {name} 占位插值：t('key', { n: 3 }) */
  t: (key: string, params?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* ignore */ }
    try { document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en' } catch { /* ignore */ }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let text = DICTS[lang][key] ?? DICTS.zh[key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.split(`{${k}}`).join(String(v))
        }
      }
      return text
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}

/** 按当前语言取日期 locale */
export function localeOf(lang: Lang): string {
  return lang === 'zh' ? 'zh-CN' : 'en-US'
}
