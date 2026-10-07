import { style } from '@vanilla-extract/css'

import { color, motion, onDark, spacing } from '@shared/config/theme'

// 크기·여백은 내용에 따라 다르므로 여기서 정하지 않는다 — 쓰는 쪽이 className으로 준다.
// position은 건드리지 않는다 — <dialog>를 showModal()로 띄우면 브라우저 기본
// 스타일시트가 position:fixed + inset:0 + margin:auto로 항상 가운데 정렬해 준다.
export const dialog = style({
  // 전역 리셋(`* { margin: 0 }`, app/styles/index.css)이 author 스타일이라
  // dialog:modal의 UA 기본 margin:auto(중앙 정렬)를 항상 이긴다 — 명시적으로 되살린다.
  margin: 'auto',
  boxSizing: 'border-box',
  // 남색→보라로 번지는 1px 테두리 — 바탕은 padding-box, 그라데이션은 border-box에 깔아
  // 투명한 border 자리로만 비치게 한다. 내용이 자기 바탕을 깔아도 dialog의
  // overflow:auto(:modal UA 기본)가 둥근 모서리로 잘라 준다.
  border: '1px solid transparent',
  borderRadius: '24px',
  padding: 0,
  background: [
    `linear-gradient(${color.background.base}, ${color.background.base}) padding-box`,
    `linear-gradient(140deg, color-mix(in srgb, ${color.primary.subtle} 60%, transparent), ${onDark(6)} 40%, ${onDark(4)} 60%, color-mix(in srgb, ${color.secondary.subtle} 50%, transparent)) border-box`,
  ].join(', '),
  boxShadow: `0 30px 80px rgba(0, 0, 0, 0.7), 0 0 100px color-mix(in srgb, ${color.primary.base} 35%, transparent)`,
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
      backdropFilter: 'blur(0)',
      transition: [
        `background ${motion.duration.normal} ${motion.easing.out} allow-discrete`,
        `backdrop-filter ${motion.duration.normal} ${motion.easing.out}`,
      ].join(', '),
    },
    '&[open]::backdrop': {
      background: `color-mix(in srgb, ${color.backgroundDark.base} 62%, transparent)`,
      backdropFilter: 'blur(4px)',
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
        backdropFilter: 'blur(0)',
      },
    },
  },
})

// X는 콘텐츠 padding과 무관하게 항상 dialog 우상단에 고정한다.
export const closeButton = style({
  position: 'absolute',
  top: spacing[16],
  right: spacing[16],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  border: 'none',
  borderRadius: '50%',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  // 밝은 내용(배송지 폼)과 어두운 내용(대기열) 위에 다 얹히므로 글자색을 바꾸지 않고,
  // 자기 글자색을 옅게 깐 원으로만 hover를 보여 준다.
  selectors: {
    '&:hover': {
      background: 'color-mix(in srgb, currentColor 14%, transparent)',
    },
  },
})
