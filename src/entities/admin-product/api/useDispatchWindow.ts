import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { DispatchWindowPutRequest } from '@shared/api/types'

import { getDispatchWindow, putDispatchWindow } from './adminDispatch'
import { adminDispatchWindowKey } from './keys'

// 다른 관리자가 바꿀 수 있는 값이라 다시 볼 때마다 새로 묻는다.
export const useDispatchWindow = (productId: string) =>
  useQuery({
    queryKey: adminDispatchWindowKey(productId),
    queryFn: ({ signal }) => getDispatchWindow(productId, signal),
    ...queryPolicy.live,
  })

// 덮어쓰기 응답이 곧 최신 구성이라, 다시 조회하지 않고 캐시를 바로 바꾼다.
export const useSaveDispatchWindow = (productId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: DispatchWindowPutRequest) =>
      putDispatchWindow(productId, body),
    onSuccess: (saved) =>
      queryClient.setQueryData(adminDispatchWindowKey(productId), saved),
  })
}
