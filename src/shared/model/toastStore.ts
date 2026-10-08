import { create } from 'zustand'

import type { ToastItem } from '@shared/ui'

type ToastStore = {
  toasts: ToastItem[]
  show: (message: string) => void
  dismiss: (id: number) => void
}

let nextId = 0

// 모달과 같은 구조다 — ToastViewport는 RootLayout에 하나만 두고, 띄우는 쪽은
// showToast('링크가 복사되었습니다!')만 부른다. 사라지는 시점은 각 토스트가 정한다.
export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  // 한 번에 하나만 띄운다. 연달아 부르면 쌓지 않고 새것으로 갈아 끼운다 —
  // id가 바뀌어 새 요소로 그려지므로 누를 때마다 등장 애니메이션이 다시 재생되고,
  // 사라지는 타이머도 처음부터 다시 돈다.
  show: (message) => set({ toasts: [{ id: (nextId += 1), message }] }),
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}))

export const showToast = (message: string) =>
  useToastStore.getState().show(message)
