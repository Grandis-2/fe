import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { OpenAlert } from '@shared/api/types'

import { getMyOpenAlerts, getOpenAlert, setOpenAlert } from './openAlert'

export const openAlertKeys = {
  all: ['openAlerts'] as const,
  mine: ['openAlerts', 'mine'] as const,
  detail: (productId: string) => ['openAlerts', 'detail', productId] as const,
}

// 오픈하면 목록에서 빠지고 다른 화면에서 신청·해제하므로 볼 때마다 새로 묻는다.
export const useMyOpenAlerts = () =>
  useQuery({
    queryKey: openAlertKeys.mine,
    queryFn: ({ signal }) => getMyOpenAlerts(signal),
    ...queryPolicy.live,
  })

// 회원 전용이라 비로그인이면 enabled로 끈다(401).
export const useOpenAlert = (productId: string, enabled = true) =>
  useQuery({
    queryKey: openAlertKeys.detail(productId),
    queryFn: ({ signal }) => getOpenAlert(productId, signal),
    enabled: enabled && productId !== '',
    select: ({ subscribed }) => subscribed,
    ...queryPolicy.live,
  })

// 여러 모델의 신청 여부를 한 번에 — 신청한 모델 id만 모은다. 모델마다 useOpenAlert와 같은
// 캐시를 써서 토글의 낙관적 반영이 바로 보인다.
export const useSubscribedOpenAlerts = (productIds: string[], enabled = true) =>
  useQueries({
    queries: productIds.map((productId) => ({
      queryKey: openAlertKeys.detail(productId),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getOpenAlert(productId, signal),
      enabled,
      ...queryPolicy.live,
    })),
    combine: (results) =>
      new Set(
        results.flatMap((result, index) =>
          result.data?.subscribed ? [productIds[index]] : [],
        ),
      ),
  })

// 토글이라 낙관적으로 반영하고 실패하면 되돌린다. 빠르게 여러 번 눌러도 신청·해제가 보낸 순서대로
// 끝나게 같은 scope로 줄 세운다.
// 목록은 보고 있는 동안 다시 받지 않는다 — 끈 알림도 다시 켤 수 있게 화면에 남아 있어야 한다.
export const useToggleOpenAlert = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setOpenAlert,
    scope: { id: 'open-alert' },
    onMutate: async (next: OpenAlert) => {
      const queryKey = openAlertKeys.detail(next.productId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<OpenAlert>(queryKey)
      queryClient.setQueryData<OpenAlert>(queryKey, next)
      return { previous }
    },
    onError: (_error, { productId }, context) =>
      queryClient.setQueryData(
        openAlertKeys.detail(productId),
        context?.previous,
      ),
    onSettled: (_data, _error, { productId }) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: openAlertKeys.detail(productId),
        }),
        queryClient.invalidateQueries({
          queryKey: openAlertKeys.mine,
          refetchType: 'none',
        }),
      ]),
  })
}
