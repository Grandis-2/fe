export const breakpoint = {
  mobile: '(max-width: 743px)',
  desktop: '(min-width: 744px)',
} as const

// 상품 상세 전용 — 사진·옵션 두 칸은 각각 340px 아래로 줄지 않는다. 두 칸 + 간격(340 + 40 + 340)에
// 좌우 여백(4vw씩)과 스크롤바(~15px)까지 들어가는 800px부터 웹 배치, 그 아래는 모바일 배치(한 칸 + 하단 결제 바)다.
// 744~799px은 사이트(헤더·탭바)는 웹인데 상품 상세만 모바일이다.
export const productDetailBreakpoint = {
  mobile: '(max-width: 799px)',
  desktop: '(min-width: 800px)',
} as const
