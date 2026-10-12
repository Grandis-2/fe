import { useSearchParams } from 'react-router'

import {
  DrawCard,
  getDrawPhase,
  useDraws,
  type DrawPhase,
} from '@entities/draw'
import { getErrorMessage } from '@shared/api/client'
import { InlineAlert } from '@shared/ui'

import * as styles from './DrawList.css'

const TABS: { value: DrawPhase; param: string; label: string }[] = [
  { value: 'OPEN', param: 'open', label: '응모 중' },
  { value: 'SCHEDULED', param: 'soon', label: '오픈 예정' },
  { value: 'CLOSED', param: 'closed', label: '마감' },
]

// 럭키 드로우 제목 + 단계 탭(개수) + 카드 그리드. 고른 탭은 URL(?status=)에 남겨 새로고침·뒤로 가기·공유해도 유지된다.
// 단계는 카드와 같은 규칙(시작·마감 시각)으로 나눈다.
export function DrawList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, isPending, error } = useDraws()
  const active =
    TABS.find(({ param }) => param === searchParams.get('status')) ?? TABS[0]

  const draws = data?.items ?? []
  const count = (phase: DrawPhase) =>
    draws.filter((draw) => getDrawPhase(draw) === phase).length
  const visible = draws.filter((draw) => getDrawPhase(draw) === active.value)

  const select = (param: string) =>
    setSearchParams(
      (prev) => {
        prev.set('status', param)
        return prev
      },
      // 탭을 오갈 때마다 기록이 쌓이면 뒤로 가기로 페이지를 못 벗어난다.
      { replace: true },
    )

  return (
    <div className={styles.root}>
      <div className={styles.intro}>
        <span className={styles.overline}>LUCKY DRAW</span>
        <h1 className={styles.title}>럭키드로우</h1>
        <span className={styles.description}>
          응모비를 내고 응모하면 추첨으로 증정품을 받을 수 있어요.
        </span>
      </div>

      <div className={styles.tabs} role="group" aria-label="럭키드로우 상태">
        {TABS.map(({ value, param, label }) => (
          <button
            key={value}
            type="button"
            className={
              styles.tab[value === active.value ? 'active' : 'inactive']
            }
            aria-pressed={value === active.value}
            onClick={() => select(param)}
          >
            {label}
            <span className={styles.count}>{count(value)}</span>
          </button>
        ))}
      </div>

      {error ? (
        <InlineAlert status="error" variant="big">
          {getErrorMessage(error, '럭키드로우를 불러오지 못했어요.')}
        </InlineAlert>
      ) : isPending ? (
        <InlineAlert status="info" variant="big" icon="info">
          럭키드로우를 불러오는 중이에요.
        </InlineAlert>
      ) : visible.length === 0 ? (
        <InlineAlert status="info" variant="big" icon="info">
          해당하는 럭키드로우가 없어요.
        </InlineAlert>
      ) : (
        <div className={styles.grid}>
          {visible.map((draw) => (
            <DrawCard key={draw.drawId} data={draw} />
          ))}
        </div>
      )}
    </div>
  )
}
