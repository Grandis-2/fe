import { style } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'
import { headerHeight } from '@widgets/header'

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
  overflow: 'hidden',
  // 위 배너(Banner)의 어두운 바탕을 이어받아 한 화면처럼 보이게 한다 — 빛 번짐은
  // 배너 왼쪽 위에 있으니 여기선 오른쪽 아래에만 은은하게 둔다. 카테고리 줄까지 담아 구간이 길어서
  // 높이를 %가 아니라 px로 고정한다 — %면 빛이 화면 절반을 덮는다.
  background: [
    `radial-gradient(ellipse 40% 240px at 100% 100%, color-mix(in srgb, ${color.primary.subtle} 18%, transparent), transparent 70%)`,
    color.backgroundDark.base,
  ].join(', '),
})

// 많이 찾는 상품 TOP 10과 카테고리 줄을 같은 어두운 구간에 쌓는다.
export const sections = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[60],
  paddingBottom: spacing[80],
})
