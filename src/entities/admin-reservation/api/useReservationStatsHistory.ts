import { useSyncExternalStore } from 'react'

import {
  hashKey,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import type { PreorderStats } from '@shared/api/types'
import { appendSample, type Sample } from '@shared/lib/samples'

import { reservationStatsKey } from './useAdminReservations'

type Store = {
  samples: Sample<PreorderStats>[]
  listeners: Set<() => void>
}

// 표본은 화면이 아니라 QueryClient마다 둔다 — 다른 관리자 화면에 다녀와도 그래프가 이어지고,
// 그동안 다른 화면(예약 현황·사이드 메뉴 배지)이 받은 집계도 표본으로 남는다.
// 새로 고치면 처음부터 모은다.
const stores = new WeakMap<QueryClient, Store>()
const TOTAL_KEY = reservationStatsKey()
const TOTAL_HASH = hashKey(TOTAL_KEY)

function storeOf(client: QueryClient) {
  const existing = stores.get(client)
  if (existing) return existing

  const store: Store = { samples: [], listeners: new Set() }
  stores.set(client, store)
  const record = () => {
    const state = client.getQueryState<PreorderStats>(TOTAL_KEY)
    if (!state?.data || store.samples.at(-1)?.at === state.dataUpdatedAt) return
    store.samples = appendSample(store.samples, {
      at: state.dataUpdatedAt,
      value: state.data,
    })
    store.listeners.forEach((listener) => listener())
  }
  // 이미 받아 둔 값부터 넣고, 그 뒤로는 응답이 캐시에 들어올 때마다 붙인다.
  record()
  client.getQueryCache().subscribe((event) => {
    if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.query.queryHash === TOTAL_HASH
    ) {
      record()
    }
  })
  return store
}

/**
 * 전체 운영 현황 집계의 추이(받은 시각 순). 집계를 받는 건 화면들의 useReservationStats가
 * 하고, 이 훅은 받은 값을 쌓아 읽기만 한다 — 처리 흐름·회복 확인 그래프가 쓴다.
 */
export function useReservationStatsHistory(): readonly Sample<PreorderStats>[] {
  const store = storeOf(useQueryClient())
  return useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener)
      return () => store.listeners.delete(listener)
    },
    () => store.samples,
  )
}
