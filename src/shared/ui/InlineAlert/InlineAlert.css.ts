import { style, styleVariants } from '@vanilla-extract/css'

import { color, spacing, typography } from '@/shared/config/theme'

export const root = style([
  typography.body.sub,
  {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    alignItems: 'center',
    gap: spacing[10],
    padding: `${spacing[12]} ${spacing[16]}`,
    border: '1px solid transparent',
    borderRadius: '12px',
  },
])

// 아이콘·본문 모두 root의 color를 쓴다(lucide는 currentColor 상속).
// status 원색은 연한 배경 위 대비가 부족해서 text.primary를 섞어 어둡게 깐다.
const textTone = (status: string) =>
  `color-mix(in srgb, ${status} 55%, ${color.text.primary})`

export const tone = styleVariants({
  // 상태색이 아니라 브랜드색으로 알리는 자리 — 결제 기한 안내처럼 경고까지는 아니고
  // 화면의 브랜드 톤과 이어져야 하는 문구에 쓴다.
  brand: {
    background: color.primary.subtler,
    borderColor: color.border.default,
    color: color.primary.base,
  },
  error: {
    background: color.background.subtleDanger,
    borderColor: `color-mix(in srgb, ${color.status.danger} 20%, transparent)`,
    color: textTone(color.status.danger),
  },
  warning: {
    background: color.background.subtleWarning,
    borderColor: `color-mix(in srgb, ${color.status.warning} 24%, transparent)`,
    color: textTone(color.status.warning),
  },
  info: {
    background: color.background.subtleInfo,
    borderColor: `color-mix(in srgb, ${color.status.info} 20%, transparent)`,
    color: textTone(color.status.info),
  },
  success: {
    background: color.background.subtleSuccess,
    borderColor: `color-mix(in srgb, ${color.status.success} 20%, transparent)`,
    color: textTone(color.status.success),
  },
})
