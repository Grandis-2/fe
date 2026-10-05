import { style } from '@vanilla-extract/css'

/**
 * 폼에서 반복되는 입력칸 폭 규칙 — 최소 200px을 지키고 남는 공간만큼 늘어난다.
 * Input의 size는 폰트·패딩(밀도)만 정하고 폭은 부모가 정하므로,
 * 폭 때문에 size를 새로 만들지 않고 이 스타일을 className으로 넘긴다.
 */
export const growField = style({
  flex: '1 1 200px',
  minWidth: '200px',
})

/** 늘어나지 않고 200px을 유지하는 입력칸 */
export const fixedField = style({
  flex: '0 0 200px',
  width: '200px',
})
