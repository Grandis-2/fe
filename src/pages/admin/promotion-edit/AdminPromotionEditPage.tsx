import { useNavigate, useParams } from 'react-router'

import {
  promotionStatusColor,
  promotionStatusLabel,
  promotionStatusLabels,
  toPromotionFormValue,
  useAdminPromotion,
  usePromotionLinkableProducts,
  useUpdateAdminPromotion,
} from '@entities/admin-promotion'
import { getErrorMessage } from '@shared/api/client'
import {
  ADMIN_PRODUCT_NEW_PATH,
  ADMIN_PROMOTIONS_PATH,
} from '@shared/config/routes'
import { showToast } from '@shared/model/toastStore'
import { Breadcrumb, InlineAlert, PageSkeleton, Tag } from '@shared/ui'
import { AdminPromotionForm } from '@widgets/admin/promotion-form'

import * as styles from './AdminPromotionEditPage.css'

export function AdminPromotionEditPage() {
  const navigate = useNavigate()
  const { promotionId = '' } = useParams()
  const promotion = useAdminPromotion(promotionId)
  const linkable = usePromotionLinkableProducts(promotionId)
  const update = useUpdateAdminPromotion(promotionId)

  if (!promotion.data) {
    // 불러오는 중이면 화면 모양을 먼저 깐다 — 실패일 때만 안내와 돌아갈 길을 보인다.
    if (!promotion.isError) {
      return (
        <div className={styles.root}>
          <PageSkeleton sections={3} fieldsPerSection={1} />
        </div>
      )
    }
    return (
      <div className={styles.notFound}>
        <div>
          {getErrorMessage(promotion.error, '사전예약을 찾을 수 없습니다.')}
        </div>
        <Breadcrumb
          items={[
            { label: '사전예약 관리로 돌아가기', to: ADMIN_PROMOTIONS_PATH },
          ]}
        />
      </div>
    )
  }

  const { name, status } = promotion.data

  return (
    <div className={styles.root}>
      <Breadcrumb
        items={[
          { label: '사전예약 관리', to: ADMIN_PROMOTIONS_PATH },
          { label: name },
        ]}
      />

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{name}</h1>
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          widthOptions={promotionStatusLabels}
          color={promotionStatusColor[status]}
        >
          {promotionStatusLabel[status]}
        </Tag>
      </div>

      {linkable.isError && (
        <InlineAlert status="error">
          연결할 상품을 불러오지 못했습니다.
        </InlineAlert>
      )}
      {update.isError && (
        <InlineAlert status="error">
          {getErrorMessage(update.error, '사전예약을 수정하지 못했습니다.')}
        </InlineAlert>
      )}

      <AdminPromotionForm
        // 다른 프로모션으로 옮겨 가면 폼을 새 값으로 다시 연다.
        key={promotionId}
        mode="edit"
        products={linkable.data ?? []}
        productsLoading={linkable.isPending}
        defaultValue={toPromotionFormValue(promotion.data)}
        submitting={update.isPending}
        onSubmit={(value) =>
          update.mutate(value, {
            onSuccess: () => {
              showToast('사전예약을 수정했습니다.')
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
