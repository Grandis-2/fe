import { globalStyle, style } from '@vanilla-extract/css'

import { color, spacing } from '@shared/config/theme'

export const title = style({ color: color.text.primary })

// 컨테이너 padding은 0(embed가 끝까지 차도록) — 제목만 자기 여백을 갖는다.
export const modalTitle = style({
  padding: `${spacing[24]} ${spacing[24]} 0`,
})

export const sheetTitle = style({
  padding: `0 ${spacing[16]}`,
})

// 실제 크기(=embed 영역 확보)는 이 두 컨테이너가 정한다 — embed 자신은 항상
// 100%/100%로 부모를 꽉 채운다(아래 embed).
export const modalContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  width: '400px',
  maxWidth: '90vw',
  height: '550px',
  boxSizing: 'border-box',
})

// BottomSheet.Content는 maxHeight:90vh로 시트 전체만 제한할 뿐 자기 높이가
// 정해져 있지 않아, 그 안에서 flex:1로는 채울 공간이 없다 — 그래서 이 래퍼가
// 직접 높이를 갖는다.
export const sheetContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[12],
  height: '70vh',
})

// flex:1로 제목을 뺀 나머지 공간을 전부 차지한다 — embed(아래)의 height:100%가
// 기준으로 삼을 "정해진 높이"를 여기서 만들어 준다.
export const embedWrapper = style({
  flex: 1,
  minHeight: 0,
})

// 다음 우편번호 embed 대상 — 항상 부모(embedWrapper)를 꽉 채운다.
export const embed = style({
  width: '100%',
  height: '100%',
})

// 다음 embed()가 iframe을 감싸는 자기 전용 div를 embed 안에 새로 만들어 넣고
// 거기에 background-color:#fff를 인라인으로 박는다(우리 div가 아니라 그 밑에
// 하나 더 낳는 div). 인라인 스타일은 같은 인라인이 아니면 못 이기므로, 몇 겹
// 아래든 잡히도록 후손 선택자 + !important로 덮어쓴다.
globalStyle(`${embedWrapper} div`, {
  backgroundColor: 'transparent !important',
})
