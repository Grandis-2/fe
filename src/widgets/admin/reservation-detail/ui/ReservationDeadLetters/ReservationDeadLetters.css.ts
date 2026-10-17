import { style } from '@vanilla-extract/css'

import { color, typography } from '@shared/config/theme'

export const hint = style([typography.body.sub, { color: color.text.tertiary }])
