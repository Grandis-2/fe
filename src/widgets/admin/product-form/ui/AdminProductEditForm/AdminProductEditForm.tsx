import { useState } from 'react'

import {
  editLockReason,
  editSectionLabel,
  imageUploadIssues,
  toFormValue,
  useAdminProduct,
  useAdminProductStock,
  useSaveAdminProductEdits,
  validateProductBasics,
  type AdminProductFormValue,
  type EditSaveResult,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { showToast } from '@shared/model/toastStore'
import { InlineAlert, PageSkeleton } from '@shared/ui'

import { AdminProductForm } from '../AdminProductForm'

import * as styles from './AdminProductEditForm.css'

export type AdminProductEditFormProps = {
  productId: string
  onCancel: () => void
  /** 폼에 지금 있는 값 — 저장 전 사진도 미리보기에 보이게 넘긴다 */
  onPreview: (value: AdminProductFormValue) => void
  /** 배송 구간 설정 탭으로 보낸다 — 1차 배송일은 거기서 고친다 */
  onEditShipmentBatches?: () => void
}

/**
 * 상품을 불러와 수정 폼을 채우고, 저장까지 맡는다.
 *
 * 저장해도 이 화면에 남는다 — 저장이 제대로 됐는지 바로 보고 이어서 고칠 수 있게. 다 저장되면
 * 서버 값을 다시 받아 폼을 새로 채운다(새로 만든 조합·판매 상태가 서버 기준으로 맞춰진다).
 *
 * 저장은 섹션(기본 정보·판매 일정·옵션·재고)마다 요청이 따로라 일부만 실패할 수 있다.
 * 실패한 섹션을 모아 보여주고 폼은 그대로 둔다 — 상세를 다시 받아 기준이 바뀌므로,
 * 다시 저장하면 반영된 건 빠지고 실패한 것만 간다.
 */
export function AdminProductEditForm({
  productId,
  onCancel,
  onPreview,
  onEditShipmentBatches,
}: AdminProductEditFormProps) {
  const product = useAdminProduct(productId)
  const stock = useAdminProductStock(productId)
  const save = useSaveAdminProductEdits(productId)
  const [result, setResult] = useState<EditSaveResult>()
  // 저장이 끝나면 올려 폼을 새로 만든다 — 폼은 처음 값(defaultValue)으로만 채워진다.
  const [formVersion, setFormVersion] = useState(0)

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
    return <PageSkeleton title={false} sections={4} fieldsPerSection={2} />
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

      <AdminProductForm
        // 폼은 defaultValue를 처음에만 읽는다. 상세 화면에 머문 채 상품만 바뀌면
        // (뒤로/앞으로 가기 등) 이전 상품 값이 남아 새 상품에 저장될 수 있어 새로 만든다.
        // 일부 실패면 폼을 그대로 둔다(실패한 입력을 지우지 않으려고). 다 저장되면
        // formVersion을 올려 서버 값으로 새로 채운다.
        key={`${productId}-${formVersion}`}
        mode="edit"
        defaultValue={toFormValue(product.data, stock.data)}
        existingIds={existingIds}
        lockReason={editLockReason(product.data)}
        submitting={save.isPending}
        waitingForNetwork={save.isPaused}
        // 상품명·모델명·브랜드는 비우면 서버가 400을 준다 — 보내기 전에 칸에서 알린다.
        // 올리는 중·실패한 사진이 있으면 그 사진이 빠진 채 저장되니 막는다.
        validate={(value) => [
          ...validateProductBasics(value),
          ...imageUploadIssues(value),
        ]}
        // 위 알림은 버튼 자리에서 안 보인다 — 무엇이 실패했는지는 버튼 줄에도 적는다.
        submitError={
          save.isError
            ? getErrorMessage(save.error, '상품을 저장하지 못했습니다.')
            : failures.length > 0
              ? `저장하지 못한 항목: ${failures
                  .map((failure) => editSectionLabel[failure.section])
                  .join(', ')} — 위 안내를 확인해 주세요.`
              : null
        }
        onSubmit={(value) => {
          setResult(undefined)
          save.mutate(value, {
            onSuccess: async (saved) => {
              setResult(saved)
              // 맨 위 알림은 화면 아래 버튼 자리에서 안 보인다 — 토스트로 알린다.
              if (!saved.changed) {
                showToast('바뀐 내용이 없습니다.')
                return
              }
              if (saved.failures.length > 0) return
              // 서버 값을 다 받은 뒤에 폼을 새로 만든다 — 먼저 만들면 옛 값으로 채워진다.
              await Promise.all([product.refetch(), stock.refetch()])
              setFormVersion((version) => version + 1)
              showToast('상품을 저장했습니다.')
            },
          })
        }}
        onCancel={onCancel}
        onPreview={onPreview}
        onEditShipmentBatches={onEditShipmentBatches}
      />
    </div>
  )
}
