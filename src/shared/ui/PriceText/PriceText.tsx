import * as styles from './PriceText.css'

export type PriceTextProps = {
  /** "2,278,100원"처럼 단위가 붙은 문자열 */
  value: string
}

// 감싸는 요소를 만들지 않는다 — 쓰는 쪽이 이미 자기 타이포/색 클래스를 가진 요소를
// 두고 있어서, 여기서 요소를 하나 더 만들면 그 스타일을 못 받는다.
export function PriceText({ value }: PriceTextProps) {
  const unit = value.endsWith('원') ? '원' : null
  const amount = unit ? value.slice(0, -1) : value

  return (
    <>
      {amount}
      {unit && <span className={styles.unit}>{unit}</span>}
    </>
  )
}
