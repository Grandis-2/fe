import { createStore } from '@shared/lib/createStore'

// 대기열 한 번 — joinedAt이 key라 새로 줄 서면 PreorderQueue가 다시 마운트된다.
export type PreorderQueueTicket = {
  productId: string
  productName: string
  // 내 차례가 오면 이동할 경로.
  to: string
  joinedAt: number
}

// 차례가 와서 받은 입장권. 접수(사전예약하기)에 한 번 쓴다.
export type PreorderAdmission = {
  productId: string
  admissionTicket: string
  // 입장권 하나에 접수 키 하나 — 응답을 못 받아 다시 누르면 같은 키로 보내 중복 예약을 막는다.
  idempotencyKey: string
  // 이 시각(ms)이 지나면 새 접수에 쓸 수 없다.
  expiresAt: number
}

type PreorderQueueStore = {
  ticket: PreorderQueueTicket | null
  admission: PreorderAdmission | null
  join: (ticket: Omit<PreorderQueueTicket, 'joinedAt'>) => void
  clear: () => void
  admit: (admission: PreorderAdmission) => void
  clearAdmission: () => void
}

// 토스트와 같은 구조다 — PreorderQueue는 RootLayout에 하나만 두고, 줄 서는 쪽은
// joinPreorderQueue만 부른다. 페이지를 옮겨도 QueuePill이 남아 있다.
export const usePreorderQueueStore = createStore<PreorderQueueStore>((set) => ({
  ticket: null,
  admission: null,
  join: (ticket) => set({ ticket: { ...ticket, joinedAt: Date.now() } }),
  clear: () => set({ ticket: null }),
  admit: (admission) => set({ admission }),
  clearAdmission: () => set({ admission: null }),
}))

export const joinPreorderQueue = (
  ticket: Omit<PreorderQueueTicket, 'joinedAt'>,
) => usePreorderQueueStore.getState().join(ticket)
