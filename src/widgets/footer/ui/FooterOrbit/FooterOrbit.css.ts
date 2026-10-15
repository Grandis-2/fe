import { keyframes, style } from '@vanilla-extract/css'

import { color, onDark, spacing, typography } from '@shared/config/theme'
import {
  fontFamily,
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

import { activeStroke } from '../../lib/activeStroke'

// 궤도 도면(SVG)의 좌표계 — 이 크기로 그린 뒤 칸 폭에 맞춰 줄인다.
export const ORBIT_WIDTH = 1000
export const ORBIT_HEIGHT = 380

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

// 회전 중심은 쓰는 쪽이 style의 transformOrigin으로 준다(데스크톱·모바일 궤도 중심이 다르다).
export const spinning = style({
  animationName: spin,
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
  '@media': {
    '(prefers-reduced-motion: reduce)': { animationPlayState: 'paused' },
  },
})

// 궤도 바깥(위아래)을 흐리게 지운다 — 마스크는 알파만 보므로 색은 무엇이든 된다.
export const frame = style({
  position: 'relative',
  alignSelf: 'stretch',
  overflow: 'hidden',
  maskImage:
    'linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)',
})

export const canvas = style({
  position: 'absolute',
  left: 0,
  top: '50%',
  width: ORBIT_WIDTH,
  height: ORBIT_HEIGHT,
  transformOrigin: '0 0',
})

export const svg = style({
  position: 'absolute',
  inset: 0,
  overflow: 'visible',
})

export const ringStroke = style({ transition: 'stroke .3s' })

// 행성 버튼은 크기 0의 점으로 놓고, 누르는 영역·행성·이름표를 그 점 기준으로 띄운다.
export const satellite = style({
  position: 'absolute',
  width: 0,
  height: 0,
  padding: 0,
  border: 0,
  background: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
})

export const centered = style({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: '50%',
})

// 버튼 자체는 크기 0이라 포커스 링은 누르는 영역에 그린다.
export const hitArea = style([
  centered,
  {
    width: '36px',
    height: '36px',
    selectors: {
      'button:focus-visible > &': {
        outline: `2px solid ${color.primary.subtle}`,
        outlineOffset: '-4px',
      },
    },
  },
])

// 궤도 위를 함께 도는 장식 점.
export const deco = style({ fill: onDark(90) })

// 고른 행성만 커지고 브랜드색으로 빛난다. 검은 링은 뒤의 궤도선을 끊어 행성을 띄운다.
export const planet = style([
  centered,
  {
    width: '11px',
    height: '11px',
    background: onDark(96),
    boxShadow: `0 0 0 4px ${color.backgroundDark.base}`,
    transition: 'width .25s, height .25s, background .25s, box-shadow .25s',
    selectors: {
      '[aria-pressed="true"] > &': {
        width: '16px',
        height: '16px',
        background: color.primary.subtle,
        boxShadow: [
          `0 0 0 4px ${color.backgroundDark.base}`,
          `0 0 0 5px ${activeStroke(60)}`,
          `0 0 26px ${activeStroke(90)}`,
        ].join(', '),
      },
    },
  },
])

// 도면이 줄어도 이름표는 읽히게 쓰는 쪽에서 거꾸로 키운다(scale).
export const label = style({
  position: 'absolute',
  left: 0,
  top: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  transformOrigin: '0 0',
  whiteSpace: 'nowrap',
  fontFamily: fontFamily.pretendard,
  textShadow: `0 0 6px ${color.backgroundDark.base}, 0 0 2px ${color.backgroundDark.base}`,
  pointerEvents: 'none',
  selectors: { '&[data-side="left"]': { alignItems: 'flex-end' } },
})

export const labelName = style([
  typography.body.subSemibold,
  {
    color: onDark(90),
    selectors: { '[aria-pressed="true"] &': { color: color.text.inverse } },
  },
])

export const labelHandle = style({
  fontSize: '11px',
  lineHeight: 1.3,
  color: onDark(45),
  transition: 'color .25s',
  selectors: { '[aria-pressed="true"] &': { color: color.primary.subtle } },
})

// 궤도 가운데의 저장소 버튼.
export const repo = style([
  centered,
  {
    zIndex: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color.backgroundDark.base,
    border: `1px solid ${onDark(50)}`,
    color: color.text.inverse,
    boxShadow: `0 0 0 6px ${color.backgroundDark.base}`,
    transition: 'transform .2s, box-shadow .2s, border-color .2s',
    selectors: {
      '&:hover': {
        transform: 'translate(-50%, -50%) scale(1.08)',
        borderColor: onDark(90),
        boxShadow: `0 0 28px ${onDark(45)}`,
      },
    },
  },
])

export const repoLabel = style({
  position: 'absolute',
  zIndex: 4,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1px',
  transformOrigin: '0 0',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  textShadow: `0 0 6px ${color.backgroundDark.base}, 0 0 2px ${color.backgroundDark.base}`,
})

export const repoName = style({
  fontSize: fontSize[12],
  fontWeight: fontWeight.semibold,
  lineHeight: 1.3,
  color: color.text.inverse,
})

export const repoCaption = style({
  fontSize: '11px',
  lineHeight: 1.3,
  color: onDark(45),
})
