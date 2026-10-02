import { style } from '@vanilla-extract/css'

import { breakpoint, color, motion, typography } from '@/shared/config/theme'
import { fontSize } from '@/shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  background: `color-mix(in srgb, ${color.background.base} 80%, transparent)`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
})

export const tab = style([
  typography.navigation.tab,
  {
    flex: '1 0 0',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: color.text.tertiary,
    cursor: 'pointer',
    // font-weight는 폭이 흔들리니 transition에서 제외 — color/border만 스르륵 바뀌게 한다.
    transition: [
      `color ${motion.duration.fast} ${motion.easing.default}`,
      `border-bottom-color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    '@media': {
      // 20px 글자 4개가 좁은 폭에서 붙어 보여 모바일만 줄인다. 미디어 규칙이 뒤에 출력돼
      // tabActive의 20px도 함께 덮인다. 높이를 바꾸면 ProductDetailPage의 tabPanel scrollMarginTop도 맞출 것.
      [breakpoint.mobile]: { height: '44px', fontSize: fontSize[16] },
    },
  },
])

export const tabActive = style([
  typography.button.lgSemibold,
  {
    borderBottomColor: color.primary.base,
    color: color.primary.base,
  },
])
