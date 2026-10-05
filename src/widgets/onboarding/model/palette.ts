// 온보딩은 테마와 상관없이 늘 어두운 화면이다 — primary.subtler처럼 다크모드에서 뒤집히는
// 테마 토큰 대신 라이트 테마 값과 같은 색을 고정해서 쓴다. 캔버스도 CSS 변수를 못 읽어서
// 화면(css.ts)과 캔버스(orbitScene)가 이 값을 같이 쓴다.
export const palette = {
  bg: '#0F1215', // backgroundDark.base
  ink: '#EBEDF9', // primary.subtler(라이트)
  ring: '#9099D1', // primary.subtle(라이트)
  accent: '#AC99D7', // secondary.subtle(라이트)
  desc: '#C7C7C7',
  hint: '#8C8C8C',
} as const
