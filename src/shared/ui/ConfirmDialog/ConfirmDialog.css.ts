import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[16],
  width: '360px',
  maxWidth: '100%',
  padding: `${spacing[32]} ${spacing[24]} ${spacing[24]}`,
  boxSizing: 'border-box',
})

// 한글은 기본값이면 글자 단위로 끊겨 '시도합니 / 다'처럼 단어 중간에서 줄이 바뀐다.
// keep-all로 어절 단위로만 끊고, 띄어쓰기 없는 긴 값(예약번호 등)은 넘치지 않게 끊어 준다.
const wrapByWord = {
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
} as const

export const title = style([
  typography.title.mdSemibold,
  { color: color.text.primary, textAlign: 'center', ...wrapByWord },
])

export const description = style([
  typography.body.sub,
  {
    color: color.text.secondary,
    textAlign: 'center',
    // 줄바꿈을 그대로 살린다 — 안내 문구는 문장 단위로 끊어 읽힌다.
    whiteSpace: 'pre-line',
    ...wrapByWord,
  },
])

export const actions = style({
  display: 'flex',
  justifyContent: 'center',
  gap: spacing[8],
  marginTop: spacing[8],
})
