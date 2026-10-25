import { http } from 'msw'

import { reservationStore } from '../fixtures/admin-reservation'
import { fail, invalid, ok } from '../response'
import { url } from '../url'

import { markCanceled, markReprocessed } from './admin-reservation'

import type {
  AdminPreorderDetail,
  ExternalCancelBatchItem,
  ExternalCancelBatchRequest,
  FindingCancelRequest,
  ReconciliationFinding,
  ReconciliationFindingPage,
  ReconciliationRun,
  ReconciliationRunRequest,
} from '../../types'
import type { RequestHandler } from 'msw'

const BASE = '/api/v1/admin/preorders/reconciliation'
// 실서버 검사는 몇 초 걸린다(실측 2~8초) — 목도 잠깐 대기·검사 중을 거친다.
const START_DELAY_MS = 1_000
const RUN_MS = 2_500
// 재처리는 서버가 뒤에서 하므로 결과가 조금 늦게 예약에 반영된다.
const REPROCESS_DELAY_MS = 2_000
const HOUR = 60 * 60 * 1000

// 외부 취소 가능한 검사 종류(예약이 취소 완료여야 한다) · 외부에만 있는 건
const EXTERNAL_CANCEL_CODES = new Set([
  'CANCELED_BUT_MOCK_ACTIVE',
  'CANCELED_WITHOUT_MOCK_MARKER',
  'CANCEL_JOB_INCOMPLETE',
  'MOCK_ONLY',
])
const ADMIN_CANCEL_CODES = new Set([
  'REGISTERED_BUT_MOCK_CANCELED',
  'PENDING_BUT_MOCK_CANCEL_MARKER',
])

const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

const beOf = (detail: AdminPreorderDetail) => ({
  token: detail.preorderId,
  status: detail.status,
  externalReference: detail.externalReference,
  productId: detail.productId,
  registerJobStatus:
    detail.syncJobs.find((job) => job.jobType === 'REGISTER')?.status ?? null,
})

const mockOf = (
  detail: AdminPreorderDetail | null,
  status: 'ACTIVE' | 'CANCELED',
  externalNumber: string,
) => ({
  externalKey: detail?.preorderId ?? crypto.randomUUID(),
  externalNumber,
  productId: detail?.productId ?? null,
  status,
})

type Seed = {
  checkCode: string
  detail: AdminPreorderDetail | null
  be?: Record<string, unknown> | null
  mock: Record<string, unknown> | null
  firstDetectedAt: string
}

// 목 예약에서 검사 종류마다 하나씩 골라 불일치를 만든다 — 조치가 실제 예약에 반영되게.
function seedFindings(): Seed[] {
  const pick = (test: (detail: AdminPreorderDetail) => boolean, skip = 0) =>
    reservationStore.filter(test)[skip] ?? null
  const canceled = (skip: number) =>
    pick((detail) => detail.status === 'CANCELED', skip)
  const deadLetter = pick((detail) =>
    detail.syncJobs.some(
      (job) => job.jobType === 'REGISTER' && job.status === 'DEAD_LETTER',
    ),
  )
  const registered = (skip: number) =>
    pick((detail) => detail.status === 'REGISTERED', skip)

  const seeds: (Seed | null)[] = [
    canceled(0) && {
      checkCode: 'CANCELED_BUT_MOCK_ACTIVE',
      detail: canceled(0),
      mock: mockOf(canceled(0), 'ACTIVE', 'EXT-20261024-041022'),
      firstDetectedAt: ago(37 * HOUR),
    },
    canceled(1) && {
      checkCode: 'CANCEL_JOB_INCOMPLETE',
      detail: canceled(1),
      mock: mockOf(canceled(1), 'ACTIVE', 'EXT-20261025-030217'),
      firstDetectedAt: ago(13 * HOUR),
    },
    {
      checkCode: 'MOCK_ONLY',
      detail: null,
      be: null,
      mock: mockOf(null, 'ACTIVE', 'EXT-20261025-055190'),
      firstDetectedAt: ago(HOUR),
    },
    deadLetter && {
      checkCode: 'PENDING_BUT_MOCK_ACTIVE',
      detail: deadLetter,
      mock: mockOf(deadLetter, 'ACTIVE', 'EXT-20261025-048120'),
      firstDetectedAt: ago(HOUR),
    },
    registered(0) && {
      checkCode: 'REGISTERED_BUT_MOCK_CANCELED',
      detail: registered(0),
      mock: mockOf(registered(0), 'CANCELED', 'EXT-20261025-022581'),
      firstDetectedAt: ago(HOUR),
    },
    registered(1) && {
      checkCode: 'NUMBER_MISMATCH',
      detail: registered(1),
      mock: mockOf(registered(1), 'ACTIVE', 'EXT-20261024-061940'),
      firstDetectedAt: ago(37 * HOUR),
    },
  ]
  return seeds.filter((seed) => seed !== null)
}

const toFinding = (runId: string, seed: Seed): ReconciliationFinding => ({
  findingId: crypto.randomUUID(),
  runId,
  checkCode: seed.checkCode,
  targetKey: seed.detail?.preorderId ?? String(seed.mock?.externalKey),
  productId: seed.detail?.productId ?? null,
  productName: seed.detail?.productTitle ?? null,
  beSnapshot: seed.be === null ? null : seed.detail && beOf(seed.detail),
  mockSnapshot: seed.mock,
  firstDetectedAt: seed.firstDetectedAt,
  actionStatus: 'NOT_STARTED',
  actionType: null,
  actionRequestedBy: null,
  actionRequestedAt: null,
  actionNote: null,
})

const countOf = (findings: ReconciliationFinding[]) => {
  const byCode: Record<string, number> = {}
  const byProduct = new Map<
    string | null,
    { productName: string | null; count: number }
  >()
  for (const finding of findings) {
    byCode[finding.checkCode] = (byCode[finding.checkCode] ?? 0) + 1
    const entry = byProduct.get(finding.productId) ?? {
      productName: finding.productName,
      count: 0,
    }
    entry.count += 1
    byProduct.set(finding.productId, entry)
  }
  return {
    findingCount: findings.length,
    findingCounts: byCode,
    findingCountsByProduct: [...byProduct]
      .map(([productId, entry]) => ({ productId, ...entry }))
      .toSorted((a, b) => b.count - a.count),
  }
}

const runBase = (
  runId: string,
  createdAt: string,
): Omit<ReconciliationRun, 'status' | 'verdict'> => ({
  runId,
  requestedBy: null,
  productId: null,
  productName: null,
  createdAt,
  startedAt: null,
  cutoffAt: null,
  finishedAt: null,
  errorMessage: null,
  findingCount: 0,
  findingCounts: {},
  findingCountsByProduct: [],
  heldCount: null,
  pendingSyncCount: null,
  cancelingCount: null,
  deadLetterCount: null,
})

function complete(run: ReconciliationRun, findings: ReconciliationFinding[]) {
  const at = new Date(run.createdAt).getTime()
  Object.assign(run, {
    status: 'COMPLETED',
    verdict: findings.length > 0 ? 'MISMATCHED' : 'MATCHED',
    startedAt: new Date(at + 100).toISOString(),
    cutoffAt: new Date(at - 2 * 60 * 1000).toISOString(),
    finishedAt: new Date(at + RUN_MS).toISOString(),
    ...countOf(findings),
    heldCount: 0,
    pendingSyncCount: reservationStore.filter(
      (detail) => detail.status === 'PENDING_SYNC',
    ).length,
    cancelingCount: reservationStore.filter(
      (detail) => detail.status === 'CANCELING',
    ).length,
    deadLetterCount: reservationStore.filter((detail) =>
      detail.syncJobs.some((job) => job.status === 'DEAD_LETTER'),
    ).length,
  } satisfies Partial<ReconciliationRun>)
}

// 최근 요청이 앞. 어제 새벽 정기 검사(일치)와 한 시간 전 정기 검사(불일치)로 시작한다.
const runs: ReconciliationRun[] = []
const findingsByRun = new Map<string, ReconciliationFinding[]>()
{
  const older: ReconciliationRun = {
    ...runBase(crypto.randomUUID(), ago(14 * HOUR)),
    status: 'COMPLETED',
    verdict: 'MATCHED',
  }
  complete(older, [])
  const latest: ReconciliationRun = {
    ...runBase(crypto.randomUUID(), ago(HOUR)),
    status: 'COMPLETED',
    verdict: 'MISMATCHED',
  }
  const findings = seedFindings().map((seed) => toFinding(latest.runId, seed))
  complete(latest, findings)
  findingsByRun.set(latest.runId, findings)
  runs.push(latest, older)
}

const allFindings = () => [...findingsByRun.values()].flat()
const findFinding = (findingId: string) =>
  allFindings().find((finding) => finding.findingId === findingId)

// 조치를 마쳤거나 처리 중인 건은 다음 검사에서 빠진다고 본다 — 실서버는 실제로 다시 비교한다.
const stillOpen = (finding: ReconciliationFinding) =>
  finding.actionStatus === 'NOT_STARTED' || finding.actionStatus === 'FAILED'

function startRun(run: ReconciliationRun) {
  setTimeout(() => {
    Object.assign(run, {
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
    })
  }, START_DELAY_MS)
  setTimeout(() => {
    const previous = runs.find(
      (item) => item !== run && item.status === 'COMPLETED',
    )
    const carried = (previous ? (findingsByRun.get(previous.runId) ?? []) : [])
      .filter(stillOpen)
      .map((finding) => ({
        ...finding,
        findingId: crypto.randomUUID(),
        runId: run.runId,
        actionStatus: 'NOT_STARTED' as const,
        actionType: null,
        actionRequestedBy: null,
        actionRequestedAt: null,
        actionNote: null,
      }))
    findingsByRun.set(run.runId, carried)
    complete(run, carried)
    run.finishedAt = new Date().toISOString()
  }, START_DELAY_MS + RUN_MS)
}

const markAction = (
  finding: ReconciliationFinding,
  patch: Pick<ReconciliationFinding, 'actionStatus' | 'actionType'> &
    Partial<Pick<ReconciliationFinding, 'actionNote'>>,
) =>
  Object.assign(finding, {
    actionRequestedBy: 'admin',
    actionRequestedAt: new Date().toISOString(),
    actionNote: null,
    ...patch,
  })

const taken = () =>
  fail(409, {
    code: 'RECONCILIATION_ACTION_TAKEN',
    message: '이미 조치한 건입니다.',
  })

const notAllowed = () =>
  fail(409, {
    code: 'RECONCILIATION_ACTION_NOT_ALLOWED',
    message: '이 검사 종류에는 할 수 없는 조치입니다.',
  })

// 키로 외부 취소 — 결과를 바로 준다. 목은 외부 기록을 취소된 것으로 바꾼다.
function externalCancel(finding: ReconciliationFinding) {
  if (!EXTERNAL_CANCEL_CODES.has(finding.checkCode)) return notAllowed()
  if (!stillOpen(finding)) return taken()
  markAction(finding, {
    actionStatus: 'SUCCEEDED',
    actionType: 'EXTERNAL_CANCEL',
    actionNote: 'Mock 등록을 취소함',
  })
  if (finding.mockSnapshot) finding.mockSnapshot.status = 'CANCELED'
  return null
}

export const adminReconciliationHandlers: RequestHandler[] = [
  http.get(url(`${BASE}/runs`), ({ request }) => {
    const query = new URL(request.url).searchParams
    const page = Number(query.get('page') ?? 0)
    const size = Number(query.get('size') ?? 20)
    return ok({
      items: runs.slice(page * size, page * size + size),
      page,
      size,
      total: runs.length,
    })
  }),

  http.post(url(`${BASE}/runs`), async ({ request }) => {
    if (
      runs.some((run) => run.status === 'REQUESTED' || run.status === 'RUNNING')
    ) {
      return fail(409, {
        code: 'RECONCILIATION_RUN_ACTIVE',
        message: '이미 검사가 진행 중입니다.',
      })
    }
    const body = (await request
      .json()
      .catch(() => ({}))) as ReconciliationRunRequest
    const run: ReconciliationRun = {
      ...runBase(crypto.randomUUID(), new Date().toISOString()),
      status: 'REQUESTED',
      verdict: null,
      requestedBy: 'admin',
      productId: body.productId ?? null,
    }
    runs.unshift(run)
    startRun(run)
    return ok(run, 202)
  }),

  http.get(url(`${BASE}/runs/:runId/findings`), ({ request, params }) => {
    const findings = findingsByRun.get(String(params.runId))
    if (!findings) {
      return fail(404, {
        code: 'RECONCILIATION_RUN_NOT_FOUND',
        message: '검사를 찾을 수 없습니다.',
      })
    }
    const query = new URL(request.url).searchParams
    const checkCode = query.get('checkCode')
    const productId = query.get('productId')
    const page = Number(query.get('page') ?? 0)
    const size = Number(query.get('size') ?? 20)
    const matched = findings.filter(
      (finding) =>
        (!checkCode || finding.checkCode === checkCode) &&
        (!productId || finding.productId === productId),
    )
    return ok<ReconciliationFindingPage>({
      items: matched.slice(page * size, page * size + size),
      page,
      size,
      total: matched.length,
    })
  }),

  http.post(url(`${BASE}/findings/external-cancel`), async ({ request }) => {
    const body = (await request
      .json()
      .catch(() => null)) as Partial<ExternalCancelBatchRequest> | null
    const ids = [...new Set(body?.findingIds ?? [])]
    if (ids.length < 1 || ids.length > 100) {
      return invalid([
        { field: 'findingIds', message: '1~100건이어야 합니다.' },
      ])
    }
    const items: ExternalCancelBatchItem[] = ids.map((findingId) => {
      const finding = findFinding(findingId)
      const refuse = (errorCode: string, errorMessage: string) => ({
        findingId,
        finding: null,
        errorCode,
        errorMessage,
      })
      if (!finding)
        return refuse('RECONCILIATION_FINDING_NOT_FOUND', '없는 건입니다.')
      if (finding.checkCode === 'MOCK_ONLY')
        return refuse(
          'RECONCILIATION_ACTION_NOT_ALLOWED',
          '외부에만 있는 건은 한 건씩 확인하고 취소해요.',
        )
      if (externalCancel(finding))
        return refuse('RECONCILIATION_ACTION_TAKEN', '이미 조치한 건입니다.')
      return { findingId, finding, errorCode: null, errorMessage: null }
    })
    return ok({ items })
  }),

  http.post(
    url(`${BASE}/findings/:findingId/external-cancel`),
    ({ params }) => {
      const finding = findFinding(String(params.findingId))
      if (!finding) {
        return fail(404, {
          code: 'RECONCILIATION_FINDING_NOT_FOUND',
          message: '불일치 건을 찾을 수 없습니다.',
        })
      }
      return externalCancel(finding) ?? ok(finding)
    },
  ),

  // 등록 재처리 — 접수만 하고 잠시 뒤 예약에 반영된다(실서버는 외부에 다시 보낸다).
  http.post(url(`${BASE}/findings/:findingId/reprocess`), ({ params }) => {
    const finding = findFinding(String(params.findingId))
    if (!finding) {
      return fail(404, {
        code: 'RECONCILIATION_FINDING_NOT_FOUND',
        message: '불일치 건을 찾을 수 없습니다.',
      })
    }
    if (finding.checkCode !== 'PENDING_BUT_MOCK_ACTIVE') return notAllowed()
    if (!stillOpen(finding)) return taken()
    const detail = reservationStore.find(
      (item) => item.preorderId === finding.targetKey,
    )
    const job = detail?.syncJobs.find(
      (item) => item.jobType === 'REGISTER' && item.status === 'DEAD_LETTER',
    )
    if (!detail || !job) {
      return fail(409, {
        code: 'SYNC_JOB_NOT_REPROCESSABLE',
        message: '이미 처리 중인 작업입니다. 다음 검사를 기다려 주세요.',
      })
    }
    markAction(finding, { actionStatus: 'REQUESTED', actionType: 'REPROCESS' })
    setTimeout(() => markReprocessed(detail, job), REPROCESS_DELAY_MS)
    return ok(finding, 202)
  }),

  // 우리 쪽 예약 취소 — 사유가 이력에 남는다.
  http.post(
    url(`${BASE}/findings/:findingId/cancel`),
    async ({ request, params }) => {
      const finding = findFinding(String(params.findingId))
      if (!finding) {
        return fail(404, {
          code: 'RECONCILIATION_FINDING_NOT_FOUND',
          message: '불일치 건을 찾을 수 없습니다.',
        })
      }
      if (!ADMIN_CANCEL_CODES.has(finding.checkCode)) return notAllowed()
      if (!stillOpen(finding)) return taken()
      const body = (await request
        .json()
        .catch(() => null)) as Partial<FindingCancelRequest> | null
      const reason = body?.reason?.trim()
      if (!reason || reason.length > 500) {
        return invalid([{ field: 'reason', message: '1~500자여야 합니다.' }])
      }
      const detail = reservationStore.find(
        (item) => item.preorderId === finding.targetKey,
      )
      if (detail) markCanceled(detail, reason)
      markAction(finding, {
        actionStatus: 'REQUESTED',
        actionType: 'ADMIN_CANCEL',
      })
      return ok(finding, 202)
    },
  ),
]
