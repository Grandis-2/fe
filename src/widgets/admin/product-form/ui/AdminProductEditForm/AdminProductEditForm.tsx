import { useState } from 'react'

import {
  editLockReason,
  editSectionLabel,
  toFormValue,
  useAdminProduct,
  useAdminProductStock,
  useSaveAdminProductEdits,
  type EditSaveResult,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { InlineAlert } from '@shared/ui'

import { AdminProductForm } from '../AdminProductForm'

import * as styles from './AdminProductEditForm.css'

export type AdminProductEditFormProps = {
  productId: string
  /** 바뀐 섹션이 모두 저장됐을 때 */
  onSaved: () => void
  onCancel: () => void
  onPreview: () => void
  /** 배송 구간 설정 탭으로 보낸다 — 1차 배송일은 거기서 고친다 */
  onEditDispatchWindow?: () => void
}

/**
 * 상품을 불러와 수정 폼을 채우고, 저장까지 맡는다 — 어디로 이동할지만 쓰는 쪽이 정한다.
 *
 * 저장은 섹션(기본 정보·판매 일정·옵션·재고)마다 요청이 따로라 일부만 실패할 수 있다.
 * 실패한 섹션을 모아 보여주고 폼은 그대로 둔다 — 상세를 다시 받아 기준이 바뀌므로,
 * 다시 저장하면 반영된 건 빠지고 실패한 것만 간다.
 */
export function AdminProductEditForm({
  productId,
  onSaved,
  onCancel,
  onPreview,
  onEditDispatchWindow,
}: AdminProductEditFormProps) {
  const product = useAdminProduct(productId)
  const stock = useAdminProductStock(productId)
  const save = useSaveAdminProductEdits(productId)
  const [result, setResult] = useState<EditSaveResult>()

  const loadError = product.error ?? stock.error
  if (loadError) {
    return (
      <div className={styles.message}>
        {getErrorMessage(loadError, '상품 정보를 불러오지 못했습니다.')}
      </div>
    )
  }
  // 폼은 처음 값으로만 채워지므로, 둘 다 받은 뒤에 그린다.
  if (!product.data || !stock.data) {
    return <div className={styles.message}>불러오는 중입니다.</div>
  }

  // 서버에 이미 있는 옵션 종류·값 — 등록 뒤에는 이것들을 지울 수 없다.
  const existingIds = new Set(
    product.data.optionAxes.flatMap((axis) => [
      axis.key,
      ...axis.values.map((value) => value.valueId),
    ]),
  )
  const failures = result?.failures ?? []

  return (
    <div className={styles.root}>
      {save.isError && (
        <InlineAlert status="error">
          {getErrorMessage(save.error, '상품을 저장하지 못했습니다.')}
        </InlineAlert>
      )}
      {failures.length > 0 && (
        <InlineAlert status="error">
          <div>
            저장하지 못한 항목이 있습니다. 나머지는 저장됐고, 다시 저장하면 이
            항목만 보냅니다.
          </div>
          <ul className={styles.failures}>
            {failures.map((failure) => (
              <li key={failure.section}>
                {editSectionLabel[failure.section]} — {failure.message}
              </li>
            ))}
          </ul>
        </InlineAlert>
      )}
      {result && !result.changed && (
        <InlineAlert status="info">바뀐 내용이 없습니다.</InlineAlert>
      )}

      <AdminProductForm
        // 폼은 defaultValue를 처음에만 읽는다. 상세 화면에 머문 채 상품만 바뀌면
        // (뒤로/앞으로 가기 등) 이전 상품 값이 남아 새 상품에 저장될 수 있어 새로 만든다.
        // 저장 뒤 상세를 다시 받아도 폼은 그대로다 — 실패한 입력을 지우지 않으려고.
        key={productId}
        mode="edit"
        defaultValue={toFormValue(product.data, stock.data)}
        existingIds={existingIds}
        lockReason={editLockReason(product.data)}
        submitting={save.isPending}
        onSubmit={(value) => {
          setResult(undefined)
          save.mutate(value, {
            onSuccess: (saved) => {
              setResult(saved)
              if (saved.changed && saved.failures.length === 0) onSaved()
            },
          })
        }}
        onCancel={onCancel}
        onPreview={onPreview}
        onEditDispatchWindow={onEditDispatchWindow}
      />
    </div>
  )
}
