import { style } from '@vanilla-extract/css'

import {
  typography,
  color,
  spacing,
  breakpoint,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
} from '@shared/config/theme'
import {
  fontSize,
  fontWeight,
} from '@shared/config/theme/tokens/typography/base'

export const Container = style({
  position: 'relative',
  // countdownWrapper는 반투명이라 콘텐츠 위에 겹쳐도 되지만, 그 아래 불투명한 모바일
  // 탭바는 콘텐츠를 완전히 가리므로 그 몫만 페이지 여백으로 확보한다.
  '@media': {
    [breakpoint.mobile]: {
      paddingBottom: `calc(${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET})`,
    },
  },
})

export const title = style([
  typography.title.lgSemibold,
  {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: color.background.base,
    padding: `${spacing[20]} ${spacing[16]}`,
    borderBottom: `2px solid ${color.primary.focus}`,
    '@media': {
      // 모바일만 작게 — 16px semibold 토큰이 없어 lgSemibold(20px)의 크기만 덮어쓴다.
      [breakpoint.mobile]: {
        fontSize: fontSize[16],
        padding: `${spacing[12]} ${spacing[16]}`,
      },
    },
  },
])

// 제목 아래 기간 — 모바일은 PreorderCard의 기간과 같은 12px.
export const period = style([
  typography.body.sub,
  {
    marginTop: spacing[4],
    color: color.text.tertiary,
    '@media': { [breakpoint.mobile]: { fontSize: fontSize[12] } },
  },
])

export const countdownWrapper = style({
  position: 'fixed',
  bottom: 0,
  // width:'100%'는 fixed 기준 부모인 뷰포트 폭이 되어버려 Container(max-width 1200px)보다
  // 넓게 튀어나온다 — left/right:0 + maxWidth + margin:auto로 Container 폭에 맞춰 중앙 정렬한다.
  left: 0,
  right: 0,
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: spacing[12],
  // 상/좌우는 좁게, 하단은 spacing[16] 기준으로 아래 모바일 탭바 계산과 맞춘다.
  padding: `${spacing[12]} ${spacing[12]} ${spacing[16]}`,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  // 모바일 탭바가 아래쪽에 떠 있으므로 그만큼 비워 카운트다운이 가리지 않게 한다.
  '@media': {
    [breakpoint.mobile]: {
      paddingBottom: `calc(${spacing[16]} + ${TAB_BAR_HEIGHT} + ${TAB_BAR_OFFSET})`,
    },
  },
})

// 모바일은 Button size="medium" 그대로, 데스크톱만 large(Button.css의 size.large) 치수로 키운다.
export const actionButton = style({
  width: '100%',
  '@media': {
    [breakpoint.desktop]: {
      height: spacing[60],
      padding: `0 ${spacing[20]}`,
      borderRadius: '14px',
      borderWidth: '2px',
      fontSize: fontSize[20],
      fontWeight: fontWeight.semibold,
    },
  },
})

export const countdown = style([
  typography.display.time,
  {
    textAlign: 'center',
    color: 'white',
  },
])

export const bottomSheetTitle = style([
  typography.title.mdMedium,
  { color: color.text.primary },
])

export const bottomSheetDescription = style([
  typography.body.sub,
  { color: color.text.tertiary, marginTop: spacing[4] },
])

export const modelSummary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  margin: `${spacing[20]} 0`,
})
