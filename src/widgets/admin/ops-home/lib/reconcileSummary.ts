import { isRunActive, type ReconcileRun } from '@entities/admin-reconciliation'
import { formatDistance } from '@shared/lib/formatDistance'

type RunInput = Pick<
  ReconcileRun,
  'status' | 'verdict' | 'productId' | 'finishedAt' | 'findingCount'
> & {
  findingCountsByProduct: Pick<
    ReconcileRun['findingCountsByProduct'][number],
    'productId' | 'count'
  >[]
}

export type ReconcileSummary = {
  /** 불일치 건수. 판정한 검사가 없으면 null */
  value: number | null
  /** value가 null인 까닭 */
  emptyText?: string
  /** 언제 검사한 결과인지 — 대조는 하루 한 번·마감 뒤·요청 때만 돌아 실시간 숫자가 아니다 */
  caption?: string
}

/**
 * 대시보드의 외부 예약 대조 카드 — 범위(전체 또는 고른 사전예약)를 덮는 가장 최근 끝난 검사의
 * 불일치 건수. 사전예약을 골랐으면 그 상품만 검사한 것과, 전체 검사의 그 상품 몫을 함께 본다.
 * @param runs 최근 요청 순 검사 목록
 * @param now 기준 시각(ms) — 받은 응답 시각을 넘겨 렌더마다 흔들리지 않게 한다
 */
export function reconcileSummary(
  runs: readonly RunInput[] | undefined,
  productId: string | null,
  now: number,
): ReconcileSummary {
  if (!runs) return { value: null }
  const inScope = runs.filter(
    (run) => run.productId === null || run.productId === productId,
  )
  const checking = inScope[0] !== undefined && isRunActive(inScope[0])
  const last = inScope.find((run) => run.finishedAt !== null)
  if (!last?.finishedAt)
    return {
      value: null,
      emptyText: checking ? '검사 중' : '검사 기록 없음',
    }
  const caption = [
    `${formatDistance(now - Date.parse(last.finishedAt))} 전 검사`,
    checking && '새 검사 중',
  ]
    .filter(Boolean)
    .join(' · ')
  if (last.status === 'FAILED')
    return { value: null, emptyText: '판정 불가', caption }
  const value =
    productId === null || last.productId !== null
      ? last.findingCount
      : (last.findingCountsByProduct.find(
          (item) => item.productId === productId,
        )?.count ?? 0)
  return { value, caption }
}
