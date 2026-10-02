import { style, styleVariants } from '@vanilla-extract/css'

import {
  color,
  motion,
  spacing,
  typography,
  shadow,
} from '@shared/config/theme'

export const root = style({
  display: 'inline-flex',
  // 세로 flex 부모 안에서는 align-items: stretch 때문에 가로로 늘어난다.
  // inline-flex만으로는 못 막으므로 폭을 내용에 맞춰 고정한다.
  width: 'fit-content',
  gap: spacing[4],
  padding: spacing[4],
  borderRadius: '10px',
  background: color.background.subSurface,
})

const tabBase = style([
  typography.body.subMedium,
  {
    padding: `${spacing[8]} ${spacing[14]}`,
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: color.text.tertiary,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: [
      `background ${motion.duration.fast} ${motion.easing.default}`,
      `color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
    selectors: {
      '&:hover': { color: color.text.secondary },
    },
  },
])

export const tab = styleVariants({
  active: [
    tabBase,
    {
      background: color.background.base,
      color: color.primary.base,
      boxShadow: shadow.sm,
      selectors: {
        '&:hover': { color: color.primary.base },
      },
    },
  ],
  inactive: [tabBase],
})
