import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { color, motion, spacing, typography } from '@shared/config/theme'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  borderRadius: '8px',
  outline: '2px dashed transparent',
  outlineOffset: spacing[4],
  transition: `outline-color ${motion.duration.fast} ${motion.easing.default}`,
})

// 파일을 끌고 와 놓을 수 있는 동안
export const rootFileOver = style({
  outlineColor: color.primary.base,
  background: color.primary.subtler,
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[8],
})

export const label = style([
  typography.title.smMedium,
  { color: color.text.tertiary },
])

export const count = style([
  typography.body.sub,
  { color: color.text.tertiary },
])

export const tiles = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[8],
})

const tileBase = style({
  position: 'relative',
  boxSizing: 'border-box',
  flexShrink: 0,
  borderRadius: '8px',
  // 추가 칸과 같은 테두리 — 흰 바탕이나 밝은 사진도 칸 경계가 보인다.
  border: `1px solid ${color.border.default}`,
  overflow: 'hidden',
})

export const tile = styleVariants({
  square: [tileBase, { width: '80px', height: '80px' }],
  portrait: [tileBase, { width: '80px', height: '160px' }],
  // 고객 메인 배너 사진 칸(718×460)과 같은 비율 — 잘리는 모양까지 크게 보며 고른다.
  banner: [
    tileBase,
    { width: '100%', maxWidth: '480px', aspectRatio: '718 / 460' },
  ],
})

export const tileMovable = style({
  cursor: 'grab',
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${color.primary.base}`,
      outlineOffset: spacing[2],
    },
  },
})

// 끌고 있는 사진은 놓일 자리를 보여주는 빈칸처럼 흐리게 둔다.
export const tileDragging = style({
  opacity: 0.4,
})

export const thumbnail = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
})

export const removeButton = style({
  position: 'absolute',
  top: '4px',
  right: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  padding: 0,
  border: 'none',
  borderRadius: '9999px',
  background: 'rgba(26, 26, 29, 0.6)',
  color: color.text.inverse,
  cursor: 'pointer',
  // 타일 위에 올렸을 때만 드러내되, 키보드 포커스에서도 보이게 한다.
  opacity: 0,
  transition: `opacity ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    [`${tileBase}:hover &`]: { opacity: 1 },
    '&:focus-visible': { opacity: 1 },
  },
})

export const removeIcon = style({
  width: '12px',
  height: '12px',
})

const addTileBase = style({
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: '8px',
  border: `1px solid ${color.border.default}`,
  background: color.background.base,
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: [
    `border-color ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
    `background ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    '&:hover': {
      borderColor: color.primary.base,
      background: color.primary.subtler,
      color: color.primary.base,
    },
  },
})

export const addTile = styleVariants({
  square: [addTileBase, { width: '80px', height: '80px' }],
  portrait: [addTileBase, { width: '80px', height: '160px' }],
  banner: [
    addTileBase,
    { width: '100%', maxWidth: '480px', aspectRatio: '718 / 460' },
  ],
})

export const addIcon = style({
  width: '20px',
  height: '20px',
})

export const fileInput = style({
  display: 'none',
})

/** 올리는 중·실패를 사진 위에 덮는다 */
export const overlay = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `color-mix(in srgb, ${color.background.base} 60%, transparent)`,
})

export const overlayError = style({
  background: `color-mix(in srgb, ${color.background.subtleDanger} 80%, transparent)`,
  outline: `1px solid ${color.status.danger}`,
  outlineOffset: '-1px',
  borderRadius: '8px',
})

const spin = keyframes({ to: { transform: 'rotate(360deg)' } })

export const spinner = style({
  width: '20px',
  height: '20px',
  color: color.primary.base,
  animation: `${spin} 0.9s linear infinite`,
  '@media': {
    // 움직임을 줄이라는 설정이면 돌리지 않는다 — 아이콘만으로도 진행 중임이 보인다.
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})

export const retryButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  padding: 0,
  border: 'none',
  borderRadius: '9999px',
  background: color.background.base,
  color: color.status.danger,
  cursor: 'pointer',
})

export const retryIcon = style({
  width: '16px',
  height: '16px',
})

export const errorText = style([
  typography.body.caption,
  {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    color: color.status.danger,
  },
])

export const errorIcon = style({
  width: '14px',
  height: '14px',
  flexShrink: 0,
})

export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
})
