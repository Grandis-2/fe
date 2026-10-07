import { useSearchParams } from 'react-router'

import {
  getPreorderSchedule,
  PreorderCard,
  type PreorderCardData,
  type PreorderStatus,
} from '@entities/preorder'
import { InlineAlert } from '@shared/ui'

import * as styles from './PreorderList.css'

const TABS: { value: PreorderStatus; label: string }[] = [
  { value: 'live', label: '진행 중' },
  { value: 'soon', label: '오픈 예정' },
  { value: 'done', label: '마감' },
]

export type PreorderListProps = {
  preorders: PreorderCardData[]
}

// 사전예약 제목 + 상태 탭(개수) + 카드 그리드. 고른 탭은 URL(?status=)에 남겨
// 새로고침·뒤로 가기·공유해도 유지된다. 상태는 카드와 같은 규칙(날짜)으로 나눈다.
export function PreorderList({ preorders }: PreorderListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const active =
    TABS.find(({ value }) => value === searchParams.get('status'))?.value ??
    'live'

  const statusOf = (preorder: PreorderCardData) =>
    getPreorderSchedule(preorder.opensAt, preorder.closesAt).status
  const count = (status: PreorderStatus) =>
    preorders.filter((preorder) => statusOf(preorder) === status).length
  const visible = preorders.filter((preorder) => statusOf(preorder) === active)

  const select = (status: PreorderStatus) =>
    setSearchParams(
      (prev) => {
        prev.set('status', status)
        return prev
      },
      // 탭을 오갈 때마다 기록이 쌓이면 뒤로 가기로 페이지를 못 벗어난다.
      { replace: true },
    )

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>사전예약</h1>
        <div className={styles.tabs} role="group" aria-label="사전예약 상태">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={styles.tab[value === active ? 'active' : 'inactive']}
              aria-pressed={value === active}
              onClick={() => select(value)}
            >
              {label}
              <span className={styles.count}>{count(value)}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <InlineAlert status="info">해당하는 사전예약이 없어요.</InlineAlert>
      ) : (
        <div className={styles.grid}>
          {visible.map((preorder) => (
            <PreorderCard key={preorder.id} data={preorder} />
          ))}
        </div>
      )}
    </div>
  )
}
