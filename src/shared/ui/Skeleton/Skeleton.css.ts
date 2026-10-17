import { style } from '@vanilla-extract/css'

import { skeletonOnLight } from '@shared/config/theme'

export const root = style([
  skeletonOnLight,
  { display: 'block', maxWidth: '100%' },
])
