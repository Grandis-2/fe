import { color } from './tokens/color/semantic.css'

export const lineClamp = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }) as const

// 어두운 바탕 위의 흰 글자·선을 투명도로 낮춘 색 — 예: onDark(18)은 흰색 18%.
export const onDark = (percent: number) =>
  `color-mix(in srgb, ${color.text.inverse} ${percent}%, transparent)`

// 어두운 바탕 위 상태색 — status.*는 밝은 바탕 기준이라 흰색을 섞어 밝힌다.
export const statusOnDark = {
  success: `color-mix(in srgb, ${color.status.success} 70%, white)`,
  danger: `color-mix(in srgb, ${color.status.danger} 55%, white)`,
  info: `color-mix(in srgb, ${color.status.info} 55%, white)`,
  warning: `color-mix(in srgb, ${color.status.warning} 55%, white)`,
}

// 어두운 바탕 위 강조 버튼 — 남색에서 보라로 번지는 바탕과 남색 빛 그림자.
export const primaryGradient = `linear-gradient(135deg, ${color.primary.base}, color-mix(in srgb, ${color.primary.base} 65%, ${color.secondary.subtle}))`
export const primaryGlow = `0 8px 28px color-mix(in srgb, ${color.primary.base} 55%, transparent), inset 0 1px 0 ${onDark(18)}`

// 어두운 페이지 바탕 — 위 720px 안에서 왼쪽 위 모서리에 보라·남색 빛이 번진다(mypage-background 시안).
// 빛 크기가 화면 폭 %라 모바일도 같은 값으로 줄어든다. 색은 시안 값 그대로 — 맞는 토큰이 없다.
const glowLayer = (gradient: string) => `${gradient} 0 0 / 100% 720px no-repeat`

export const glowBackground = [
  glowLayer(
    'radial-gradient(ellipse 55% 70% at 4% 0%, rgba(98, 80, 160, 0.45) 0%, rgba(60, 50, 120, 0.14) 45%, transparent 75%)',
  ),
  glowLayer(
    'radial-gradient(ellipse 40% 55% at 30% -10%, rgba(64, 74, 150, 0.35) 0%, transparent 70%)',
  ),
  color.backgroundDark.base,
].join(', ')

// 가로 스크롤 줄을 화면 양 끝까지 넓히고 늘린 만큼 안쪽 패딩으로 되돌린다 — 첫 카드는 타이틀 밑에 맞고,
// 카드는 컨테이너 경계가 아니라 화면 끝에서 잘려 "더 있다"로 읽힌다(ProductRanking·CategoryProducts).
// - 조상에 containerType: 'inline-size'가 있어야 한다 — %가 아니라 cqw(= 그 조상 폭)로 잰다.
//   scroll-padding의 %는 스크롤 영역 자기 폭 기준이라 0이 되고, 스냅이 첫 카드를 화면 끝으로 당긴다.
// - 50vw는 세로 스크롤바 폭까지 포함해 그 절반만큼 가로로 넘치므로, 놓이는 자리가 overflow를 잘라야 한다.
// startOffset: 시작 패딩에서 더 뺄 값(첫 카드 왼쪽이 비어 보일 때 당겨 맞춘다).
export const bleedScrollRow = (startOffset = '0px') => {
  const bleed = 'calc(50vw - 50cqw)'
  const bleedStart = `calc(${bleed} - ${startOffset})`
  return {
    display: 'flex',
    marginInline: `calc(-1 * ${bleed})`,
    paddingInlineStart: bleedStart,
    paddingInlineEnd: bleed,
    // 스냅 기준점도 패딩만큼 안으로 — 없으면 카드가 화면 왼쪽 끝에 붙어 멈춘다.
    scrollPaddingInlineStart: bleedStart,
    scrollPaddingInlineEnd: bleed,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    scrollBehavior: 'smooth',
    scrollbarWidth: 'none',
    '@media': {
      '(prefers-reduced-motion: reduce)': { scrollBehavior: 'auto' },
    },
  } as const
}
