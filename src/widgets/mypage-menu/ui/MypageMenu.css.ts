import { style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@/shared/config/theme'
import { fontWeight } from '@/shared/config/theme/tokens/typography/base'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[30],
  width: '202px',
  padding: spacing[20],
  borderRadius: '12px',
  background: color.background.base,
  border: `1px solid ${color.border.default}`,
})

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
  alignItems: 'flex-start',
})

export const headingLabel = style([
  typography.body.subMedium,
  { color: color.text.tertiary },
])
export const userName = style([
  typography.title.lgSemibold,
  { color: color.text.primary },
])

export const sections = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
  width: '100%',
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  width: '100%',
})

export const sectionTitle = styleVariants({
  active: [
    typography.body.subMedium,
    { color: color.primary.focus, textAlign: 'left' },
  ],
  inactive: [
    typography.body.subMedium,
    { color: color.text.tertiary, textAlign: 'left' },
  ],
})

export const linkList = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: spacing[6],
})

export const link = style([
  typography.body.sub,
  {
    boxSizing: 'border-box',
    height: '24px',
    padding: `${spacing[2]} 0`,
    color: color.text.secondary,
    background: 'transparent',
    border: 'none',
    borderBottom: '1.5px solid transparent',
    cursor: 'pointer',
    transition: [
      `color ${motion.duration.fast} ${motion.easing.default}`,
      `border-bottom-color ${motion.duration.fast} ${motion.easing.default}`,
    ].join(', '),
  },
])

export const linkActive = style({
  fontWeight: fontWeight.semibold,
  color: color.primary.base,
  borderBottomColor: color.primary.base,
})
