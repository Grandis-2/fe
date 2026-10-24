import { style } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'

// 밝은 화면에서도 원문 상자는 어둡게 둬 본문과 구분한다.
export const root = style({
  margin: 0,
  maxHeight: '480px',
  overflow: 'auto',
  padding: `${spacing[16]} ${spacing[20]}`,
  borderRadius: '10px',
  background: color.backgroundDark.surface,
  color: color.border.default,
  fontFamily:
    "'JetBrains Mono', 'D2Coding', ui-monospace, Menlo, Consolas, monospace",
  fontSize: '13px',
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
})

export const marked = style({
  borderRadius: '4px',
  background: `color-mix(in srgb, ${color.accent.preorder} 18%, transparent)`,
  color: color.accent.preorder,
})
