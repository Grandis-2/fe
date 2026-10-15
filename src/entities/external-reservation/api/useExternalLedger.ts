import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getExternalLedger } from './externalLedger'

/**
 * 외부 원장 전체. 전부 넘겨 받아야 해서 무겁다 — 화면에 처음 들어올 때 한 번만 받고,
 * 그 뒤엔 '대조 실행'의 refetch로만 다시 받는다.
 */
export const useExternalLedger = () =>
  useQuery({
    queryKey: ['admin', 'external-ledger'] as const,
    queryFn: ({ signal }) => getExternalLedger(signal),
    ...queryPolicy.snapshot,
  })
