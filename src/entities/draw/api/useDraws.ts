import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { fetchAllPages, PAGE_SIZE_MAX } from '@shared/api/fetchAllPages'
import { pollingRetry, queryPolicy } from '@shared/api/queryPolicy'
import { useDeadline } from '@shared/lib/useDeadline'

import { getDrawPhase } from '../lib/drawSchedule'

import { enterDraw, getDraw, getDraws, getMyDrawEntry } from './draw'

import type { DrawEntry } from '../model/draw'

// 승인 결과를 기다리는 동안(AUTHORIZING) 내 응모를 다시 묻는다.
const AUTHORIZING_POLL_MS = 3_000
// 마감 뒤 추첨은 30초 뒤부터 서버가 한다 — 결과가 나올 때까지 30초 이상 간격으로 묻는다(명세).
const RESULT_POLL_MS = 30_000
// 응모비 승인은 최대 70초쯤 걸린다(명세).
const AUTHORIZING_LIMIT_MS = 70_000
// 결과는 마감부터 약 100초 안에 나온다 — 마감 직전 결제의 승인 최대 70초 + 다음 추첨 확인까지 30초(명세).
const RESULT_LIMIT_MS = 100_000

// 내 응모가 무엇을 기다리는지. 기다릴 게 없으면 null.
const entryWait = (entry: DrawEntry | null | undefined) => {
  if (entry?.status === 'AUTHORIZING')
    return { kind: 'payment', pollMs: AUTHORIZING_POLL_MS } as const
  return entry?.status === 'PAID' &&
    entry.result === null &&
    getDrawPhase(entry.draw) === 'CLOSED'
    ? ({ kind: 'result', pollMs: RESULT_POLL_MS } as const)
    : null
}

export const drawKeys = {
  all: ['draws'] as const,
  list: ['draws', 'list'] as const,
  detail: (drawId: string) => ['draws', 'detail', drawId] as const,
  entry: (drawId: string) => ['draws', 'entry', drawId] as const,
}

// 회차는 한 번 만들면 값이 바뀌지 않아 catalog 정책이다. 새 회차가 열리는 건 몇 분 늦어도 된다.
// 목록·상태별 건수가 전체 회차 기준이라 쪽을 끝까지 이어 받는다.
export const useDraws = () =>
  useQuery({
    queryKey: drawKeys.list,
    queryFn: async ({ signal }) => ({
      items: await fetchAllPages((page) =>
        getDraws({ page, size: PAGE_SIZE_MAX }, signal),
      ),
    }),
    ...queryPolicy.catalog,
  })

export const useDraw = (drawId: string) =>
  useQuery({
    queryKey: drawKeys.detail(drawId),
    queryFn: ({ signal }) => getDraw(drawId, signal),
    enabled: drawId !== '',
    ...queryPolicy.catalog,
  })

// 내 응모 — 응모 전이면 data가 null이다. 비로그인은 401이라 enabled로 끈다.
// 승인(AUTHORIZING)·추첨 결과를 기다리는 동안 다시 묻고, 실패하면 백오프한다. 승인은 70초,
// 결과는 마감부터 100초가 지나면 자동 조회를 끄고 timedOut으로 무엇을 못 받았는지 알린다.
export const useMyDrawEntry = (
  drawId: string,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const queryClient = useQueryClient()
  const queryKey = drawKeys.entry(drawId)
  const cached = () => queryClient.getQueryData<DrawEntry | null>(queryKey)
  const entry = cached()
  const wait = entryWait(entry)
  // 결과는 마감 시각부터, 승인은 기다리기 시작한 때부터 센다.
  const deadline = useDeadline(
    wait !== null,
    wait?.kind === 'result' ? RESULT_LIMIT_MS : AUTHORIZING_LIMIT_MS,
    wait?.kind === 'result' && entry
      ? Date.parse(entry.draw.closesAt)
      : undefined,
  )
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => getMyDrawEntry(drawId, signal),
    enabled: enabled && drawId !== '' && !deadline.passed,
    refetchInterval: ({ state: { data } }) => entryWait(data)?.pollMs ?? false,
    ...queryPolicy.live,
    ...pollingRetry(() => entryWait(cached())?.pollMs ?? null, {
      expired: () => deadline.passed,
    }),
  })
  return {
    ...query,
    // 제한이 지났고 마지막 요청도 끝났다 — 'payment'면 승인 결과를, 'result'면 추첨 결과를 못 받았다.
    timedOut:
      deadline.passed && query.fetchStatus === 'idle'
        ? (wait?.kind ?? null)
        : null,
    recheck: deadline.restart,
  }
}

// 내 응모 전체 — 명세에 "내 응모 목록" API가 없어 회차 목록에서 이미 열린 회차마다 내 응모를 묻는다(응모 전 404는 null).
// ponytail: 회차 수만큼 요청이 나간다 — 백엔드에 내 응모 목록이 생기면 그 한 번으로 바꾼다.
export const useMyDrawEntries = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  const draws = useDraws()
  const started =
    draws.data?.items.filter((it) => getDrawPhase(it) !== 'SCHEDULED') ?? []
  const entries = useQueries({
    queries: started.map(({ drawId }) => ({
      queryKey: drawKeys.entry(drawId),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getMyDrawEntry(drawId, signal),
      enabled,
      ...queryPolicy.live,
    })),
    combine: (results) => ({
      entries: results
        .flatMap(({ data }) => (data ? [data] : []))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      isPending: results.some(({ isPending }) => isPending),
      error: results.find(({ error }) => error)?.error ?? null,
    }),
  })
  return {
    ...entries,
    isPending: draws.isPending || entries.isPending,
    error: draws.error ?? entries.error,
  }
}

// 응모는 서버 확인 뒤 반영한다 — 응답(내 응모)으로 캐시를 바로 채워 응모 화면이 다시 묻지 않게 한다.
// 명령이라 자동 재시도하지 않는다(사용자가 다시 누른다).
export const useEnterDraw = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      drawId,
      ...body
    }: { drawId: string } & Parameters<typeof enterDraw>[1]) =>
      enterDraw(drawId, body),
    onSuccess: (entry) =>
      queryClient.setQueryData(drawKeys.entry(entry.drawId), entry),
  })
}
