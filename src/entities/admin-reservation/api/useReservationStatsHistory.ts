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

// 표본은 화면이 아니라 QueryClient마다, 집계 키(전체·상품)마다 둔다 — 다른 관리자 화면에
// 다녀와도 그래프가 이어지고, 그동안 다른 화면(예약 현황·사이드 메뉴 배지)이 받은 집계도
// 표본으로 남는다. 새로 고치면 처음부터 모은다.
const stores = new WeakMap<QueryClient, Map<string, Store>>()
const watching = new WeakSet<QueryClient>()

function record(client: QueryClient, store: Store, productId?: string) {
  const state = client.getQueryState<PreorderStats>(
    reservationStatsKey(productId),
  )
  if (!state?.data || store.samples.at(-1)?.at === state.dataUpdatedAt) return
  store.samples = appendSample(store.samples, {
    at: state.dataUpdatedAt,
    value: state.data,
  })
  store.listeners.forEach((listener) => listener())
}

function storeOf(client: QueryClient, productId?: string) {
  const hash = hashKey(reservationStatsKey(productId))
  const byKey = stores.get(client) ?? new Map<string, Store>()
  stores.set(client, byKey)

  // 응답이 캐시에 들어올 때마다, 표본을 모으기로 한 키면 붙인다(QueryClient마다 한 번 구독).
  if (!watching.has(client)) {
    watching.add(client)
    client.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'success') return
      const store = byKey.get(event.query.queryHash)
      const [, , , key] = event.query.queryKey
      if (store)
        record(client, store, typeof key === 'string' ? key : undefined)
    })
  }

  const existing = byKey.get(hash)
  if (existing) return existing
  const store: Store = { samples: [], listeners: new Set() }
  byKey.set(hash, store)
  // 이미 받아 둔 값부터 넣는다.
  record(client, store, productId)
  return store
}

/**
 * 운영 현황 집계의 추이(받은 시각 순). productId를 주면 그 상품, 빼면 전체. 집계를 받는 건
 * 화면들의 useReservationStats가 하고, 이 훅은 받은 값을 쌓아 읽기만 한다 — 처리 흐름·
 * 회복 확인 그래프가 쓴다. 상품은 처음 고른 때부터 쌓인다.
 */
export function useReservationStatsHistory(
  productId?: string,
): readonly Sample<PreorderStats>[] {
  const store = storeOf(useQueryClient(), productId)
  return useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener)
      return () => store.listeners.delete(listener)
    },
    () => store.samples,
  )
}
