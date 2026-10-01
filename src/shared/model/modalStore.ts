import type { ReactNode } from 'react'

import { createStore } from '@/shared/lib/createStore'

type ModalStore = {
  isOpen: boolean
  content: ReactNode
  open: (content: ReactNode) => void
  close: () => void
}

// 모달은 RootLayout에 하나만 띄워두고, 내용은 여는 쪽이 넘긴다 —
// open(<KakaoLoginModal />). 모달이 늘어나도 RootLayout은 그대로다.
// 한 번에 하나만 열린다(나중에 겹쳐 띄울 일이 생기면 스택으로 바꾼다).
export const useModalStore = createStore<ModalStore>((set) => ({
  isOpen: false,
  content: null,
  open: (content) => set({ isOpen: true, content }),
  // 닫을 때 content를 비우지 않는다 — 닫히는 애니메이션(220ms) 동안 내용이
  // 먼저 사라져서 빈 상자가 줄어드는 게 보인다. 다음 open이 어차피 덮어쓴다.
  close: () => set({ isOpen: false }),
}))
