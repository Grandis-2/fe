import { ChevronLeft, ChevronRight } from 'lucide-react'

import * as styles from './ScrollArrows.css'

export type ScrollArrowsProps = {
  canPrev: boolean
  canNext: boolean
  onPage: (dir: 1 | -1) => void
  className?: string
}

// 가로 스크롤 줄의 이전/다음 버튼 — 상태와 스크롤은 useScrollArrows(@shared/lib)가 맡는다.
// 어두운 구간에 놓이는 줄 전용이라 테마와 상관없이 어두운 원형 버튼이다.
export function ScrollArrows({
  canPrev,
  canNext,
  onPage,
  className,
}: ScrollArrowsProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={styles.arrow}
        aria-label="이전 상품"
        disabled={!canPrev}
        onClick={() => onPage(-1)}
      >
        <ChevronLeft size={18} aria-hidden />
      </button>
      <button
        type="button"
        className={styles.arrow}
        aria-label="다음 상품"
        disabled={!canNext}
        onClick={() => onPage(1)}
      >
        <ChevronRight size={18} aria-hidden />
      </button>
    </div>
  )
}
