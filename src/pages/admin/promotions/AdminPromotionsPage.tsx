import { useState } from 'react'

import { Plus, SquarePen } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useAdminProducts } from '@entities/admin-product'
import {
  formatPromotionPeriod,
  promotionStatusColor,
  promotionStatusLabel,
  promotionStatusLabels,
  type AdminPromotion,
  type PromotionStatus,
  useAdminPromotions,
} from '@entities/admin-promotion'
import { getErrorMessage } from '@shared/api/client'
import {
  ADMIN_PRODUCT_NEW_PATH,
  ADMIN_PROMOTION_NEW_PATH,
  adminPromotionPath,
} from '@shared/config/routes'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import { Button, SegmentedTabs, Table, Tag } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './AdminPromotionsPage.css'

const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'SCHEDULED', label: '진행 예정' },
  { value: 'ONGOING', label: '진행 중' },
  { value: 'ENDED', label: '종료' },
] as const

type StatusFilter = (typeof statusFilters)[number]['value']

export function AdminPromotionsPage() {
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const promotions = useAdminPromotions()
  // 연결할 상품이 있는지만 본다 — 한 개만 받는다.
  const preorderProducts = useAdminProducts({ saleMode: 'PREORDER', size: 1 })

  const visiblePromotions = (promotions.data ?? []).filter(
    (promotion) =>
      statusFilter === 'all' ||
      promotion.status === (statusFilter as PromotionStatus),
  )

  const openDetail = (promotion: AdminPromotion) =>
    navigate(adminPromotionPath(promotion.promotionId))

  // 연결할 사전예약 상품이 없으면 사전예약부터 만들 수 없다.
  const startCreate = () => {
    // 아직 모르면(불러오는 중·실패) 막지 않는다 — 등록 화면에서 다시 보여준다.
    if (preorderProducts.data?.length === 0) {
      openModal({
        theme: 'light',
        title: '안내',
        description:
          '현재 새 사전예약 상품이 없습니다.\n먼저 만들고 사전예약을 생성할 수 있습니다.\n\n사전예약 상품을 생성하러 가시겠습니까?',
        confirmLabel: '생성 하러 하기',
        onConfirm: () => {
          closeModal()
          navigate(ADMIN_PRODUCT_NEW_PATH)
        },
      })
      return
    }
    navigate(ADMIN_PROMOTION_NEW_PATH)
  }

  // 버튼은 그대로 두고 결과만 토스트로 알린다 — 여러 번 눌러도 매번 같은 피드백을 준다.
  // 클립보드는 권한·비보안 컨텍스트(http)에서 거절될 수 있어 실패도 알린다.
  const copyLink = (promotion: AdminPromotion) =>
    void navigator.clipboard
      .writeText(promotion.publicUrl)
      .then(() => showToast('링크가 복사되었습니다!'))
      .catch(() => showToast('링크를 복사하지 못했습니다. 다시 시도해 주세요.'))

  const columns: TableColumn<AdminPromotion>[] = [
    {
      key: 'name',
      header: '사전예약명',
      align: 'center',
      render: (promotion) => (
        <span className={styles.promotionName}>{promotion.name}</span>
      ),
    },
    {
      key: 'products',
      header: '연결 상품',
      align: 'center',
      render: (promotion) => `${promotion.linkedProductIds.length}개`,
    },
    {
      key: 'period',
      header: '노출 기간',
      align: 'center',
      render: (promotion) => formatPromotionPeriod(promotion),
    },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      render: (promotion) => (
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          widthOptions={promotionStatusLabels}
          color={promotionStatusColor[promotion.status]}
        >
          {promotionStatusLabel[promotion.status]}
        </Tag>
      ),
    },
    {
      key: 'link',
      header: '링크복사',
      align: 'center',
      render: (promotion) => (
        <Button
          size="small"
          variant="outline"
          color="cancel"
          onClick={(event) => {
            // 행 클릭으로 상세까지 열리면 안 된다.
            event.stopPropagation()
            copyLink(promotion)
          }}
        >
          링크 복사
        </Button>
      ),
    },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>사전예약 관리</div>
        <Button icon={Plus} size="medium" onClick={startCreate}>
          새 사전예약
        </Button>
      </div>

      <SegmentedTabs
        items={statusFilters}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <Table
        columns={columns}
        rows={visiblePromotions}
        rowKey={(promotion) => promotion.promotionId}
        pageSize={10}
        onRowClick={openDetail}
        rowAction={{
          header: '수정',
          label: (promotion) => `${promotion.name} 수정`,
          onClick: openDetail,
          icon: SquarePen,
        }}
        emptyMessage={
          promotions.isError
            ? getErrorMessage(
                promotions.error,
                '사전예약을 불러오지 못했습니다.',
              )
            : promotions.isPending
              ? '불러오는 중입니다.'
              : '조건에 맞는 사전예약이 없습니다.'
        }
      />
    </div>
  )
}
