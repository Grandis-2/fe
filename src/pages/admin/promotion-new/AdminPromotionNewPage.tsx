import { useNavigate } from 'react-router'

import { useCreateAdminPromotion } from '@entities/admin-promotion'
import { getErrorMessage } from '@shared/api/client'
import {
  ADMIN_PRODUCT_NEW_PATH,
  ADMIN_PROMOTIONS_PATH,
} from '@shared/config/routes'
import { showToast } from '@shared/model/toastStore'
import { Breadcrumb, InlineAlert } from '@shared/ui'
import {
  AdminPromotionForm,
  useLinkableProducts,
} from '@widgets/admin/promotion-form'

import * as styles from './AdminPromotionNewPage.css'

export function AdminPromotionNewPage() {
  const navigate = useNavigate()
  const linkable = useLinkableProducts()
  const create = useCreateAdminPromotion()

  return (
    <div className={styles.root}>
      <Breadcrumb
        items={[
          { label: '사전예약 관리', to: ADMIN_PROMOTIONS_PATH },
          { label: '새 사전예약' },
        ]}
      />

      <h1 className={styles.title}>새 사전예약</h1>

      {linkable.isError && (
        <InlineAlert status="error">
          연결할 상품을 불러오지 못했습니다.
        </InlineAlert>
      )}
      {create.isError && (
        <InlineAlert status="error">
          {getErrorMessage(create.error, '사전예약을 등록하지 못했습니다.')}
        </InlineAlert>
      )}

      <AdminPromotionForm
        mode="create"
        products={linkable.products ?? []}
        productsLoading={linkable.isPending}
        submitting={create.isPending}
        onSubmit={(value) =>
          create.mutate(value, {
            onSuccess: () => {
              showToast('사전예약을 등록했습니다.')
              navigate(ADMIN_PROMOTIONS_PATH)
            },
          })
        }
        onCancel={() => navigate(ADMIN_PROMOTIONS_PATH)}
        onAddProduct={() => navigate(ADMIN_PRODUCT_NEW_PATH)}
      />
    </div>
  )
}
