import { createVar, style, styleVariants } from '@vanilla-extract/css'

import {
  color,
  onDark,
  spacing,
  statusOnDark,
  typography,
} from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

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

// big — 어두운 페이지 바탕에 얹는 가운데 정렬 안내 카드(에러·빈 목록). 아이콘 타일과 제목·설명을 세로로 쌓는다.
// 강조색(accent)과 테두리는 tone마다 다르고, 나머지 모양은 변수로 받아 한 벌만 둔다.
const accent = createVar()
const border = createVar()
const tileBg = createVar()
const tileBorder = createVar()

export const bigRoot = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[20],
  padding: `56px ${spacing[24]}`,
  borderRadius: '20px',
  border: border,
  textAlign: 'center',
  // 위쪽에서 강조색이 옅게 번진다.
  background: `radial-gradient(60% 80% at 50% 0%, color-mix(in srgb, ${accent} 10%, transparent), transparent 70%), ${color.backgroundDark.surface}`,
})

export const bigIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '56px',
  height: '56px',
  borderRadius: '16px',
  background: tileBg,
  border: `1px solid ${tileBorder}`,
  color: accent,
})

export const bigText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[6],
  textWrap: 'pretty',
})

export const bigTitle = style({
  fontSize: fontSize[18],
  fontWeight: fontWeight.bold,
  color: color.text.inverse,
})

export const bigDescription = style({
  fontSize: fontSize[14],
  color: onDark(64),
})

// 상태색 tone: 강조색을 옅게 깐 타일과 실선 테두리.
const bigTint = (tone: string) => ({
  vars: {
    [accent]: tone,
    [border]: `1px solid color-mix(in srgb, ${tone} 28%, transparent)`,
    [tileBg]: `color-mix(in srgb, ${tone} 12%, transparent)`,
    [tileBorder]: `color-mix(in srgb, ${tone} 35%, transparent)`,
  },
})

export const bigTone = styleVariants({
  brand: bigTint(color.primary.subtle),
  error: bigTint(statusOnDark.danger),
  warning: bigTint(statusOnDark.warning),
  // 빈 목록 — 점선 테두리에 차분한 타일.
  info: {
    vars: {
      [accent]: color.primary.subtle,
      [border]: `1px dashed ${onDark(16)}`,
      [tileBg]: onDark(6),
      [tileBorder]: onDark(16),
    },
  },
  success: bigTint(statusOnDark.success),
})
