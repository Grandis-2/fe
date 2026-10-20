import { Package } from 'lucide-react'
import { useSearchParams } from 'react-router'

import {
  getPreorderSchedule,
  PreorderCard,
  usePreorders,
  type PreorderCardData,
  type PreorderStatus,
} from '@entities/preorder'
import { getErrorMessage } from '@shared/api/client'
import { Chip, InlineAlert, Skeleton, SkeletonGroup } from '@shared/ui'

import * as styles from './PreorderList.css'

const TABS: { value: PreorderStatus; label: string }[] = [
  { value: 'live', label: '진행 중' },
  { value: 'soon', label: '오픈 예정' },
  { value: 'done', label: '마감' },
]

// 사전예약 제목 + 그 아래 상태 칩(개수) + 카드 그리드. 고른 탭은 URL(?status=)에 남겨
// 새로고침·뒤로 가기·공유해도 유지된다. 상태는 카드와 같은 규칙(날짜)으로 나눈다.
export function PreorderList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: preorders = [], isPending, error } = usePreorders()
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
        {/* 페이지는 어둡지만 테마 밖이라 Chip이 어두운 토큰을 쓰도록 여기서 켠다. */}
        <div
          className={styles.tabs}
          role="group"
          aria-label="사전예약 상태"
          data-theme="dark"
        >
          {TABS.map(({ value, label }) => (
            <Chip
              key={value}
              selected={value === active}
              count={count(value)}
              onClick={() => select(value)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {error ? (
        <InlineAlert status="error" variant="big">
          {getErrorMessage(error, '사전예약을 불러오지 못했어요.')}
        </InlineAlert>
      ) : isPending ? (
        <SkeletonGroup className={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} tone="dark" aspectRatio="3 / 4" radius={16} />
          ))}
        </SkeletonGroup>
      ) : visible.length === 0 ? (
        <InlineAlert status="info" variant="big" icon={Package}>
          해당하는 사전예약이 없어요
        </InlineAlert>
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
