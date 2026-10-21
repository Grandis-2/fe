import { style } from '@vanilla-extract/css'

import { color, onDark } from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

// 크기는 자리 폭(부모가 준 className)을 따라 바뀐다 — 좁으면 아이콘만, 넓으면 아이콘을 키우고 문구를 붙인다.
const narrow = '(max-width: 159px)'
const wide = '(min-width: 360px)'

// 자리의 크기·위치는 호출부 className이 정한다. 상품 PNG 여백 때문에 이미지에 건 scale은 대체 그림엔 필요 없어 끈다
// — 같은 요소에 붙는 호출부 클래스보다 앞서도록 클래스를 두 번 겹쳐 쓴다.
export const root = style({
  containerType: 'inline-size',
  overflow: 'hidden',
  selectors: { '&&': { transform: 'none' } },
})

// 호출부 className이 바탕색을 칠해도 덮도록 바탕은 안쪽 판에 깐다.
export const surface = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  boxSizing: 'border-box',
  width: '100%',
  height: '100%',
  padding: '16px',
  borderRadius: 'inherit',
  textAlign: 'center',
  background: `radial-gradient(ellipse 80% 70% at 50% 40%, ${onDark(4)}, transparent), ${color.backgroundDark.surface}`,
  '@container': {
    [narrow]: { padding: 0 },
    [wide]: { gap: '16px', padding: '24px' },
  },
})

export const icon = style({
  flexShrink: 0,
  width: '56px',
  height: '56px',
  strokeWidth: 1.9,
  '@container': {
    // 좁은 자리는 폭의 45%로 — 64px 썸네일에선 시안의 sm(26px)쯤, 120px에선 md(56px)에 가깝다.
    [narrow]: {
      width: 'clamp(24px, 45cqi, 56px)',
      height: 'clamp(24px, 45cqi, 56px)',
      strokeWidth: 2.4,
    },
    [wide]: { width: '92px', height: '92px', strokeWidth: 1.4 },
  },
})

// 망원경 선 — 바깥 윤곽이 가장 밝고, 이음선이 가장 어둡다.
export const outline = style({ stroke: onDark(22) })
export const frame = style({ stroke: onDark(15) })
export const seam = style({ stroke: onDark(10) })
export const raised = style({ fill: color.backgroundDark.surface })
export const recessed = style({ fill: color.backgroundDark.base })

export const label = style({
  fontSize: fontSize[12],
  fontWeight: fontWeight.medium,
  lineHeight: 1.4,
  letterSpacing: '-0.01em',
  color: onDark(50),
  '@container': {
    [narrow]: { display: 'none' },
    [wide]: { fontSize: fontSize[14] },
  },
})
