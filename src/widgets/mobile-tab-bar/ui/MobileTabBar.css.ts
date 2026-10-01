import { style } from '@vanilla-extract/css'

import {
  color,
  motion,
  shadow,
  spacing,
  typography,
  breakpoint,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@/shared/config/theme'
import { fontWeight } from '@/shared/config/theme/tokens/typography/base'

export const root = style({
  position: 'fixed',
  left: spacing[16],
  right: spacing[16],
  bottom: TAB_BAR_OFFSET,
  // 바텀시트(BottomSheet.css, 30)보다 위 — 카테고리 시트가 열려 있어도 탭바는 보이고
  // 다른 탭으로 바로 이동할 수 있다.
  zIndex: 31,
  // vaul(1.1.2)은 modal={false}여도 Radix Dialog를 modal로 열어 body에 pointer-events:none을
  // 건다 — 탭바는 body 아래라 이걸 상속해 클릭이 막히므로 직접 되살린다.
  pointerEvents: 'auto',
  // 탭 크기만큼만 차지하고(fit-content) left/right + margin auto로 가운데 정렬한다 —
  // 폭을 늘려 탭을 flex로 벌리면 아이콘 사이가 휑해진다.
  width: 'fit-content',
  margin: '0 auto',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[4],
  height: TAB_BAR_HEIGHT,
  padding: spacing[4],
  borderRadius: '999px',
  // 반투명 + 뒤 blur(유리 느낌). 바탕이 거의 투명해 경계가 흐려지므로 그림자로 띄운다.
  background: `color-mix(in srgb, ${color.background.base} 50%, transparent)`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: shadow.md,
  border: `1px solid color-mix(in srgb, ${color.text.inverse} 12%, transparent)`,
  '@media': {
    [breakpoint.desktop]: { display: 'none' },
  },
})

export const tab = style({
  // 가장 긴 라벨("마이페이지", 12px)이 한 줄에 들어가는 폭.
  width: '60px',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: 0,
  border: 'none',
  borderRadius: '999px',
  background: 'transparent',
  textDecoration: 'none',
  // 아이콘은 currentColor로 이 색을 상속한다(CLAUDE.md의 lucide-react 참고).
  color: color.primary.base,
  cursor: 'pointer',
  transition: [
    `background ${motion.duration.fast} ${motion.easing.default}`,
    `color ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  selectors: {
    // 선택된 탭은 반투명 회색 알약으로 표시한다 — 아이콘 색(남색)은 그대로 둔다.
    '&[aria-current="page"], &[aria-expanded="true"]': {
      background: `color-mix(in srgb, ${color.background.base} 30%, transparent)`,
    },
  },
})

const ACTIVE = '[aria-current="page"], [aria-expanded="true"]'

export const icon = style({
  width: '22px',
  height: '23px',
  transition: [
    `fill-opacity ${motion.duration.fast} ${motion.easing.default}`,
    `stroke-width ${motion.duration.fast} ${motion.easing.default}`,
  ].join(', '),
  // lucide엔 채워진(filled) 아이콘이 없다. fill을 100%로 채우면 돋보기 알·집 문·
  // 달력 체크처럼 안쪽 선이 같은 색에 묻혀 사라지므로, 옅게 채우고 선을 굵혀
  // "채워진 느낌"만 낸다. fill 색은 선과 같은 currentColor.
  fill: 'currentColor',
  fillOpacity: 0,
  selectors: {
    [`:is(${ACTIVE}) > &`]: { fillOpacity: 0.2, strokeWidth: 2.5 },
  },
})

export const label = style([
  // Pretendard는 typography 토큰이 갖고 있다 — 크기만 10px로 덮어쓴다.
  typography.body.caption,
  {
    whiteSpace: 'nowrap',
    fontSize: '10px',
    marginTop: '2px',
    selectors: {
      [`:is(${ACTIVE}) > &`]: { fontWeight: fontWeight.semibold },
    },
  },
])

// 탭바만큼의 여백은 BottomSheet가 맨 아래에 깔아 준다 — 여기선 기본 padding만 뺀다.
export const sheetContent = style({
  paddingBottom: 0,
})

// 목록이 시트 최대 높이(90vh)를 넘으면 여기서 스크롤한다. 시트 본체(vaul Content)에
// overflow를 주면 vaul이 시트 아래에 까는 ::after(높이 200%)까지 스크롤 영역에 들어가
// 빈 공간이 두 배로 생긴다 — 그래서 안쪽 래퍼가 스크롤을 맡는다.
export const sheetScroll = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  // modal={false}라 body 스크롤 잠금이 없다 — 끝에 닿은 스크롤이 뒤 페이지로 넘어가지 않게 끊는다.
  overscrollBehavior: 'contain',
  paddingBottom: spacing[16],
})

export const sheetTitle = style({
  marginBottom: spacing[20],
  color: color.text.primary,
})
