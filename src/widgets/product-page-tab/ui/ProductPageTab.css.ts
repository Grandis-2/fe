import { style } from '@vanilla-extract/css'

import { breakpoint, color, motion, typography } from '@shared/config/theme'
import { maxWidth } from '@shared/config/theme/tokens/container'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

// 반투명 유리 바탕은 화면 끝까지, 탭은 본문 폭(1184px) 안에서 4등분한다.
export const root = style({
  background: `color-mix(in srgb, ${color.background.base} 42%, transparent)`,
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  borderBottom: `1px solid ${color.border.subtle}`,
})

export const tabs = style({
  display: 'flex',
  alignItems: 'center',
  maxWidth: maxWidth.content,
  margin: '0 auto',
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
    selectors: { '&:hover': { color: color.text.primary } },
    '@media': {
      // 20px 글자 4개가 좁은 폭에서 붙어 보여 모바일만 줄인다. 미디어 규칙이 뒤에 출력돼
      // tabActive의 20px도 함께 덮인다. 높이를 바꾸면 ProductDetailPage의 tabPanel scrollMarginTop도 맞출 것.
      [breakpoint.mobile]: { height: '44px', fontSize: fontSize[16] },
      [breakpoint.desktop]: { fontSize: fontSize[18] },
    },
  },
])

// 글자 크기는 tab 그대로 두고 굵기만 올린다.
export const tabActive = style({
  fontWeight: fontWeight.semibold,
  borderBottomColor: color.primary.subtle,
  color: color.text.primary,
})
