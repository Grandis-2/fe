import { PREORDER_PATH } from '@shared/config/routes'

// ponytail: 인기 검색어·사전예약 목록 API가 아직 없어 고정 목록을 쓴다 — API가 생기면 응답으로 교체.
export const POPULAR_KEYWORDS = [
  '아이폰 18 Pro',
  '아이폰 Duo',
  '맥북 네오',
  '갤럭시 워치',
  '에어팟 프로 3',
  '아이패드 프로',
  '갤럭시 S26 울트라',
  '갤럭시 버즈4 프로',
  '맥북 에어 15',
  '갤럭시 탭 S11',
]

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
