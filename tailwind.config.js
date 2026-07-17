/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // 暖奶油色背景、深棕文字、温柔杏色/鼠尾草绿、琥珀光点缀
      colors: {
        cream: {
          DEFAULT: '#FFF8F0', // 主背景：暖奶油
          50: '#FFFCF7',
          100: '#FFF8F0',
          200: '#FBEFE0',
        },
        ink: {
          DEFAULT: '#4A3F35', // 主文字：深棕
          light: '#6B5D4F',
          soft: '#8A7B6B',
        },
        apricot: {
          DEFAULT: '#F4C7A1', // 温柔杏色（用户气泡）
          light: '#FBDFC6',
          deep: '#E8A87C',
        },
        sage: {
          DEFAULT: '#A8C5A0', // 鼠尾草绿（链接/次要）
          light: '#CFE0C9',
          deep: '#7FA176',
        },
        amber: {
          DEFAULT: '#FFB347', // 琥珀光点缀
          light: '#FFD699',
          glow: '#FFC971',
        },
        paper: {
          DEFAULT: '#FBF4E6', // 微黄纸张
          edge: '#F0E6D2',
        },
      },
      fontFamily: {
        round: ['Nunito', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        hand: ['"Caveat"', 'Nunito', 'cursive'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.03)',
        'soft-md': '0 6px 28px rgba(74,63,53,0.06)',
        'soft-lg': '0 12px 40px rgba(74,63,53,0.08)',
        glow: '0 0 24px rgba(255,179,71,0.35)',
        'inner-soft': 'inset 0 1px 3px rgba(74,63,53,0.04)',
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
          // 4-7-8 呼吸节奏：吸气4s - 屏息7s - 呼气8s，共19s（此处用百分比近似）
          '0%': { transform: 'scale(0.8)' },
          '21%': { transform: 'scale(1.15)' }, // 4s 吸气
          '57.9%': { transform: 'scale(1.15)' }, // 7s 屏息
          '100%': { transform: 'scale(0.8)' }, // 8s 呼气
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
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255,179,71,0.3)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 18px rgba(255,179,71,0)' },
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
      },
      backgroundImage: {
        'paper-lines':
          'repeating-linear-gradient(transparent, transparent 27px, rgba(74,63,53,0.07) 28px)',
        'warm-gradient': 'linear-gradient(135deg, #FFF8F0 0%, #FBEFE0 100%)',
        'afternoon': 'linear-gradient(160deg, #FFF8F0 0%, #FBDFC6 60%, #F4C7A1 100%)',
      },
    },
  },
  plugins: [],
}
