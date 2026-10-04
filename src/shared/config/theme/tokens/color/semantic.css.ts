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
    page: '#F7F8FC',
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

// 다크모드 — 같은 변수에 값만 바꿔 꽂으므로 컴포넌트는 color.* 그대로 쓰면 된다.
// <html data-theme="dark">일 때만 켜진다(전환 UI는 아직 없음).
// - 배경: backgroundDark.base(#0F1215)를 페이지 바탕으로, 위로 뜰수록(카드·입력칸) 밝아진다.
// - primary/secondary.base: 흰 글자를 얹는 버튼 바탕이 우선이라 흰 글자 대비 4.5:1 이상으로 맞췄다
//   (글자로 쓰면 페이지 바탕 위 3.5:1 — 두 쪽 다 4.5:1인 색은 없다). 강조 글자는 subtle을 쓴다.
// - subtler/surface: 밝은 틴트 배경 → 어두운 틴트 배경으로 뒤집는다.
// - text.inverse, backgroundDark: 배너처럼 테마와 상관없이 늘 어두운 구간용이라 그대로 둔다.
createGlobalTheme(':root[data-theme="dark"]', color, {
  primary: {
    base: '#5A64B8',
    focus: '#4A53A0',
    subtle: '#A3ABE0',
    subtler: '#1E2140',
    subtlerHover: '#282C52',
    surface: '#1B1E36',
  },
  secondary: {
    base: '#6655B0',
    focus: '#54469A',
    subtle: '#BBAAE0',
    subtler: '#211B3A',
    subtlerHover: '#2C2449',
    surface: '#1F1A33',
  },
  border: {
    default: '#2E3138',
    hover: '#40444D',
    subtle: '#24272C',
    focus: '#6E7380',
  },
  text: {
    primary: '#F2F2F4',
    secondary: '#C2C2C8',
    tertiary: '#8E8E96',
    disabled: '#4B4B50',
    inverse: '#FFFFFF',
  },
  status: {
    success: '#3DBE6E',
    info: '#5B9BF5',
    warning: '#F5B33C',
    danger: '#F06464',
  },
  background: {
    base: '#17191D',
    page: '#0F1215',
    surface: '#1E2126',
    subSurface: '#262A30',
    disabled: '#1B1D21',
    subtleSuccess: '#13261B',
    subtleInfo: '#121F33',
    subtleWarning: '#2B2111',
    subtleDanger: '#2E1618',
  },
  backgroundDark: {
    base: '#0F1215',
    surface: '#17191D',
  },
})

// 모든 페이지의 기본 텍스트 색상 — 다른 색이 필요한 곳(히어로의 text.inverse 등)만 개별적으로 덮어쓴다.
globalStyle('body', { color: color.text.primary })
