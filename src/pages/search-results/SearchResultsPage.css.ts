import { style } from '@vanilla-extract/css'

import { color } from '@shared/config/theme'
import { headerHeight } from '@widgets/header'

export const root = style({
  boxSizing: 'border-box',
  minHeight: '100vh',
  marginTop: `calc(-1 * ${headerHeight})`,
  paddingTop: headerHeight,
  background: color.backgroundDark.base,
})
