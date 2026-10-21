import { PREORDER_PATH } from '@shared/config/routes'

// ponytail: 사전예약 목록 API가 아직 없어 고정 목록을 쓴다 — API가 생기면 응답으로 교체.
export type PreorderStatus = 'open' | 'upcoming'

export const ONGOING_PREORDERS: {
  title: string
  status: PreorderStatus
  to: string
}[] = [
  {
    title: '아이폰 18 Pro, Pro Max 사전예약',
    status: 'open',
    to: PREORDER_PATH,
  },
  { title: '아이폰 Duo 사전예약', status: 'upcoming', to: PREORDER_PATH },
]
