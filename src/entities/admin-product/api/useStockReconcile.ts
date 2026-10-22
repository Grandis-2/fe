import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiRequestError } from '@shared/api/client'
import { queryPolicy } from '@shared/api/queryPolicy'

import { correctStockOption, getLatestStockReconcileRun } from './adminStock'
import { adminProductStockKey, stockReconcileRunKey } from './keys'

/**
 * 마지막 장부 대조에서 이 상품의 어긋난 옵션 중 아직 보정하지 않은 것(options)과, 대조
 * 결과가 잘렸는지(truncated). 대조가 한 번도 끝나지 않았으면(404) 빈 목록이다 — 알릴 게
 * 없는 것과 같다.
 *
 * ponytail: 전체 결과(최대 1000개)를 받아 상품으로 거른다. 상품별 조회가 생기면 바꾼다.
 */
export const useStockDrifts = (productId: string) =>
  useQuery({
    queryKey: stockReconcileRunKey,
    queryFn: ({ signal }) =>
      getLatestStockReconcileRun(signal).catch((caught: unknown) => {
        if (caught instanceof ApiRequestError && caught.status === 404) {
          return null
        }
        throw caught
      }),
    select: (run) => ({
      options: (run?.options ?? []).filter(
        (option) => option.productId === productId && !option.correctedAt,
      ),
      // 어긋난 옵션이 1000개를 넘으면 앞 1000개만 와서, 이 상품의 어긋남이 빠졌을 수 있다.
      truncated: run?.truncated ?? false,
      // 실패한 대조는 남지 않아 이 시각은 마지막으로 끝난 대조의 것이다(옛 결과일 수 있다).
      finishedAt: run?.finishedAt ?? null,
    }),
    ...queryPolicy.live,
  })

/**
 * 옵션 하나를 주문 기준으로 보정한다. 보정하면 재고 장부와 대조 결과(correctedAt)가
 * 함께 바뀌어 둘 다 다시 받는다. 두 번 눌러도 서버가 changed false로 끝낸다.
 */
export const useCorrectStockOption = (productId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ optionId, reason }: { optionId: string; reason: string }) =>
      correctStockOption(productId, optionId, { reason }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminProductStockKey(productId),
        }),
        queryClient.invalidateQueries({ queryKey: stockReconcileRunKey }),
      ]),
  })
}
