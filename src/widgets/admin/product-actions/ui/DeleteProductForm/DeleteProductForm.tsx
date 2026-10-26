import { useState } from 'react'

import { Input, ModalActions } from '@shared/ui'

import * as styles from './DeleteProductForm.css'

export type DeleteProductFormProps = {
  /** 지울 상품 이름 — 그대로 입력해야 지울 수 있다 */
  name: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 상품 삭제 확인 — 되돌릴 수 없어 상품 이름을 그대로 입력해야 지우기가 열린다. 다른 상품
 * 상세를 보다 잘못 누르는 걸 막는다.
 */
export function DeleteProductForm({
  name,
  onConfirm,
  onCancel,
}: DeleteProductFormProps) {
  const [typed, setTyped] = useState('')
  const matches = typed.trim() === name.trim()

  return (
    <div className={styles.root}>
      <Input
        label={`확인을 위해 '${name}'을(를) 그대로 입력하세요`}
        variant="stacked"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
      />
      <ModalActions
        confirmLabel="상품 삭제"
        confirmDisabled={!matches}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  )
}
