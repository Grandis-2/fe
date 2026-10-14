import { useState } from 'react'

import { useNavigate } from 'react-router'

import {
  useCreateAdminProduct,
  validateRegistration,
} from '@entities/admin-product'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { ADMIN_PRODUCTS_PATH, adminProductPath } from '@shared/config/routes'
import { showToast } from '@shared/model/toastStore'
import { Breadcrumb, InlineAlert } from '@shared/ui'
import { AdminProductForm } from '@widgets/admin/product-form'

import * as styles from './AdminProductNewPage.css'

/**
 * 새 상품 등록. 일반 상품은 등록 때 공개·숨김을 고른다(기본 숨김). 사전예약은 공개로
 * 들어가지만 접수 기간에만 구매자에게 보인다.
 */
const violationsOf = (caught: unknown) =>
  caught instanceof ApiRequestError
    ? (caught.error.details?.violations ?? [])
    : []

export function AdminProductNewPage() {
  const navigate = useNavigate()
  const create = useCreateAdminProduct()
  const [invalid, setInvalid] = useState<string | null>(null)

  return (
    <div className={styles.root}>
      <Breadcrumb
        items={[
          { label: '상품 관리', to: ADMIN_PRODUCTS_PATH },
          { label: '새 상품 등록' },
        ]}
      />

      <h1 className={styles.title}>새 상품 등록</h1>

      {(invalid || create.isError) && (
        <InlineAlert status="error">
          {invalid ??
            getErrorMessage(create.error, '상품을 등록하지 못했습니다.')}
          {/* 400이면 서버가 어느 칸이 틀렸는지 준다 — 요약 문구만으로는 고칠 곳을 모른다. */}
          {!invalid &&
            violationsOf(create.error).map(({ field, message }) => (
              <div key={field}>
                {field}: {message}
              </div>
            ))}
        </InlineAlert>
      )}

      <AdminProductForm
        mode="create"
        // 등록 요청 중에는 제출을 막는다 — 연타하면 같은 상품이 여러 개 생긴다.
        submitting={create.isPending}
        onSubmit={(value) => {
          // 서버가 400을 줄 값은 보내기 전에 걸러 고칠 자리를 바로 알린다.
          const reason = validateRegistration(value)
          setInvalid(reason)
          if (reason) return
          create.mutate(value, {
            onSuccess: ({ productId, ready }) => {
              // 준비(회차·재고 생성)가 늦어지면 상세에서 '초안'으로 보인다 — 실패가
              // 아니라 아직 덜 된 것이라 알려 둔다. 다시 등록하면 상품이 둘이 된다.
              showToast(
                ready
                  ? '상품을 등록했습니다.'
                  : '상품을 등록했습니다. 판매 준비는 잠시 뒤 끝납니다.',
              )
              navigate(adminProductPath(productId))
            },
          })
        }}
        onCancel={() => navigate(ADMIN_PRODUCTS_PATH)}
        // 등록 전에는 볼 상세 페이지가 없어 목록으로만 돌려보낸다.
        onPreview={() => navigate(ADMIN_PRODUCTS_PATH)}
      />
    </div>
  )
}
