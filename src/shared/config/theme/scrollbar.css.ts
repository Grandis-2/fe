import { globalStyle } from '@vanilla-extract/css'

import { color } from './tokens/color/semantic.css'

// 스크롤바를 브라우저마다 같게 — 바탕은 투명하고 둥근 얇은 막대만 보인다.
// 크롬·엣지·사파리는 ::-webkit-scrollbar로 폭·모양까지 그린다. 파이어폭스는 그걸 몰라 표준 속성(얇게·색)으로 맞춘다.
// 크롬 121+는 표준 속성이 있으면 ::-webkit-scrollbar를 무시하므로, 표준 속성은 ::-webkit-scrollbar가 없는 브라우저에만 준다.
globalStyle('::-webkit-scrollbar', { width: '10px', height: '10px' })
globalStyle('::-webkit-scrollbar-track, ::-webkit-scrollbar-corner', {
  background: 'transparent',
})
// 투명 테두리 + padding-box로 막대를 가장자리에서 띄워 6px로 보이게 한다.
globalStyle('::-webkit-scrollbar-thumb', {
  border: '2px solid transparent',
  borderRadius: '999px',
  backgroundClip: 'padding-box',
  backgroundColor: color.scrollbar.thumb,
})
globalStyle('::-webkit-scrollbar-thumb:hover', {
  backgroundColor: color.scrollbar.thumbHover,
})
// 스크롤바를 숨긴 요소(scrollbarWidth: 'none', 클래스)는 이 전체 선택자보다 우선해 그대로 숨는다.
globalStyle('*', {
  '@supports': {
    'not selector(::-webkit-scrollbar)': {
      scrollbarWidth: 'thin',
      scrollbarColor: `${color.scrollbar.thumb} transparent`,
    },
  },
})
