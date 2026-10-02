import { useNavigate } from 'react-router'

import {
  mockLinkableProducts,
  type AdminPromotionFormValue,
} from '@/entities/admin-promotion'
import {
  ADMIN_PRODUCT_NEW_PATH,
  ADMIN_PROMOTIONS_PATH,
} from '@/shared/config/routes'
import { AdminBreadcrumb } from '@/widgets/admin-breadcrumb'
import { AdminPromotionForm } from '@/widgets/admin-promotion-form'

import * as styles from './AdminPromotionNewPage.css'

export function AdminPromotionNewPage() {
  const navigate = useNavigate()

  // API가 아직 없어서 저장은 목록으로 돌아가는 것까지만 한다.
  const submit = (_value: AdminPromotionFormValue) =>
    navigate(ADMIN_PROMOTIONS_PATH)

  return (
    <div className={styles.root}>
      <AdminBreadcrumb
        items={[
          { label: '사전 예약 관리', to: ADMIN_PROMOTIONS_PATH },
          { label: '새 프로모션' },
        ]}
      />

      <h1 className={styles.title}>새 프로모션</h1>

      <AdminPromotionForm
        mode="create"
        products={mockLinkableProducts}
        onSubmit={submit}
        onCancel={() => navigate(ADMIN_PROMOTIONS_PATH)}
        onAddProduct={() => navigate(ADMIN_PRODUCT_NEW_PATH)}
      />
    </div>
  )
}
