import { useEffect, useId, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { X } from 'lucide-react'

import * as styles from './Modal.css'
import { ModalTitleIdContext } from './ModalTitleIdContext'

export type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  // 인라인이라 기본값(0)을 항상 이긴다 — 예: padding={spacing[24]}
  padding?: CSSProperties['padding']
}

export function Modal({ open, onClose, children, padding }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  // <dialog>는 항상 마운트해 두고 열림/닫힘은 showModal()/close()로만 바꾼다.
  // CSS의 [open] + @starting-style + allow-discrete가 여닫는 애니메이션을 맡는데,
  // React가 open=false일 때 노드를 통째로 떼어내 버리면 닫히는 애니메이션이 재생될
  // 기회 자체가 없다(트랜지션 도중 언마운트되면 그대로 끊긴다).
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      style={{ padding }}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // dialog 엘리먼트 자체가 클릭됐다면 콘텐츠(자식) 바깥, 즉 backdrop 클릭이다.
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <button
        type="button"
        className={styles.closeButton}
        aria-label="닫기"
        onClick={onClose}
      >
        <X aria-hidden="true" size={18} />
      </button>
      {/* 여백/레이아웃은 내용 쪽이 자기 래퍼에 들고 온다 — dialog 자신에 컨슈머
          스타일(예: display:flex)이 붙으면 [open] 여부와 무관하게 항상 적용돼
          버려서 닫힌 상태를 가릴 방법이 없어진다(예전에 겪은 버그). */}
      <ModalTitleIdContext.Provider value={titleId}>
        {children}
      </ModalTitleIdContext.Provider>
    </dialog>
  )
}
