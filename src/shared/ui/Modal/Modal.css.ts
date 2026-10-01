import { style } from '@vanilla-extract/css'

import { color, motion, spacing } from '@/shared/config/theme'

// 크기·여백은 내용에 따라 다르므로 여기서 정하지 않는다 — 쓰는 쪽이 className으로 준다.
// position은 건드리지 않는다 — <dialog>를 showModal()로 띄우면 브라우저 기본
// 스타일시트가 position:fixed + inset:0 + margin:auto로 항상 가운데 정렬해 준다.
export const dialog = style({
  // 전역 리셋(`* { margin: 0 }`, app/styles/index.css)이 author 스타일이라
  // dialog:modal의 UA 기본 margin:auto(중앙 정렬)를 항상 이긴다 — 명시적으로 되살린다.
  margin: 'auto',
  boxSizing: 'border-box',
  border: 'none',
  borderRadius: '16px',
  padding: 0,
  background: color.background.base,
  opacity: 0,
  transform: 'scale(0.95)',
  transition: [
    `opacity ${motion.duration.normal} ${motion.easing.out}`,
    `transform ${motion.duration.normal} ${motion.easing.out}`,
    `overlay ${motion.duration.normal} ${motion.easing.out} allow-discrete`,
    `display ${motion.duration.normal} ${motion.easing.out} allow-discrete`,
  ].join(', '),
  selectors: {
    '&[open]': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '&::backdrop': {
      background: 'transparent',
      transition: `background ${motion.duration.normal} ${motion.easing.out} allow-discrete`,
    },
    '&[open]::backdrop': {
      background: `color-mix(in srgb, ${color.backgroundDark.base} 50%, transparent)`,
    },
  },
  '@starting-style': {
    selectors: {
      '&[open]': {
        opacity: 0,
        transform: 'scale(0.95)',
      },
      '&[open]::backdrop': {
        background: 'transparent',
      },
    },
  },
})

// X는 콘텐츠 padding과 무관하게 항상 dialog 우상단에 고정한다.
export const closeButton = style({
  position: 'absolute',
  top: spacing[16],
  right: spacing[16],
  display: 'inline-flex',
  padding: spacing[4],
  border: 'none',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: `color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { color: color.text.primary },
  },
})
