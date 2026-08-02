/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Echo v2.0 设计规范 — 暖调纸质柔光风格
      colors: {
        cream: {
          DEFAULT: '#FFF9EF', // 主背景：暖米白（v2.0 更新）
          50: '#FFFEFA',
          100: '#FFF9EF',
          200: '#FDF0E0',
        },
        ink: {
          DEFAULT: '#4A3F35', // 主文字：深棕灰
          light: '#6B5D4F',
          soft: '#8B7D6B', // v2.0 微调
          hint: '#B5A899', // ✨ 新增提示文字色
        },
        apricot: {
          DEFAULT: '#F5E6D3', // 温柔杏色（v2.0 大幅变浅，用户气泡/卡片背景）
          light: '#FBEBD9',
          deep: '#E8D4B8',
        },
        sage: {
          DEFAULT: '#A8C5A0', // 鼠尾草绿（链接/次要）
          light: '#CFE0C9',
          deep: '#7FA176',
        },
        amber: {
          DEFAULT: '#F2B880', // 强调暖橙（v2.0 调整，偏暖）
          light: '#FFD4A3',
          glow: '#FFCBA6',
        },
        milkBrown: { // ✨ 新增奶棕色系（树干/Logo文字/装饰）
          DEFAULT: '#A67C52',
          light: '#C49A72',
          deep: '#7A5A38',
        },
        macaron: { // ✨ 新增马卡龙点缀色系（果实/图标）
          orange: '#FFB347',   // 暖橙
          pink: '#FFB6C1',     // 樱花粉
          purple: '#DDA0DD',   // 薰衣草紫
          yellow: '#F0E68C',   // 鹅黄
          green: '#98FB98',    // 薄荷绿
          blue: '#ADD8E6',     // 天蓝
        },
        paper: {
          DEFAULT: '#FFFBF5', // 卡片/气泡背景（v2.0 更新）
          edge: '#F0E6D2',
        },
      },
      fontFamily: {
        round: ['Nunito', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        hand: ['"Caveat"', 'Nunito', 'cursive'],
        serif: ['Georgia', 'Palatino', '"Times New Roman"', 'serif'], // ✨ Logo衬线体
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(166, 124, 82, 0.08)', // v2.0 统一奶棕色调
        'soft-hover': '0 6px 24px rgba(166, 124, 82, 0.12)', // ✨ 新增hover状态
        'soft-md': '0 6px 28px rgba(166, 124, 82, 0.10)',
        'soft-lg': '0 12px 40px rgba(166, 124, 82, 0.12)',
        glow: '0 0 24px rgba(242, 184, 128, 0.35)', // v2.0 使用新amber色
        'inner-soft': 'inset 0 1px 3px rgba(74, 63, 53, 0.04)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '300': '300ms',
        '500': '500ms',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(0.85)', opacity: '0.7' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
        },
        'breathe-478': {
          '0%': { transform: 'scale(0.8)' },
          '21%': { transform: 'scale(1.15)' },
          '57.9%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(0.8)' },
        },
        floatLamp: {
          '0%, 100%': { opacity: '0.85' },
          '50%': { opacity: '1' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.92' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(242,184,128,0.3)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 18px rgba(242,184,128,0)' },
        },
        // ✨ 新增：果实轻微摇摆动画
        fruitSway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        // ✨ 新增：光晕呼吸动画
        glowPulse: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        // ✨ 新增：底部弹窗滑入
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // ✨ 新增：蒲公英种子飞散（方向由 CSS 变量 --dx/--dy/--dr 控制）
        seedFly: {
          '0%': { opacity: '1', transform: 'translate(0, 0) rotate(0deg) scale(1)' },
          '60%': { opacity: '0.9' },
          '100%': {
            opacity: '0',
            transform: 'translate(var(--dx), var(--dy)) rotate(var(--dr)) scale(0.6)',
          },
        },
        // ✨ 新增：小纸条轻微摇摆（微光任务纸条）
        noteSway: {
          '0%, 100%': { transform: 'rotate(1.2deg)' },
          '50%': { transform: 'rotate(-1.2deg)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.4,0,0.2,1) both',
        'fade-in': 'fadeIn 0.4s ease both',
        breathe: 'breathe 5s ease-in-out infinite',
        'breathe-478': 'breathe-478 19s ease-in-out infinite',
        'float-lamp': 'floatLamp 4s ease-in-out infinite',
        flicker: 'flicker 3s ease-in-out infinite',
        'slide-in-up': 'slideInUp 0.4s cubic-bezier(0.4,0,0.2,1) both',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'fruit-sway': 'fruitSway 3s ease-in-out infinite', // ✨
        'glow-pulse': 'glowPulse 4s ease-in-out infinite', // ✨
        'slide-up': 'slideUp 0.35s cubic-bezier(0.4,0,0.2,1) both', // ✨ 底部弹窗
        'seed-fly': 'seedFly 1.15s cubic-bezier(0.25,0.6,0.35,1) forwards', // ✨ 蒲公英种子
        'note-sway': 'noteSway 5s ease-in-out infinite', // ✨ 纸条摇摆
      },
      backgroundImage: {
        'paper-lines':
          'repeating-linear-gradient(transparent, transparent 27px, rgba(74,63,53,0.07) 28px)',
        'warm-gradient': 'linear-gradient(135deg, #FFF9EF 0%, #F5E6D3 100%)', // v2.0 更新
        'afternoon': 'linear-gradient(160deg, #FFF9EF 0%, #FBEBD9 60%, #F5E6D3 100%)', // v2.0 更新
        'corner-gradient': 'linear-gradient(180deg, #FFF9EF 0%, #F5E6D3 100%)', // ✨ 我的角落页渐变
      },
    },
  },
  plugins: [],
}
