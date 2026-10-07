import { style } from '@vanilla-extract/css'

// 브레이크포인트와 상관없는 값은 sprinkles가 아니라 여기 둔다.
// maxWidth와 padding을 같이 쓰므로 border-box — 아니면 실제 폭이 1200px + 좌우 padding이 된다.
export const root = style({
  boxSizing: 'border-box',
  marginInline: 'auto',
})
