import { useState } from 'react'

import { useNavigate } from 'react-router'

import {
  createAdminProduct,
  toUpsertRequest,
  type AdminProductFormValue,
} from '@/entities/admin-product'
import { ADMIN_PRODUCTS_PATH, adminProductPath } from '@/shared/config/routes'
import { AdminBreadcrumb } from '@/widgets/admin-breadcrumb'
import { AdminProductForm } from '@/widgets/admin-product-form'

import * as styles from './AdminProductNewPage.css'

export function AdminProductNewPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string>()

  const handleSubmit = (value: AdminProductFormValue) =>
    void createAdminProduct(toUpsertRequest(value))
      .then((created) => navigate(adminProductPath(created.productId)))
      .catch((cause: Error) => setError(cause.message))

  return (
    <div className={styles.root}>
      <AdminBreadcrumb
        items={[
          { label: '상품 관리', to: ADMIN_PRODUCTS_PATH },
          { label: '새 상품 등록' },
        ]}
      />

      <h1 className={styles.title}>새 상품 등록</h1>

      {error && <div className={styles.error}>{error}</div>}

      <AdminProductForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate(ADMIN_PRODUCTS_PATH)}
        // 등록 전에는 볼 상세 페이지가 없어 목록으로만 돌려보낸다.
        onPreview={() => navigate(ADMIN_PRODUCTS_PATH)}
      />
    </div>
  )
}
