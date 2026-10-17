import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

import { stickyTop } from '../ProductOverview/ProductOverview.css'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[60],
  // 모달 안엔 고정 헤더가 없어 사진이 스크롤 영역 맨 위에 붙는다.
  vars: { [stickyTop]: '0px' },
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[20],
})

// 구매자 상세의 영역 제목과 같은 크기.
export const sectionTitle = style([
  typography.title.xlSemibold,
  { margin: 0, fontWeight: fontWeight.bold, color: color.text.primary },
])
