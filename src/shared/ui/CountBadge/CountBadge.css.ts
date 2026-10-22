import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 높이를 고정하고 최소 너비를 높이와 같게 둬 한 자리면 원, 두 자리부터는 옆으로 늘어난
// 알약이 된다. 숫자는 flex로 가운데에 둔다.
export const root = style([
  typography.body.caption,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
    height: '20px',
    minWidth: '20px',
    padding: `0 ${spacing[6]}`,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    borderRadius: '9999px',
    background: color.status.danger,
    color: color.text.inverse,
  },
])
