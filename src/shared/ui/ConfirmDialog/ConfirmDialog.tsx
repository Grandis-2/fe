import type { ReactNode } from 'react'

import { Button } from '@/shared/ui/Button'
import { ModalTitle } from '@/shared/ui/Modal'

import * as styles from './ConfirmDialog.css'

export type ConfirmDialogProps = {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * '안내 문구 + 확인/취소' 만 있는 모달 내용.
 * 껍데기(backdrop·X·애니메이션)는 shared/ui/Modal이 갖고 있으므로
 * 여는 쪽이 useModalStore.open(<ConfirmDialog ... />)로 띄운다.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className={styles.content}>
      <ModalTitle className={styles.title}>{title}</ModalTitle>
      {description && <div className={styles.description}>{description}</div>}
      <div className={styles.actions}>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
        <Button variant="outline" color="cancel" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  )
}
