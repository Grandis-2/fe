import { globalStyle } from '@vanilla-extract/css'

import { color } from './tokens/color/semantic.css'

// 크롬 자동 채우기는 칸을 밝은 파랑 바탕·검정 글자로 칠한다(브라우저 !important라 덮어쓸 수 없다).
// 바탕은 transition을 아주 길게 걸어 바뀌지 않게 해 칸 원래 바탕이 보이게 하고, 글자는 테마 글자색으로 칠한다
// — 어두운 사용자 화면이든 밝은 관리자 화면이든 data-theme에 맞는 색이 된다.
globalStyle(
  [
    'input:-webkit-autofill',
    'input:-webkit-autofill:hover',
    'input:-webkit-autofill:focus',
    'input:-webkit-autofill:active',
  ].join(', '),
  {
    transition: 'background-color 9999s ease-out',
    WebkitTextFillColor: color.text.primary,
    caretColor: color.text.primary,
  },
)
