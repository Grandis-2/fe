import { create } from 'zustand'

import type { ModalProps } from '@shared/ui'

// 여는 쪽이 넘기는 건 Modal props에서 열림 상태만 뺀 것 — 제목·버튼·내용(children)을 다 넘긴다.
export type ModalContent = Omit<ModalProps, 'open' | 'onClose'>

type ModalStore = {
  isOpen: boolean
  content: ModalContent | null
  // 열 때마다 바뀐다 — RootLayout이 key로 써서 열 때마다 내용의 상태(입력값 등)를 새로 시작한다.
  openCount: number
  open: (content: ModalContent) => void
  close: () => void
}

// 모달은 RootLayout에 하나만 띄워두고, 내용은 여는 쪽이 넘긴다.
// 한 번에 하나만 열린다 — 새로 열면 지금 것을 갈아 끼운다.
// 대기열(preorder-queue)은 예외다: 모달을 닫아도 계속 도는 과정이라 자기 Modal을 따로 띄운다.
export const useModalStore = create<ModalStore>()((set) => ({
  isOpen: false,
  content: null,
  openCount: 0,
  open: (content) =>
    set((state) => ({
      isOpen: true,
      content,
      openCount: state.openCount + 1,
    })),
  // 닫을 때 content를 비우지 않는다 — 닫히는 애니메이션(220ms) 동안 내용이
  // 먼저 사라져서 빈 상자가 줄어드는 게 보인다. 다음 open이 어차피 덮어쓴다.
  close: () => set({ isOpen: false }),
}))

export const openModal = (content: ModalContent) =>
  useModalStore.getState().open(content)

export const closeModal = () => useModalStore.getState().close()
