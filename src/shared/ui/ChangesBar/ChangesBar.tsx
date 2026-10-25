import { Button } from '../Button'

import * as styles from './ChangesBar.css'

export type ChangesBarProps = {
  /** 바뀐 곳마다 한 줄 — '평균 800 → 1,200ms'처럼 전후를 같이 적는다 */
  changes: readonly string[]
  /** 건수 뒤에 붙일 말(예: '저장하면 버전 13') */
  note?: string
  /** 저장을 막는 까닭(입력 오류 등). 주면 저장 버튼이 막힌다 */
  problem?: string
  saveLabel: string
  saving?: boolean
  onSave: () => void
  onRevert: () => void
}

/**
 * 고친 폼의 저장 줄 — 무엇이 바뀌는지 모은 채로 저장하게 한다. 바뀐 곳이 없으면 저장·되돌리기를
 * 막아, 아무것도 안 바꾼 저장이 버전만 올리지 않게 한다.
 */
export function ChangesBar({
  changes,
  note,
  problem,
  saveLabel,
  saving = false,
  onSave,
  onRevert,
}: ChangesBarProps) {
  const changed = changes.length > 0
  return (
    <div
      className={changed ? styles.root.changed : styles.root.idle}
      role="region"
      aria-label="바뀐 곳 저장"
    >
      <div className={styles.summary}>
        <span className={styles.title}>
          {changed
            ? [`바뀐 곳 ${changes.length}개`, note].filter(Boolean).join(' · ')
            : '바뀐 곳 없음'}
        </span>
        {changed && (
          <ul className={styles.changes}>
            {changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        )}
        {problem && <span className={styles.problem}>{problem}</span>}
      </div>
      <div className={styles.actions}>
        <Button
          variant="outline"
          color="cancel"
          size="small"
          disabled={!changed || saving}
          onClick={onRevert}
        >
          되돌리기
        </Button>
        <Button
          size="small"
          disabled={!changed || problem !== undefined || saving}
          onClick={onSave}
        >
          {saving ? '저장 중…' : saveLabel}
        </Button>
      </div>
    </div>
  )
}
