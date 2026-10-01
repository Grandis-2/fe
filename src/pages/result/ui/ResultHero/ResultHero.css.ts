import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography, breakpoint } from '@/shared/config/theme'
import { fontSize } from '@/shared/config/theme/tokens/typography/base'

// 그라데이션 중간 지점 색. 양 끝은 토큰(primary.focus / secondary.focus)을 그대로 쓰지만
// 중간 색들은 시안에 묶인 값이라 토큰에 없다 — Banner.css의 imageEdgeColor와 같은 이유로
// 여기 둔다.
const brandMidStops = '#534995 57%, #624998 82%'
const failureStops = '#5D3F91 19%, #844995 57%, #744998 82%, #451F57 100%'

export const root = style({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[20],
  boxSizing: 'border-box',
  width: '100%',
  padding: spacing[24],
  borderRadius: '16px',
  color: color.text.inverse,
  '@media': {
    [breakpoint.desktop]: {
      gap: spacing[24],
      padding: `${spacing[32]} ${spacing[32]}`,
    },
  },
})

export const tone = styleVariants({
  // 예약/구매 완료 — 브랜드 남색에서 보라로 흐른다.
  success: {
    backgroundImage: `linear-gradient(90deg, ${color.primary.focus} 0%, ${color.primary.base} 19%, ${brandMidStops}, ${color.secondary.focus} 100%)`,
  },
  // 실패 — 같은 결에 두되 보라 쪽으로 더 밀어 완료 화면과 구분한다.
  failure: {
    backgroundImage: `linear-gradient(90deg, ${color.secondary.focus} 0%, ${failureStops})`,
  },
})

export const iconCircle = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '68px',
  height: '68px',
  borderRadius: '50%',
  background: `color-mix(in srgb, ${color.text.inverse} 20%, transparent)`,
  color: color.primary.subtler,
})

export const texts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[8],
  minWidth: 0,
})

export const title = style([typography.title.xxlSemibold])

// 18px 레귤러 조합인 타이포 토큰이 없어서 크기만 덮어쓴다(ProductPaymentCard의 name과 같은 방식).
export const description = style([
  typography.body.defaultRegular,
  { fontSize: fontSize[18] },
])
