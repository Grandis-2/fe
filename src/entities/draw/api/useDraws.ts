import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getDrawPhase } from '../lib/drawSchedule'

import { enterDraw, getDraw, getDraws, getMyDrawEntry } from './draw'

// 승인 결과를 기다리는 동안(AUTHORIZING) 내 응모를 다시 묻는다.
const AUTHORIZING_POLL_MS = 3_000
// 마감 뒤 추첨은 30초 뒤부터 서버가 한다 — 결과가 나올 때까지 30초 이상 간격으로 묻는다(명세).
const RESULT_POLL_MS = 30_000
// ponytail: 목록은 첫 쪽(최대 20건)만 받는다 — 회차가 그보다 늘면 page를 이어 받는 훅으로 바꾼다.
const FIRST_PAGE = { size: 20 }

export const drawKeys = {
  all: ['draws'] as const,
  list: ['draws', 'list'] as const,
  detail: (drawId: string) => ['draws', 'detail', drawId] as const,
  entry: (drawId: string) => ['draws', 'entry', drawId] as const,
}

// 회차는 한 번 만들면 값이 바뀌지 않아 catalog 정책이다. 새 회차가 열리는 건 몇 분 늦어도 된다.
export const useDraws = () =>
  useQuery({
    queryKey: drawKeys.list,
    queryFn: ({ signal }) => getDraws(FIRST_PAGE, signal),
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
export const useMyDrawEntry = (
  drawId: string,
  { enabled = true }: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: drawKeys.entry(drawId),
    queryFn: ({ signal }) => getMyDrawEntry(drawId, signal),
    enabled: enabled && drawId !== '',
    refetchInterval: ({ state: { data } }) => {
      if (data?.status === 'AUTHORIZING') return AUTHORIZING_POLL_MS
      return data?.status === 'PAID' &&
        data.result === null &&
        getDrawPhase(data.draw) === 'CLOSED'
        ? RESULT_POLL_MS
        : false
    },
    ...queryPolicy.live,
  })

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
