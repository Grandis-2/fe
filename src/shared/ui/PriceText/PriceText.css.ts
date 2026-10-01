import { style } from '@vanilla-extract/css'

// px이 아니라 em이라 금액 글자 크기가 얼마든 같은 비율로 따라간다.
export const unit = style({
  fontSize: '0.7em',
  marginLeft: '0.2em',
})
