import { style } from '@vanilla-extract/css'

import { breakpoint, color, typography, spacing } from '@/shared/config/theme'
import { headerHeight } from '@/widgets/header'

// 헤더가 항상 sticky(= 문서 흐름 안)라 배너가 헤더 높이만큼 아래에서 시작한다 —
// 헤더가 투명하게 배너 위에 겹쳐 보이려면 그만큼 끌어올려야 한다.
export const bannerOverlap = style({
  marginTop: `calc(-1 * ${headerHeight})`,
})

export const hero = style({
  position: 'relative',
  // SwirlBackground의 z-index:-1이 여기서 스택킹 컨텍스트를 못 열면 문서 최상위까지
  // 뚫고 올라가서, 조상 어딘가(MainLayout 등)에 불투명 배경이 생기는 순간 가려진다.
  zIndex: 0,
  width: '100%',
  height: '770px',
  overflow: 'hidden',
  // 위 배너(Banner)의 어두운 바탕을 이어받아 한 화면처럼 보이게 한다 — 빛 번짐은
  // 배너 왼쪽 위에 있으니 여기선 오른쪽 아래에만 은은하게 둔다.
  background: [
    `radial-gradient(40% 50% at 100% 100%, color-mix(in srgb, ${color.primary.subtle} 18%, transparent), transparent 70%)`,
    color.backgroundDark.base,
  ].join(', '),
})

export const carouselViewport = style({
  position: 'relative',
  zIndex: 1,
  overflow: 'hidden',
  width: '80%',
  margin: `${spacing[50]} auto 0`,
  maskImage:
    'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
  WebkitMaskImage:
    'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
})

export const carouselContainer = style({
  display: 'flex',
  gap: spacing[24],
  // width를 명시하지 않는다: Embla의 loop 판정(canLoop)은 이 요소 자신의 박스 폭이
  // 전체 슬라이드 합계 폭보다 충분히 작아야(=뷰포트 정도) 통과한다. width:auto가
  // 부모(뷰포트) 폭만큼만 잡히는 게 오히려 맞는 값 — max-content로 콘텐츠 전체 폭과
  // 같게 만들면 canLoop가 무조건 실패해서 loop가 통째로 꺼져버린다.
})

export const carouselSlide = style({
  flex: '0 0 auto',
  // Embla loop는 flexbox gap을 마지막↔첫 슬라이드 사이에는 넣어주지 않는다(공식 가이드의
  // 알려진 동작) — 그 이음매에서 카드 간격이 좁아졌다 넓어지며 튀어 보이므로, 마지막
  // 슬라이드에 gap만큼 margin을 더해 보정한다.
  selectors: {
    '&:last-child': {
      marginRight: spacing[24],
    },
  },
  // 슬라이드 폭은 카드의 minWidth(230px)가 정해 왔는데, 모바일 카드는 그 최소 폭을
  // 풀어서(ProductCard.css) 폭을 여기서 직접 준다.
  '@media': {
    [breakpoint.mobile]: { width: '230px' },
  },
})

// apple-design 스킬 §15(타이포그래피) + §12(vibrancy): 배경 위에 얹히는 큰 텍스트는
// 살짝 더 타이트한 자간/행간을 쓰고, 반투명/움직이는 배경 위에서도 또렷이 읽히도록
// 흐린 회색이 아니라 고대비 색을 쓴다.
export const bestTitle = style([
  typography.title.xxlSemibold,
  {
    position: 'relative',
    zIndex: 1,
    color: color.text.inverse,
    padding: `${spacing[80]} ${spacing[20]} 0`,
    textAlign: 'center',
    // 다크 히어로 위에서 브랜드 톤(primary/secondary)으로 은은하게 번지는 글로우 —
    // 레이어를 좁은 것부터 넓게 쌓아 네온처럼 보이게 한다.
    textShadow: [
      `0 0 12px color-mix(in srgb, ${color.primary.subtle} 70%, transparent)`,
      `0 0 32px color-mix(in srgb, ${color.primary.base} 55%, transparent)`,
      `0 0 64px color-mix(in srgb, ${color.secondary.base} 40%, transparent)`,
    ].join(', '),
  },
])

export const recommendedSection = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: spacing[24],
  '@media': {
    // 모바일 카드는 검색 페이지처럼 2열로 놓는 작은 카드다.
    [breakpoint.mobile]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: spacing[12],
    },
  },
})

export const recommendedTitle = style([
  typography.title.lgSemibold,
  {
    marginBottom: spacing[30],
    padding: `0 ${spacing[8]}`,
  },
])

export const cardGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: spacing[24],
})
