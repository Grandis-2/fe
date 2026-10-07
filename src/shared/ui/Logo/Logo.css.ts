import { style } from '@vanilla-extract/css'

import { typography } from '@shared/config/theme'

// 크기·색은 쓰는 쪽(헤더 링크, 온보딩 그라데이션 등)에서 정하도록 물려받는다.
export const root = style([
  typography.logo.wordmark,
  {
    fontSize: 'inherit',
    // wordmark 토큰(-0.04em)은 결과·404 페이지 큰 글자와 같이 쓰므로 로고에서만 벌린다.
    letterSpacing: '0.06em',
  },
])

// Michroma는 V와 A의 사선이 서로 벌어져 V–A 사이만 넓어 보인다 — letter-spacing은 글자 뒤에
// 붙으므로 V에만 음수를 줘 A를 당긴다.
export const v = style({ letterSpacing: '-0.13em' })
