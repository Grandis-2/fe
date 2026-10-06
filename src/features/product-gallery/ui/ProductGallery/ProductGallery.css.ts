import { style } from '@vanilla-extract/css'

import { breakpoint, color, motion, spacing } from '@shared/config/theme'

// 슬라이더 밑 미리보기 목록 — 웹 전용. 모바일은 점(pagination)과 스와이프로 충분하다.
export const thumbnails = style({
  display: 'none',
  '@media': {
    [breakpoint.desktop]: {
      display: 'flex',
      justifyContent: 'center',
      gap: spacing[12],
      marginTop: spacing[16],
    },
  },
})

export const thumbnail = style({
  width: '76px',
  aspectRatio: '1 / 1',
  padding: spacing[8],
  overflow: 'hidden',
  borderRadius: '12px',
  border: `1.5px solid ${color.border.subtle}`,
  background: color.background.base,
  cursor: 'pointer',
  transition: `border-color ${motion.duration.fast} ${motion.easing.default}`,
  selectors: {
    '&:hover': { borderColor: color.border.hover },
  },
})

// 선택된 미리보기는 옵션 타일(SelectButton medium)과 같은 강조색 테두리.
export const thumbnailSelected = style({
  borderColor: color.primary.subtle,
  selectors: {
    '&:hover': { borderColor: color.primary.subtle },
  },
})

export const thumbnailImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

export const imageFrame = style({
  boxSizing: 'border-box',
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 1',
  borderRadius: '20px',
  background: color.background.base,
  border: `1px solid ${color.border.subtle}`,
  overflow: 'hidden',
  '@media': {
    // 데스크톱은 가로로 조금 넓은 프레임 — 모바일은 정사각형 그대로.
    [breakpoint.desktop]: { aspectRatio: '1.25' },
  },
})

// height:100%를 Slider(Swiper)까지 퍼센트로 내려보내면 aspect-ratio(imageFrame) + flex(swiper-wrapper)
// 조합에서 순환 계산이 발생해 크롬이 LayoutUnit 상한값(약 33554432px)으로 튀는 버그가 있었다 —
// absolute + inset:0으로 imageFrame의 padding box에 기하학적으로 고정시켜 퍼센트 순환 자체를 피한다.
export const sliderFill = style({
  position: 'absolute',
  inset: 0,
})

// contain: 프레임 폭이 줄면 이미지도 비율을 유지한 채 같이 줄어든다(cover는 잘라서 크기가 안 줄어든다).
// 안쪽 여백 없이 프레임 폭을 다 쓴다.
export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})
