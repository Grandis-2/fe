import { useState } from 'react'

import {
  toFormValue,
  useAdminProduct,
  useAdminProductStock,
  useUpdateAdminProduct,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { InlineAlert } from '@shared/ui'

import { AdminProductForm } from '../AdminProductForm'

import * as styles from './AdminProductEditForm.css'

export type AdminProductEditFormProps = {
  productId: string
  /** 상품 본문과 재고가 모두 저장됐을 때 */
  onSaved: () => void
  onCancel: () => void
  onPreview: () => void
}

/** 상품을 불러와 수정 폼을 채우고, 저장까지 맡는다 — 어디로 이동할지만 쓰는 쪽이 정한다 */
export function AdminProductEditForm({
  productId,
  onSaved,
  onCancel,
  onPreview,
}: AdminProductEditFormProps) {
  const product = useAdminProduct(productId)
  const stock = useAdminProductStock(productId)
  const update = useUpdateAdminProduct(productId)
  // 본문은 저장됐는데 재고 일부가 실패한 경우 — 실패와 구분해서 알린다.
  const [failedStockCount, setFailedStockCount] = useState(0)

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

  return (
    <div className={styles.root}>
      {update.isError && (
        <InlineAlert status="error">
          {getErrorMessage(update.error, '상품을 저장하지 못했습니다.')}
        </InlineAlert>
      )}
      {failedStockCount > 0 && (
        <InlineAlert status="warning">
          상품 정보는 저장했지만 재고 {failedStockCount}건을 저장하지
          못했습니다. 재고 조회 탭에서 확인해 주세요.
        </InlineAlert>
      )}

      <AdminProductForm
        mode="edit"
        defaultValue={toFormValue(product.data, stock.data)}
        submitting={update.isPending}
        onSubmit={(value) => {
          setFailedStockCount(0)
          update.mutate(value, {
            onSuccess: (result) => {
              if (result.failedStockCount > 0) {
                setFailedStockCount(result.failedStockCount)
              } else {
                onSaved()
              }
            },
          })
        }}
        onCancel={onCancel}
        onPreview={onPreview}
      />
    </div>
  )
}
