import { style } from '@vanilla-extract/css'

import { breakpoint, color, spacing, typography } from '@shared/config/theme'
import { fontSize } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[24],
  width: '100%',
})

export const intro = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

// 마이페이지 탭 제목 — 모바일은 한 단계 줄인다(결제 페이지 제목과 같은 크기).
export const title = style([
  typography.title.xxlSemibold,
  {
    margin: 0,
    '@media': { [breakpoint.mobile]: { fontSize: fontSize[24] } },
  },
])

export const description = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

// 카드 모양은 AddressCard와 맞춘다(같은 자리에 배송지가 생기면 이 카드가 AddressCard로 바뀐다).
export const empty = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[20],
  boxSizing: 'border-box',
  width: '100%',
  padding: `${spacing[70]} ${spacing[20]} ${spacing[60]}`,
  borderRadius: '20px',
  border: `1px solid ${color.border.subtle}`,
  background: color.background.base,
  textAlign: 'center',
})

export const emptyIcon = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '72px',
  height: '72px',
  borderRadius: '28px',
  background: color.primary.subtler,
  // 아이콘은 currentColor로 이 색을 상속한다(CLAUDE.md의 lucide-react 참고).
  // 어두운 화면에서 primary.base는 버튼 바탕용이라 아이콘으론 흐리다 — subtle을 쓴다.
  color: color.primary.subtle,
})

export const emptyPin = style({
  width: '28px',
  height: '28px',
})

export const emptyBadge = style({
  position: 'absolute',
  right: '-6px',
  bottom: '-6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  border: `3px solid ${color.background.base}`,
  background: color.primary.base,
  color: color.text.inverse,
})

export const emptyBadgeIcon = style({
  width: '12px',
  height: '12px',
  strokeWidth: 3,
})

export const emptyText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
})

export const emptyTitle = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

export const emptyDescription = style([
  typography.body.sub,
  { color: color.text.secondary },
])

export const emptyButton = style({
  minWidth: '148px',
})

export const emptyCaption = style([
  typography.body.caption,
  { color: color.text.tertiary },
])
