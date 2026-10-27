import { createVar, style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

// InlineAlert와 같은 모양이다 — InlineAlert는 읽어 주는 영역(role="status")이라 1초마다 바뀌는 숫자를 담지 않는다.
export const root = style([
  typography.body.sub,
  {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[10],
    marginBottom: spacing[20],
    padding: `${spacing[12]} ${spacing[16]}`,
    border: '1px solid transparent',
    borderRadius: '12px',
  },
])

// 남은 시간·아이콘 색.
const accent = createVar()

const textTone = (status: string) =>
  `color-mix(in srgb, ${status} 55%, ${color.text.primary})`

export const tone = styleVariants({
  // primary.base는 버튼 바탕용이라 어두운 바탕 위 글자로는 흐리다 — 글자는 본문색, 시간·아이콘만 밝은 primary로 강조한다.
  normal: {
    background: color.primary.subtlerHover,
    borderColor: `color-mix(in srgb, ${color.primary.base} 70%, transparent)`,
    color: color.text.primary,
    vars: { [accent]: color.primary.subtle },
  },
  // 30초 아래로 남았거나 끝났다.
  warning: {
    background: color.background.subtleWarning,
    borderColor: `color-mix(in srgb, ${color.status.warning} 24%, transparent)`,
    color: textTone(color.status.warning),
    vars: { [accent]: 'currentColor' },
  },
})

export const text = style({ flex: '1 1 200px' })

export const icon = style({ flexShrink: 0, color: accent })

export const time = style({
  color: accent,
  fontWeight: fontWeight.bold,
  fontVariantNumeric: 'tabular-nums',
})
