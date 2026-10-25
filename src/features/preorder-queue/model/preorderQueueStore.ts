import { create } from 'zustand'

import { showToast } from '@shared/model/toastStore'

// 대기열 한 번 — joinedAt이 key라 새로 줄 서면 PreorderQueue가 다시 마운트된다.
export type PreorderQueueTicket = {
  productId: string
  productName: string
  // 내 차례가 오면 이동할 경로.
  to: string
  joinedAt: number
  // 새로고침 뒤 저장해 둔 줄로 다시 띄웠다 — 이때만 '자리 그대로' 안내를 보인다.
  restored?: boolean
}

// 차례가 와서 받은 입장권. 접수(사전예약하기)에 한 번 쓴다.
export type PreorderAdmission = {
  productId: string
  admissionTicket: string
  // 입장권 하나에 접수 키 하나 — 입장권에서 계산한다(admissionKey). 응답을 못 받아 다시 누르거나, 같은 입장권을
  // 다시 받은 창(다른 창, 결제 화면에서 나갔다 다시 예약)이 접수해도 같은 키라 기존 예약을 돌려받는다.
  idempotencyKey: string
  // 이 시각(ms)이 지나면 새 접수에 쓸 수 없다.
  expiresAt: number
}

// 입장권이 끝나기 직전에 누르면 요청이 가는 사이 만료돼 ADMISSION_TICKET_STALE로 거절된다 — 이만큼 앞당겨
// 끝난 것으로 본다. 상세의 남은 시간(AdmissionTimer)과 접수 전 확인(usePreorderSubmit)이 같이 쓴다.
const SUBMIT_MARGIN_MS = 5_000
export const admissionUsableUntil = ({ expiresAt }: PreorderAdmission) =>
  expiresAt - SUBMIT_MARGIN_MS

type PreorderQueueStore = {
  ticket: PreorderQueueTicket | null
  // 서 있는 줄의 상품을 다시 누른 시각 — 닫아 둔 대기열 창을 다시 연다(PreorderQueue가 지켜본다).
  reopenedAt: number | null
  admission: PreorderAdmission | null
  join: (ticket: Omit<PreorderQueueTicket, 'joinedAt'>) => void
  reopen: () => void
  clear: () => void
  admit: (admission: PreorderAdmission) => void
  clearAdmission: () => void
}

// 입장권은 탭별 sessionStorage에도 둔다 — 새로고침해도 줄을 다시 서지 않고, 응답을 못 받은 접수를
// 같은 입장권·같은 키로 다시 보내 중복 예약을 막는다. 만료 여부는 쓰는 쪽(usePreorderSubmit)이 본다.
const ADMISSION_KEY = 'preorder_admission'
// 서 있는 줄도 둔다 — 새로고침하면 RootLayout이 대기열을 다시 띄우고, 다시 진입하면 서버가 지켜 둔
// 자리(약 250초)를 rejoined로 돌려준다.
const TICKET_KEY = 'preorder_queue_ticket'

const load = <T>(key: string): T | null => {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? 'null') as T | null
  } catch {
    return null
  }
}

// 저장소를 못 쓰면 메모리 값만 남는다(새로고침 전까지는 그대로 쓴다).
const save = (key: string, value: unknown) => {
  try {
    if (value) sessionStorage.setItem(key, JSON.stringify(value))
    else sessionStorage.removeItem(key)
  } catch {
    // 메모리 값은 남는다.
  }
}

const restoreTicket = (): PreorderQueueTicket | null => {
  const ticket = load<PreorderQueueTicket>(TICKET_KEY)
  return ticket && { ...ticket, restored: true }
}

// 토스트와 같은 구조다 — PreorderQueue는 RootLayout에 하나만 두고, 줄 서는 쪽은
// joinPreorderQueue만 부른다. 페이지를 옮겨도 QueuePill이 남아 있다.
export const usePreorderQueueStore = create<PreorderQueueStore>()((set) => ({
  ticket: restoreTicket(),
  reopenedAt: null,
  admission: load<PreorderAdmission>(ADMISSION_KEY),
  join: (ticket) => {
    const next = { ...ticket, joinedAt: Date.now() }
    save(TICKET_KEY, next)
    set({ ticket: next })
  },
  reopen: () => set({ reopenedAt: Date.now() }),
  clear: () => {
    save(TICKET_KEY, null)
    set({ ticket: null })
  },
  admit: (admission) => {
    save(ADMISSION_KEY, admission)
    set({ admission })
  },
  clearAdmission: () => {
    save(ADMISSION_KEY, null)
    set({ admission: null })
  },
}))

// 줄은 한 번에 하나다 — 다른 상품의 줄(입장 직전 포함)이 있으면 바꾸지 않는다. 바꾸면 기존 대기가
// 끊기고, 막 받은 입장권도 저장되지 못한다. 나가기를 누르면 줄이 비워져 다른 상품에 설 수 있다.
export const joinPreorderQueue = (
  ticket: Omit<PreorderQueueTicket, 'joinedAt'>,
) => {
  const { ticket: current, reopen } = usePreorderQueueStore.getState()
  // 같은 상품이면 줄을 다시 서지 않고 닫아 둔 대기열 창만 다시 연다.
  if (current?.productId === ticket.productId) {
    reopen()
    return
  }
  if (current) {
    showToast(
      `'${current.productName}' 대기열에 서 있어요. 끝나거나 나간 뒤 다시 눌러 주세요.`,
    )
    return
  }
  usePreorderQueueStore.getState().join(ticket)
}
