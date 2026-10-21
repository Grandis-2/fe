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
  if (!state?.data) return
  // 서버가 센 시각(countedAt)으로 둔다 — 받은 시각을 쓰면 응답이 늦거나 서버 캐시(최대 5초)가
  // 같은 집계를 다시 주는 동안에도 간격이 생겨 속도가 흔들린다. 같은 집계면 넣지 않는다.
  const at = Date.parse(state.data.countedAt) || state.dataUpdatedAt
  if (store.samples.at(-1)?.at === at) return
  store.samples = appendSample(store.samples, { at, value: state.data })
  store.listeners.forEach((listener) => listener())
}

/** 그 키의 기록 — 없으면 만들고, 이미 받아 둔 값부터 넣는다 */
function ensureStore(
  client: QueryClient,
  byKey: Map<string, Store>,
  productId?: string,
) {
  const hash = hashKey(reservationStatsKey(productId))
  const existing = byKey.get(hash)
  if (existing) return existing
  const store: Store = { samples: [], listeners: new Set() }
  byKey.set(hash, store)
  record(client, store, productId)
  return store
}

function storeOf(client: QueryClient, productId?: string) {
  const byKey = stores.get(client) ?? new Map<string, Store>()
  stores.set(client, byKey)

  // 집계 응답(전체·상품 모두)이 캐시에 들어올 때마다 붙인다(QueryClient마다 한 번 구독).
  // 상품은 고르기 전부터 쌓아 둬야 골랐을 때 그래프가 바로 이어진다.
  if (!watching.has(client)) {
    watching.add(client)
    client.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'success') return
      const [, , kind, key] = event.query.queryKey
      if (kind !== 'stats') return
      const productId = typeof key === 'string' ? key : undefined
      if (event.query.queryHash !== hashKey(reservationStatsKey(productId)))
        return
      record(client, ensureStore(client, byKey, productId), productId)
    })
  }

  return ensureStore(client, byKey, productId)
}

/**
 * 운영 현황 집계의 추이(받은 시각 순). productId를 주면 그 상품, 빼면 전체. 집계를 받는 건
 * 화면들의 useReservationStats가 하고, 이 훅은 받은 값을 쌓아 읽기만 한다 — 운영 대시보드의
 * 접수·처리 속도 그래프가 쓴다. 상품은 처음 고른 때부터 쌓인다.
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

/**
 * 여러 상품의 기록을 한 번에(productIds 순서대로) — 진행 중인 사전예약처럼 개수가 바뀌는
 * 묶음의 추이를 합칠 때 쓴다. 상품은 처음 넘긴 때부터 쌓인다.
 */
export function useReservationStatsHistories(
  productIds: readonly string[],
): readonly (readonly Sample<PreorderStats>[])[] {
  const client = useQueryClient()
  const stores = productIds.map((productId) => storeOf(client, productId))
  // 스냅샷은 값 하나여야 해서 기록마다 마지막 표본 시각을 이어 붙인다 — 새 표본이 오면 바뀐다.
  useSyncExternalStore(
    (listener) => {
      stores.forEach((store) => store.listeners.add(listener))
      return () => stores.forEach((store) => store.listeners.delete(listener))
    },
    () => stores.map((store) => store.samples.at(-1)?.at ?? '').join(),
  )
  return stores.map((store) => store.samples)
}
