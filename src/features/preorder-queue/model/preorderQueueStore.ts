import { createStore } from '@shared/lib/createStore'

// 대기열 한 번 — joinedAt이 key라 새로 줄 서면 PreorderQueue가 다시 마운트된다.
export type PreorderQueueTicket = {
  productName: string
  // 내 차례가 오면 이동할 경로.
  to: string
  joinedAt: number
}

type PreorderQueueStore = {
  ticket: PreorderQueueTicket | null
  join: (ticket: Omit<PreorderQueueTicket, 'joinedAt'>) => void
  clear: () => void
}

// 토스트와 같은 구조다 — PreorderQueue는 RootLayout에 하나만 두고, 줄 서는 쪽은
// joinPreorderQueue만 부른다. 페이지를 옮겨도 QueuePill이 남아 있다.
export const usePreorderQueueStore = createStore<PreorderQueueStore>((set) => ({
  ticket: null,
  join: (ticket) => set({ ticket: { ...ticket, joinedAt: Date.now() } }),
  clear: () => set({ ticket: null }),
}))

export const joinPreorderQueue = (
  ticket: Omit<PreorderQueueTicket, 'joinedAt'>,
) => usePreorderQueueStore.getState().join(ticket)
