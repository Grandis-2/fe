import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getExternalLedger } from './externalLedger'

/**
 * 외부 원장 전체. 전부 넘겨 받아야 해서 무겁다 — 한 번 받으면 refetch로만 다시 받는다.
 * enabled가 false면 들어와도 받지 않고 refetch(대조 실행)로만 받는다.
 */
export const useExternalLedger = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['admin', 'external-ledger'] as const,
    queryFn: ({ signal }) => getExternalLedger(signal),
    enabled,
    ...queryPolicy.snapshot,
  })
