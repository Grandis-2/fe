import { ExternalLink, Link2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import {
  formatPromotionPeriod,
  linkedProductStage,
  linkedProductStageLabel,
  PROMOTION_DETAIL_IMAGES_MAX,
  PROMOTION_PRODUCTS_MAX,
  promotionDue,
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
  preorderPath,
} from '@shared/config/routes'
import { copyText } from '@shared/lib/copyText'
import { formatDotDate, formatDotDateTime } from '@shared/lib/formatDotDate'
import { useNow } from '@shared/lib/useNow'
import { showToast } from '@shared/model/toastStore'
import {
  Breadcrumb,
  Button,
  InlineAlert,
  PageSkeleton,
  StatCard,
  Tag,
} from '@shared/ui'
import { AdminPromotionForm } from '@widgets/admin/promotion-form'

import * as styles from './AdminPromotionEditPage.css'

export function AdminPromotionEditPage() {
  const navigate = useNavigate()
  const { promotionId = '' } = useParams()
  const promotion = useAdminPromotion(promotionId)
  const linkable = usePromotionLinkableProducts(promotionId)
  const update = useUpdateAdminPromotion(promotionId)
  const now = useNow(60_000)

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

  const { name, status, products, detailImageUrls, createdAt, updatedAt } =
    promotion.data
  const due = promotionDue(promotion.data, now.getTime())
  const customerPath = preorderPath(promotionId)

  // 연결 상품을 단계별로 센다 — 오픈 시각은 후보 목록에만 있다. 못 받았으면 판매 방식만 센다.
  const stageCounts = new Map<string, number>()
  for (const linked of products) {
    const found = linkable.data?.find(
      (product) => product.productId === linked.productId,
    )
    const label = found
      ? linkedProductStageLabel[linkedProductStage(found, now.getTime())]
      : linked.saleMode === 'IN_STOCK'
        ? linkedProductStageLabel.inStock
        : '사전예약'
    stageCounts.set(label, (stageCounts.get(label) ?? 0) + 1)
  }

  // 클립보드는 권한·비보안 컨텍스트(http)에서 거절될 수 있어 실패도 알린다.
  const copyLink = () =>
    void copyText(`${location.origin}${customerPath}`)
      .then(() => showToast('링크가 복사되었습니다!'))
      .catch(() => showToast('링크를 복사하지 못했습니다. 다시 시도해 주세요.'))

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
        {/* 고객 상세는 기간 밖이면 404 — 끝나면 링크를, 진행 중일 때만 고객 화면을 연다. */}
        <div className={styles.titleActions}>
          {status !== 'ENDED' && (
            <Button
              size="small"
              variant="outline"
              color="cancel"
              icon={Link2}
              onClick={copyLink}
            >
              링크 복사
            </Button>
          )}
          {status === 'ONGOING' && (
            <Button
              size="small"
              variant="outline"
              color="cancel"
              icon={ExternalLink}
              onClick={() => window.open(customerPath, '_blank', 'noopener')}
            >
              고객 화면 보기
            </Button>
          )}
        </div>
      </div>

      <section className={styles.summary} aria-label="요약">
        <StatCard
          label="노출 기간"
          value={
            <span className={styles.stat}>
              {formatPromotionPeriod(promotion.data)}
              <span className={due.urgent ? styles.statWarn : styles.statHint}>
                {due.label}
              </span>
            </span>
          }
        />
        <StatCard
          label="연결 상품"
          value={
            <span className={styles.stat}>
              {products.length} / {PROMOTION_PRODUCTS_MAX}개
              <span className={styles.statHint}>
                {[...stageCounts]
                  .map(([label, count]) => `${label} ${count}`)
                  .join(' · ') || '연결한 상품이 없어요'}
              </span>
            </span>
          }
        />
        <StatCard
          label="상세 이미지"
          value={
            <span className={styles.stat}>
              {detailImageUrls.length} / {PROMOTION_DETAIL_IMAGES_MAX}장
              {detailImageUrls.length === 0 ? (
                <span className={styles.statWarn}>상세 이미지가 없어요</span>
              ) : (
                <span className={styles.statHint}>위에서부터 이어 붙어요</span>
              )}
            </span>
          }
        />
        <StatCard
          label="마지막 수정"
          value={
            <span className={styles.stat}>
              {formatDotDateTime(updatedAt).slice(5, 16)}
              <span className={styles.statHint}>
                처음 만든 날 {formatDotDate(createdAt)}
              </span>
            </span>
          }
        />
      </section>

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
            // 머무르며 이어서 고친다 — 다시 받은 값이 새 기준이 돼 '바뀐 곳'이 비워진다.
            onSuccess: () => showToast('사전예약을 저장했습니다.'),
          })
        }
        onCancel={() => navigate(ADMIN_PROMOTIONS_PATH)}
        onAddProduct={() => navigate(ADMIN_PRODUCT_NEW_PATH)}
      />
    </div>
  )
}
