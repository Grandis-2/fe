import { createGlobalTheme, globalStyle } from '@vanilla-extract/css'

export const color = createGlobalTheme(':root', {
  primary: {
    base: '#3F4891',
    focus: '#282F64',
    subtle: '#9099D1',
    subtler: '#EBEDF9',
    subtlerHover: '#DADDF1',
    surface: '#E8E9F5',
  },
  secondary: {
    base: '#332871',
    focus: '#271F57',
    subtle: '#AC99D7',
    subtler: '#EFEBF9',
    subtlerHover: '#DDD7EB',
    surface: '#ECE8F5',
  },
  border: {
    default: '#E3E4E8',
    hover: '#C7C9D1',
    subtle: '#EDEEF1',
    focus: '#9498A5',
  },
  text: {
    primary: '#1A1A1D',
    secondary: '#4B4B50',
    tertiary: '#8F8F94',
    disabled: '#C2C2C6',
    inverse: '#FFFFFF',
  },
  status: {
    success: '#16A34A',
    info: '#2563EB',
    warning: '#F59E0B',
    danger: '#DC2626',
  },
  background: {
    base: '#FFFFFF',
    surface: '#F7F7F9',
    subSurface: '#EDEEF1',
    disabled: '#F1F1F3',
    subtleSuccess: '#E9F5EF',
    subtleInfo: '#EAF6FD',
    subtleWarning: '#FEF3E2',
    subtleDanger: '#FBEAEA',
  },
  backgroundDark: {
    base: '#0F1215',
    surface: '#17191D',
  },
})

// 모든 페이지의 기본 텍스트 색상 — 다른 색이 필요한 곳(히어로의 text.inverse 등)만 개별적으로 덮어쓴다.
globalStyle('body', { color: color.text.primary })
