import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { hasExternalLedgerRows } from './externalLedger'

/**
 * 외부 원장에 기록이 남아 있는지(1건만 받는다). 원장 초기화(useResetMockLedger)가 같은
 * 접두사 키를 지워 다시 묻는다.
 */
export const useExternalLedgerHasRows = () =>
  useQuery({
    queryKey: ['admin', 'external-ledger', 'has-rows'] as const,
    queryFn: ({ signal }) => hasExternalLedgerRows(signal),
    ...queryPolicy.live,
  })
