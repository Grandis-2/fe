import type { ReactNode } from 'react'

import { useModalTitleId } from './ModalTitleIdContext'

export type ModalTitleProps = {
  className?: string
  children: ReactNode
}

// dialog의 접근 가능한 이름(aria-labelledby)이 되는 제목. Modal의 children 안에서만
// id를 받는다 — Modal을 호출하는 컴포넌트가 자기 렌더에서 훅을 부르면 값을 못 받으므로,
// 제목은 이 컴포넌트를 자식으로 렌더한다.
export function ModalTitle({ className, children }: ModalTitleProps) {
  const titleId = useModalTitleId()
  return (
    <div id={titleId} className={className}>
      {children}
    </div>
  )
}
