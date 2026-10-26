import type {
  ReconciliationFinding,
  ReconciliationRun,
} from '@shared/api/types'

/** 화면이 쓰는 모양이 응답과 같아 매퍼 없이 다시 내보낸다 */
export type ReconcileRun = ReconciliationRun
export type ReconcileFinding = ReconciliationFinding

/** 검사가 아직 끝나지 않았다 — 몇 초마다 다시 물어 끝을 기다린다 */
export const isRunActive = (run: Pick<ReconcileRun, 'status'>) =>
  run.status === 'REQUESTED' || run.status === 'RUNNING'

/**
 * 불일치를 고치는 방법으로 묶는다 — 서버 검사 종류(checkCode)가 19가지라 탭으로 그대로 둘 수
 * 없다. 서버가 종류마다 정해 준 조치(명세 불일치 목록 표)를 따른다.
 */
export type FindingGroup =
  'externalCancel' | 'reprocess' | 'reservationCancel' | 'manual'

export const findingGroups: FindingGroup[] = [
  'externalCancel',
  'reprocess',
  'reservationCancel',
  'manual',
]

export const findingGroupLabel: Record<FindingGroup, string> = {
  externalCancel: '외부 취소 필요',
  reprocess: '재처리 필요',
  reservationCancel: '예약 취소 필요',
  manual: '수동 조사',
}

/**
 * 검사 종류마다 무슨 상황인지 — '내용' 칸에 그대로 쓴다. 표에 없는 종류는 수동 조사로 보고
 * 코드만 보인다(명세: 모르는 checkCode는 수동 조사).
 */
const codes: Record<string, { group: FindingGroup; description: string }> = {
  CANCELED_BUT_MOCK_ACTIVE: {
    group: 'externalCancel',
    description: '우리는 취소했는데 외부엔 예약이 살아 있어요.',
  },
  CANCELED_WITHOUT_MOCK_MARKER: {
    group: 'externalCancel',
    description: '우리는 취소했는데 외부엔 그 예약 기록이 없어요.',
  },
  CANCEL_JOB_INCOMPLETE: {
    group: 'externalCancel',
    description:
      '우리는 취소했는데 외부에 취소를 보내는 작업이 성공 못 했어요.',
  },
  MOCK_ONLY: {
    group: 'externalCancel',
    description:
      '외부에만 예약이 있고 우리한텐 없어요. 한 건씩 확인하고 취소해요.',
  },
  PENDING_BUT_MOCK_ACTIVE: {
    group: 'reprocess',
    description: '우리는 아직 등록 대기인데 외부엔 이미 등록돼 있어요.',
  },
  REGISTERED_BUT_MOCK_CANCELED: {
    group: 'reservationCancel',
    description: '외부에선 이미 취소됐어요. 우리 쪽 예약도 취소해야 해요.',
  },
  PENDING_BUT_MOCK_CANCEL_MARKER: {
    group: 'reservationCancel',
    description: '우리는 등록 대기인데 외부에 취소 표시가 있어요.',
  },
  REGISTERED_NOT_IN_MOCK: {
    group: 'manual',
    description: '우리는 등록 완료인데 외부에 기록이 없어요.',
  },
  NUMBER_MISMATCH: {
    group: 'manual',
    description: '외부 예약 번호가 서로 달라요.',
  },
  CONTENT_MISMATCH: {
    group: 'manual',
    description: '회원·상품·옵션 같은 내용이 서로 달라요.',
  },
  JOB_STATE_MISMATCH: {
    group: 'manual',
    description: '예약 상태와 등록 작업 상태가 맞지 않아요.',
  },
  NUMBER_MISSING: {
    group: 'manual',
    description: '등록 완료인데 외부 예약 번호가 없어요.',
  },
  NUMBER_WITHOUT_SUCCESS: {
    group: 'manual',
    description: '외부 번호는 있는데 등록 작업은 성공이 아니에요.',
  },
  HISTORY_MISMATCH: {
    group: 'manual',
    description: '상태 이력이 지금 상태와 맞지 않아요.',
  },
  STUCK: {
    group: 'manual',
    description: '처리가 기준 시간을 넘겨 멈춰 있어요.',
  },
  OUTBOX_MISSING: {
    group: 'manual',
    description: '보내야 할 처리 메시지가 빠져 있어요.',
  },
  SHIPMENT_BATCH_MISMATCH: {
    group: 'manual',
    description: '순번이 배송 차수 구간 밖이에요.',
  },
  QUEUE_GAP: {
    group: 'manual',
    description: '순번 중간이 비어 있어요.',
  },
  PAID_BUT_REGISTERED: {
    group: 'manual',
    description: "결제는 됐는데 예약이 '결제 가능'에 머물러 있어요.",
  },
}

export const findingGroupOf = (checkCode: string): FindingGroup =>
  codes[checkCode]?.group ?? 'manual'

export const findingDescription = (checkCode: string) =>
  codes[checkCode]?.description ?? '알 수 없는 검사 종류예요. 상세를 확인해요.'

/**
 * 검사 하나의 종류별 건수를 묶음별 건수로 더한다(탭 숫자). 전체는 모든 종류의 합이다.
 */
export function countByGroup(findingCounts: Record<string, number>) {
  const counts: Record<FindingGroup | 'all', number> = {
    all: 0,
    externalCancel: 0,
    reprocess: 0,
    reservationCancel: 0,
    manual: 0,
  }
  for (const [code, count] of Object.entries(findingCounts)) {
    counts[findingGroupOf(code)] += count
    counts.all += count
  }
  return counts
}

/**
 * 묶음에 들어가는 검사 종류 중 이번 검사에 나온 것만 — 서버는 종류를 하나씩만 걸러서
 * 이것들을 차례로 받아 이어 붙인다. 0건인 종류는 묻지 않는다.
 */
export const codesOfGroup = (
  group: FindingGroup,
  findingCounts: Record<string, number>,
) =>
  Object.keys(findingCounts).filter(
    (code) => findingGroupOf(code) === group && findingCounts[code] > 0,
  )

/**
 * 조치 버튼을 켤 수 있는가. 조치 전이거나, 실패한 외부 취소(다시 누를 수 있다)만이다.
 * 수동 조사는 버튼이 없다.
 */
export const canAct = (finding: ReconcileFinding) =>
  findingGroupOf(finding.checkCode) !== 'manual' &&
  (finding.actionStatus === 'NOT_STARTED' ||
    (finding.actionStatus === 'FAILED' &&
      findingGroupOf(finding.checkCode) === 'externalCancel'))

/** 여러 건을 골라 한 번에 외부 취소할 수 있는가 — 외부에만 있는 건은 한 건씩만 */
export const canBatchExternalCancel = (finding: ReconcileFinding) =>
  canAct(finding) &&
  findingGroupOf(finding.checkCode) === 'externalCancel' &&
  finding.checkCode !== 'MOCK_ONLY'

/** 한 번에 외부 취소할 수 있는 최대 건수(서버 상한) */
export const EXTERNAL_CANCEL_BATCH_MAX = 100
/** 예약 취소 사유 최대 길이 — 넘으면 서버가 400 */
export const FINDING_CANCEL_REASON_MAX = 500
