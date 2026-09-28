import { useState } from 'react'

import { ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import {
  createAdminProduct,
  toUpsertRequest,
  type AdminProductFormValue,
} from '@/entities/admin-product'
import { AdminProductForm } from '@/widgets/admin-product-form'

import * as styles from './AdminProductNewPage.css'

export function AdminProductNewPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string>()

  const handleSubmit = (value: AdminProductFormValue) =>
    void createAdminProduct(toUpsertRequest(value))
      .then((created) => navigate(`/admin/products/${created.productId}`))
      .catch((cause: Error) => setError(cause.message))

  return (
    <div className={styles.root}>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link className={styles.breadcrumbLink} to="/admin/products">
          상품 관리
        </Link>
        <ChevronRight className={styles.breadcrumbIcon} aria-hidden="true" />
        <span className={styles.breadcrumbCurrent}>새 상품 등록</span>
      </nav>

      <h1 className={styles.title}>새 상품 등록</h1>

      {error && <div className={styles.error}>{error}</div>}

      <AdminProductForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/products')}
        // 등록 전에는 볼 상세 페이지가 없어 목록으로만 돌려보낸다.
        onPreview={() => navigate('/admin/products')}
      />
    </div>
  )
}
