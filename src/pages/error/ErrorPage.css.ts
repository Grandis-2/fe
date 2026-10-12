import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 없는 주소 화면(NotFoundPage)과 같은 결 — 행성 일러스트와 문구를 가운데 모은다.
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[24],
  paddingTop: spacing[40],
  paddingBottom: spacing[40],
  textAlign: 'center',
})

export const illustration = style({
  color: color.secondary.subtle,
})

export const texts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const title = style([
  typography.title.xlSemibold,
  { color: color.text.primary },
])

export const description = style([
  typography.body.defaultRegular,
  { color: color.text.tertiary },
])

export const trace = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

// 문의 때 그대로 옮겨 적을 수 있게 한 번에 선택되고, 길어도 줄바꿈된다.
export const traceId = style({
  marginLeft: spacing[4],
  color: color.text.secondary,
  userSelect: 'all',
  wordBreak: 'break-all',
})

export const actions = style({
  display: 'flex',
  gap: spacing[8],
})
