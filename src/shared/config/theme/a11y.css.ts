import { style } from '@vanilla-extract/css'

// 화면엔 안 보이고 스크린리더만 읽는 글자 — 스켈레톤처럼 눈으로만 알 수 있는 상태를 알린다.
export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
})
