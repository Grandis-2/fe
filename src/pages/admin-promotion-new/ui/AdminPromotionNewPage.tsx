import { useNavigate } from 'react-router'

import {
  mockLinkableProducts,
  type AdminPromotionFormValue,
} from '@/entities/admin-promotion'
import { AdminBreadcrumb } from '@/widgets/admin-breadcrumb'
import { AdminPromotionForm } from '@/widgets/admin-promotion-form'

import * as styles from './AdminPromotionNewPage.css'

export function AdminPromotionNewPage() {
  const navigate = useNavigate()

  // API가 아직 없어서 저장은 목록으로 돌아가는 것까지만 한다.
  const submit = (_value: AdminPromotionFormValue) =>
    navigate('/admin/preorders')

  return (
    <div className={styles.root}>
      <AdminBreadcrumb
        items={[
          { label: '사전 예약 관리', to: '/admin/preorders' },
          { label: '새 프로모션' },
        ]}
      />

      <h1 className={styles.title}>새 프로모션</h1>

      <AdminPromotionForm
        mode="create"
        products={mockLinkableProducts}
        onSubmit={submit}
        onCancel={() => navigate('/admin/preorders')}
        onAddProduct={() => navigate('/admin/products/new')}
      />
    </div>
  )
}
