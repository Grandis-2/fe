import { create } from 'zustand'

import { showToast } from '@shared/model/toastStore'

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

// 입장권은 탭별 sessionStorage에도 둔다 — 새로고침해도 줄을 다시 서지 않고, 응답을 못 받은 접수를
// 같은 입장권·같은 키로 다시 보내 중복 예약을 막는다. 만료 여부는 쓰는 쪽(usePreorderSubmit)이 본다.
const ADMISSION_KEY = 'preorder_admission'

const loadAdmission = (): PreorderAdmission | null => {
  try {
    return JSON.parse(
      sessionStorage.getItem(ADMISSION_KEY) ?? 'null',
    ) as PreorderAdmission | null
  } catch {
    return null
  }
}

// 저장소를 못 쓰면 메모리 값만 남는다(새로고침 전까지는 그대로 쓴다).
const saveAdmission = (admission: PreorderAdmission | null) => {
  try {
    if (admission)
      sessionStorage.setItem(ADMISSION_KEY, JSON.stringify(admission))
    else sessionStorage.removeItem(ADMISSION_KEY)
  } catch {
    // 메모리 값은 남는다.
  }
}

// 토스트와 같은 구조다 — PreorderQueue는 RootLayout에 하나만 두고, 줄 서는 쪽은
// joinPreorderQueue만 부른다. 페이지를 옮겨도 QueuePill이 남아 있다.
export const usePreorderQueueStore = create<PreorderQueueStore>()((set) => ({
  ticket: null,
  admission: loadAdmission(),
  join: (ticket) => set({ ticket: { ...ticket, joinedAt: Date.now() } }),
  clear: () => set({ ticket: null }),
  admit: (admission) => {
    saveAdmission(admission)
    set({ admission })
  },
  clearAdmission: () => {
    saveAdmission(null)
    set({ admission: null })
  },
}))

// 줄은 한 번에 하나다 — 이미 서 있는 줄(입장 직전 포함)이 있으면 바꾸지 않는다. 바꾸면 기존 대기가
// 끊기고, 막 받은 입장권도 저장되지 못한다. 나가기를 누르면 줄이 비워져 다른 상품에 설 수 있다.
export const joinPreorderQueue = (
  ticket: Omit<PreorderQueueTicket, 'joinedAt'>,
) => {
  const current = usePreorderQueueStore.getState().ticket
  if (current) {
    showToast(
      `'${current.productName}' 대기열에 서 있어요. 끝나거나 나간 뒤 다시 눌러 주세요.`,
    )
    return
  }
  usePreorderQueueStore.getState().join(ticket)
}
