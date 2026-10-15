import type { ExternalLedgerRow } from '@shared/api/types'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
export type ExternalReservation = ExternalLedgerRow

export const externalStatusLabel: Record<
  ExternalReservation['status'],
  string
> = {
  ACTIVE: '등록됨',
  CANCELED: '취소됨',
}
