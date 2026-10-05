import { useNavigate } from 'react-router'

import { useCreateAdminProduct } from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_PRODUCTS_PATH, adminProductPath } from '@shared/config/routes'
import { Breadcrumb, InlineAlert } from '@shared/ui'
import { AdminProductForm } from '@widgets/admin/product-form'

import * as styles from './AdminProductNewPage.css'

export function AdminProductNewPage() {
  const navigate = useNavigate()
  const create = useCreateAdminProduct()

  return (
    <div className={styles.root}>
      <Breadcrumb
        items={[
          { label: '상품 관리', to: ADMIN_PRODUCTS_PATH },
          { label: '새 상품 등록' },
        ]}
      />

      <h1 className={styles.title}>새 상품 등록</h1>

      {create.isError && (
        <InlineAlert status="error">
          {getErrorMessage(create.error, '상품을 등록하지 못했습니다.')}
        </InlineAlert>
      )}

      <AdminProductForm
        mode="create"
        // 등록 요청 중에는 제출을 막는다 — 연타하면 같은 상품이 여러 개 생긴다.
        submitting={create.isPending}
        onSubmit={(value) =>
          create.mutate(value, {
            onSuccess: (created) =>
              navigate(adminProductPath(created.productId)),
          })
        }
        onCancel={() => navigate(ADMIN_PRODUCTS_PATH)}
        // 등록 전에는 볼 상세 페이지가 없어 목록으로만 돌려보낸다.
        onPreview={() => navigate(ADMIN_PRODUCTS_PATH)}
      />
    </div>
  )
}
