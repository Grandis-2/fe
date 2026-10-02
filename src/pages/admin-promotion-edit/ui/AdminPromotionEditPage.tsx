import { useNavigate, useParams } from 'react-router'

import {
  findMockPromotion,
  mockLinkableProducts,
  promotionStatusColor,
  promotionStatusLabel,
  promotionStatusLabels,
  toPromotionFormValue,
  type AdminPromotionFormValue,
} from '@entities/admin-promotion'
import {
  ADMIN_PRODUCT_NEW_PATH,
  ADMIN_PROMOTIONS_PATH,
} from '@shared/config/routes'
import { Tag } from '@shared/ui'
import { AdminBreadcrumb } from '@widgets/admin-breadcrumb'
import { AdminPromotionForm } from '@widgets/admin-promotion-form'

import * as styles from './AdminPromotionEditPage.css'

export function AdminPromotionEditPage() {
  const navigate = useNavigate()
  const { promotionId = '' } = useParams()
  const promotion = findMockPromotion(promotionId)

  if (!promotion) {
    return (
      <div className={styles.notFound}>
        <div>프로모션을 찾을 수 없습니다.</div>
        <AdminBreadcrumb
          items={[
            { label: '사전 예약 관리로 돌아가기', to: ADMIN_PROMOTIONS_PATH },
          ]}
        />
      </div>
    )
  }

  // API가 아직 없어서 저장은 목록으로 돌아가는 것까지만 한다.
  const submit = (_value: AdminPromotionFormValue) =>
    navigate(ADMIN_PROMOTIONS_PATH)

  return (
    <div className={styles.root}>
      <AdminBreadcrumb
        items={[
          { label: '사전 예약 관리', to: ADMIN_PROMOTIONS_PATH },
          { label: promotion.name },
        ]}
      />

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{promotion.name}</h1>
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          widthOptions={promotionStatusLabels}
          color={promotionStatusColor[promotion.status]}
        >
          {promotionStatusLabel[promotion.status]}
        </Tag>
      </div>

      <AdminPromotionForm
        mode="edit"
        products={mockLinkableProducts}
        defaultValue={toPromotionFormValue(promotion)}
        onSubmit={submit}
        onCancel={() => navigate(ADMIN_PROMOTIONS_PATH)}
        onAddProduct={() => navigate(ADMIN_PRODUCT_NEW_PATH)}
      />
    </div>
  )
}
