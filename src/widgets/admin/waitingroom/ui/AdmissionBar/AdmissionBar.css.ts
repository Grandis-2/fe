import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
})

export const track = style({
  position: 'relative',
  height: '18px',
  borderRadius: '999px',
  overflow: 'hidden',
})

const zoneBase = style({ position: 'absolute', top: 0, bottom: 0 })

// 바탕 구간 — 채운 막대가 올라가는 자리라 옅게 칠한다.
export const zone = styleVariants({
  ok: [zoneBase, { background: color.background.subtleSuccess }],
  tight: [zoneBase, { background: color.background.subtleWarning }],
  over: [zoneBase, { background: color.background.subtleDanger }],
})

export const fill = style({
  position: 'absolute',
  left: 0,
  top: '5px',
  bottom: '5px',
  borderRadius: '999px',
  background: color.primary.base,
  transition: `width ${motion.duration.normal} ${motion.easing.default}`,
})

// 바꿀 값과 지금의 차이 — 실제가 아니라 미리보기라 빗금으로 구분한다.
export const preview = style({
  position: 'absolute',
  top: '5px',
  bottom: '5px',
  background: `repeating-linear-gradient(135deg, ${color.primary.base} 0 3px, transparent 3px 6px)`,
  opacity: 0.6,
})

export const capLine = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: '2px',
  marginLeft: '-1px',
  background: color.text.primary,
})

export const labels = style({
  position: 'relative',
  height: '22px',
})

const labelBase = style([
  typography.body.sub,
  {
    position: 'absolute',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
])

// 기준점에 라벨의 어디를 맞출지 — 끝 가까이면 그쪽 끝을 맞춰 막대 밖으로 넘치지 않게 한다.
const anchor = {
  start: { transform: 'none' },
  center: { transform: 'translateX(-50%)' },
  end: { transform: 'translateX(-100%)' },
}

export const labelNow = styleVariants(anchor, (value) => [
  labelBase,
  value,
  { fontWeight: fontWeight.bold, color: color.primary.base },
])

export const labelLine = styleVariants(anchor, (value) => [
  labelBase,
  value,
  { fontWeight: fontWeight.bold, color: color.text.primary },
])

export const legend = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${spacing[4]} ${spacing[16]}`,
    color: color.text.secondary,
  },
])

const swatchBase = style({
  display: 'inline-block',
  width: '10px',
  height: '10px',
  marginRight: spacing[6],
  borderRadius: '3px',
  verticalAlign: '-1px',
})

export const swatch = styleVariants({
  ok: [swatchBase, { background: color.status.success, opacity: 0.4 }],
  tight: [swatchBase, { background: color.status.warning, opacity: 0.4 }],
  over: [swatchBase, { background: color.status.danger, opacity: 0.4 }],
})
