import { PartialReprocessError } from '@entities/admin-reservation'

/** 부분 실패 뒤 다시 보낼 것 — 보내지 못한 예약, 그 전에 받아들여진 합계, 처음 시작 때의 건수 */
export type Unsent = {
  /** 실행한 범위(상품 id, 전체면 null) — 범위가 다르면 이어 쓰지 않는다 */
  scope: string | null
  preorderIds: string[]
  accepted: {
    targetCount: number
    skippedCount: number
    estimatedSeconds: number
  }
  deadLetterAtStart: number | null
}

/** 지금 범위로 이어 보낼 보내지 못한 목록. 범위가 다르면 null */
export const retryOf = (unsent: Unsent | null, scope: string | null) =>
  unsent !== null && unsent.scope === scope ? unsent : null

/**
 * 실패 뒤의 보내지 못한 목록. 부분 실패(앞 묶음은 접수됨)면 이어 쓸 것을 남기고, 그 밖의
 * 오류(예: 재처리할 예약 없음)면 비운다 — 옛 목록을 남기면 다음 실행이 이미 처리된 예약만 보낸다.
 */
export const unsentAfterError = (
  retry: Unsent | null,
  scope: string | null,
  deadLetterAtStart: number | null,
  caught: unknown,
): Unsent | null => {
  if (!(caught instanceof PartialReprocessError)) return null
  const before = retry?.accepted
  return {
    scope,
    preorderIds: caught.unsentPreorderIds,
    accepted: {
      targetCount: caught.accepted.targetCount + (before?.targetCount ?? 0),
      skippedCount: caught.accepted.skippedCount + (before?.skippedCount ?? 0),
      estimatedSeconds:
        caught.accepted.estimatedSeconds + (before?.estimatedSeconds ?? 0),
    },
    // 줄어든 건수는 처음 시작 때와 비교해야 하므로 처음 값을 이어 쓴다.
    deadLetterAtStart: retry?.deadLetterAtStart ?? deadLetterAtStart,
  }
}
