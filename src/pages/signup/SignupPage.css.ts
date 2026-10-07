import { style } from '@vanilla-extract/css'

import { breakpoint, spacing } from '@shared/config/theme'
import { headerHeight } from '@widgets/header'

// 배경(SignupBackground)은 화면에 고정된 맨 뒤 레이어라 여기선 내용 배치만 한다.
// 헤더 높이만큼 끌어올려야 헤더가 뒤를 어두운 구간(data-header-theme)으로 알아보고
// 불투명 바탕 대신 투명 + blur로 그린다.
export const root = style({
  display: 'flex',
  justifyContent: 'center',
  marginTop: `calc(-1 * ${headerHeight})`,
  padding: `calc(${headerHeight} + ${spacing[60]}) ${spacing[24]} ${spacing[120]}`,
  '@media': {
    [breakpoint.mobile]: {
      padding: `calc(${headerHeight} + ${spacing[40]}) ${spacing[24]} ${spacing[60]}`,
    },
  },
})

export const content = style({
  width: '100%',
  maxWidth: '420px',
})

// 결과 화면은 배경 궤도 중심(화면 36% 높이)에서 150px 아래에 놓는다. root의 윗여백
// (헤더 높이 + 60px, 모바일 40px)을 빼서 화면 기준 위치를 맞춘다.
export const result = style({
  marginTop: `max(0px, calc(36vh + 150px - ${headerHeight} - ${spacing[60]}))`,
  '@media': {
    [breakpoint.mobile]: {
      marginTop: `max(0px, calc(36vh + 150px - ${headerHeight} - ${spacing[40]}))`,
    },
  },
})
