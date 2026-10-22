import { usageCells } from './cellFill'
import * as styles from './UsageCells.css'

export type UsageCellsProps = {
  /** 쓰고 있는 양 */
  used: number
  /** 전체(상한). 0이면 칸 대신 빈 테두리 */
  total: number
  /** 칸 수 — 전체가 얼마든 이만큼 그리고 비율로 채운다 */
  cells?: number
  /** 스크린리더가 읽을 설명(예: '입장 상한 20명 중 12명 사용') */
  label: string
}

/**
 * 칸 막대 — 채운 칸이 쓰는 양, 빈 칸이 남은 여유. 다 쓰면 채운 칸이 경고 색으로 바뀐다.
 * 퍼센트 막대보다 "몇 칸 남았나"가 바로 세어진다.
 */
export function UsageCells({
  used,
  total,
  cells = 10,
  label,
}: UsageCellsProps) {
  if (total <= 0) {
    return <div className={styles.empty} role="img" aria-label={label} />
  }
  const { on, full } = usageCells(used, total, cells)

  return (
    <div className={styles.root} role="img" aria-label={label}>
      {Array.from({ length: cells }, (_, index) => (
        <span
          key={index}
          className={
            index >= on
              ? styles.cell.off
              : full
                ? styles.cell.full
                : styles.cell.on
          }
        />
      ))}
    </div>
  )
}
