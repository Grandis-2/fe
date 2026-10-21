import { useSyncExternalStore } from 'react'

import {
  hashKey,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import { appendSample, type Sample } from '@shared/lib/samples'

import { waitingroomStatusKey } from './useAdminWaitingroom'

import type { WaitingroomStatus } from '../model/types'

type Store = {
  samples: Sample<WaitingroomStatus>[]
  listeners: Set<() => void>
}

// 표본은 화면이 아니라 QueryClient마다 둔다 — 다른 관리자 화면(대기열 관리)에 다녀와도 그래프가
// 이어지고, 그동안 받은 현황도 표본으로 남는다. 새로 고치면 처음부터 모은다.
const stores = new WeakMap<QueryClient, Store>()

function record(client: QueryClient, store: Store) {
  const state = client.getQueryState<WaitingroomStatus>(waitingroomStatusKey)
  if (!state?.data) return
  // 현황 응답엔 센 시각이 없어 받은 시각으로 둔다. 같은 응답이면 넣지 않는다.
  if (store.samples.at(-1)?.at === state.dataUpdatedAt) return
  store.samples = appendSample(store.samples, {
    at: state.dataUpdatedAt,
    value: state.data,
  })
  store.listeners.forEach((listener) => listener())
}

function storeOf(client: QueryClient) {
  const existing = stores.get(client)
  if (existing) return existing
  const store: Store = { samples: [], listeners: new Set() }
  stores.set(client, store)
  const hash = hashKey(waitingroomStatusKey)
  client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') return
    if (event.query.queryHash === hash) record(client, store)
  })
  record(client, store)
  return store
}

/**
 * 대기열 현황의 추이(받은 시각 순). 현황을 받는 건 화면들의 useWaitingroomStatus가 하고, 이
 * 훅은 받은 값을 쌓아 읽기만 한다 — 운영 대시보드의 대기 인원 그래프가 쓴다.
 */
export function useWaitingroomStatusHistory(): readonly Sample<WaitingroomStatus>[] {
  const store = storeOf(useQueryClient())
  return useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener)
      return () => store.listeners.delete(listener)
    },
    () => store.samples,
  )
}
