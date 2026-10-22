import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { pollEvery, queryPolicy } from '@shared/api/queryPolicy'
import type {
  AdmissionRateView,
  WaitingroomStatusView,
} from '@shared/api/types'
import type { RefreshInterval } from '@shared/config/refreshInterval'

import {
  clearMaxWait,
  getAdmissionRates,
  getWaitingroomStatus,
  resetGlobalCredit,
  resetLeaveGrace,
  resetProductCap,
  setGlobalCredit,
  setLeaveGrace,
  setMaxWait,
  setProductCap,
} from './adminWaitingroom'

import type { WaitingroomStatus } from '../model/types'

const WAITINGROOM_KEY = ['admin', 'waitingroom'] as const

/**
 * 운영값이 없는 상품은 상한이 null로 온다. 기본 상한의 숫자는 응답에 없어 여기서 채우지 않는다
 * (채우면 서버 기본값과 어긋난 숫자를 화면이 말한다). 화면은 null을 "서버 기본값"으로 읽는다.
 */
const toWaitingroomStatus = (view: WaitingroomStatusView): WaitingroomStatus =>
  view
const RATES_KEY = [...WAITINGROOM_KEY, 'rates'] as const
// 서버 안내: 1초보다 자주 묻지 않는다.
const MIN_POLL_MS = 1_000

export const waitingroomStatusKey = [...WAITINGROOM_KEY, 'status'] as const

/** 대기열 현황. 간격은 화면이 고르되 1초보다 짧게는 묻지 않는다 */
export const useWaitingroomStatus = (intervalMs: RefreshInterval) => {
  const queryClient = useQueryClient()
  const queryKey = waitingroomStatusKey
  return useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      getWaitingroomStatus(signal).then(toWaitingroomStatus),
    ...queryPolicy.live,
    ...pollEvery(
      queryClient,
      queryKey,
      intervalMs === false ? false : Math.max(intervalMs, MIN_POLL_MS),
    ),
  })
}

export const useAdmissionRates = () =>
  useQuery({
    queryKey: RATES_KEY,
    queryFn: ({ signal }) => getAdmissionRates(signal),
    ...queryPolicy.live,
  })

export type AdmissionRateChange =
  | {
      kind: 'globalCredit'
      value: number | null
      /** 주면 이 상품들의 상한도 같은 값으로 맞춘다(null이면 기본값으로) */
      productIds?: readonly string[]
    }
  | { kind: 'maxWait'; value: number | null }
  | { kind: 'leaveGrace'; value: number | null }
  | { kind: 'productCap'; productId: string; value: number | null }

// value가 null이면 기본값으로 되돌린다(최대 대기 시간은 제한 해제).
const applyChange = async (change: AdmissionRateChange) => {
  switch (change.kind) {
    case 'globalCredit': {
      const { value } = change
      let view = await (value === null
        ? resetGlobalCredit()
        : setGlobalCredit(value))
      // 상품 상한은 한 건씩 바꾼다 — 응답마다 바뀐 뒤의 전체 운영값이라 마지막 것이 최신이다.
      for (const productId of change.productIds ?? [])
        view = await (value === null
          ? resetProductCap(productId)
          : setProductCap(productId, value))
      return view
    }
    case 'maxWait':
      return change.value === null ? clearMaxWait() : setMaxWait(change.value)
    case 'leaveGrace':
      return change.value === null
        ? resetLeaveGrace()
        : setLeaveGrace(change.value)
    case 'productCap':
      return change.value === null
        ? resetProductCap(change.productId)
        : setProductCap(change.productId, change.value)
  }
}

/**
 * 운영값 하나를 바꾸거나 기본값으로 되돌린다. 응답이 바뀐 뒤의 전체 운영값이라 그대로
 * 캐시에 넣고, 현황(실제 적용 값)은 다시 받는다.
 */
export const useChangeAdmissionRate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applyChange,
    onSuccess: (view: AdmissionRateView) => {
      queryClient.setQueryData(RATES_KEY, view)
    },
    // 여러 건을 바꾸다 중간에 실패하면 일부만 바뀌어 있다 — 성공·실패 모두 운영값과 현황을
    // 다시 받는다.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: WAITINGROOM_KEY }),
  })
}
