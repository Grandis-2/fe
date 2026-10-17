import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import {
  getMockConfig,
  injectMockFault,
  resetMockLedger,
  updateMockConfig,
} from './externalMock'

const CONFIG_KEY = ['admin', 'external-mock', 'config'] as const
const LEDGER_KEY = ['admin', 'external-ledger'] as const

/** Mock 설정. 다른 사람이 바꿀 수 있어 화면에 올 때마다 새로 묻는다 */
export const useMockConfig = () =>
  useQuery({
    queryKey: CONFIG_KEY,
    queryFn: ({ signal }) => getMockConfig(signal),
    ...queryPolicy.live,
  })

/** 응답이 실제 적용값이라 그대로 캐시에 넣는다 */
export const useUpdateMockConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMockConfig,
    onSuccess: (config) => queryClient.setQueryData(CONFIG_KEY, config),
  })
}

/** 지운 뒤에는 받아 둔 원장(대조 결과)이 틀린 값이 되니 버린다 */
export const useResetMockLedger = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resetMockLedger,
    onSuccess: () => queryClient.removeQueries({ queryKey: LEDGER_KEY }),
  })
}

export const useInjectMockFault = () =>
  useMutation({ mutationFn: injectMockFault })
