import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { pollEvery, pollingSignal, queryPolicy } from '@shared/api/queryPolicy'
import type { AdmissionRateView } from '@shared/api/types'
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

const WAITINGROOM_KEY = ['admin', 'waitingroom'] as const
const RATES_KEY = [...WAITINGROOM_KEY, 'rates'] as const
// 서버 안내: 1초보다 자주 묻지 않는다.
const MIN_POLL_MS = 1_000

/** 대기열 현황. 간격은 화면이 고르되 1초보다 짧게는 묻지 않는다 */
export const useWaitingroomStatus = (intervalMs: RefreshInterval) => {
  const queryClient = useQueryClient()
  const queryKey = [...WAITINGROOM_KEY, 'status'] as const
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getWaitingroomStatus(pollingSignal(signal)),
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
  | { kind: 'globalCredit'; value: number | null }
  | { kind: 'maxWait'; value: number | null }
  | { kind: 'leaveGrace'; value: number | null }
  | { kind: 'productCap'; productId: string; value: number | null }

// value가 null이면 기본값으로 되돌린다(최대 대기 시간은 제한 해제).
const applyChange = (change: AdmissionRateChange) => {
  switch (change.kind) {
    case 'globalCredit':
      return change.value === null
        ? resetGlobalCredit()
        : setGlobalCredit(change.value)
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
      return queryClient.invalidateQueries({
        queryKey: [...WAITINGROOM_KEY, 'status'],
      })
    },
  })
}
