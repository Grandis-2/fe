import { createContext, useContext } from 'react'

// dialog에 접근 가능한 이름을 붙이려면 제목 요소의 id가 필요한데, 제목은 Modal이
// 아니라 내용(children)이 갖고 있다 — Modal이 id를 만들어 내려주면 내용 쪽에서
// 자기 제목 요소에 붙인다.
export const ModalTitleIdContext = createContext<string | undefined>(undefined)

export function useModalTitleId() {
  return useContext(ModalTitleIdContext)
}
