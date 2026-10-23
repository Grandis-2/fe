import { style } from '@vanilla-extract/css'

import { spacing } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[30],
})

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

// 다음 쪽을 받는 동안 앞 쪽을 흐리게 둔다 — 눌렀는데 아무 일 없어 보이지 않게.
export const listLoading = style({ opacity: 0.5 })

export const pagination = style({ alignSelf: 'center' })

export const retry = style({ alignSelf: 'center' })
