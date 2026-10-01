import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getDefaultAddress, putDefaultAddress } from './defaultAddress'

const queryKey = ['address', 'default'] as const

// 비로그인이면 401로 실패한다 — 다시 물어도 같으니 재시도하지 않고 data는 비워 둔다.
export const useDefaultAddress = () =>
  useQuery({ queryKey, queryFn: getDefaultAddress, retry: false })

// 저장 응답으로 캐시를 바로 갱신한다 — 같은 값을 보는 화면(마이페이지, 결제)이 다시 조회하지 않아도 된다.
export const useSaveDefaultAddress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: putDefaultAddress,
    onSuccess: (saved) => queryClient.setQueryData(queryKey, saved),
  })
}
