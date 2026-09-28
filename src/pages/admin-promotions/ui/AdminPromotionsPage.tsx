import { useState } from 'react'

import { useNavigate } from 'react-router'

import {
  formatPromotionPeriod,
  mockLinkableProducts,
  mockPromotions,
  promotionStatusColor,
  promotionStatusLabel,
  promotionStatusLabels,
  type AdminPromotion,
  type PromotionStatus,
} from '@/entities/admin-promotion'
import { useModalStore } from '@/shared/model/modalStore'
import { Button, ConfirmDialog, SegmentedTabs, Table, Tag } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'

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
  const openModal = useModalStore((state) => state.open)
  const closeModal = useModalStore((state) => state.close)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [copiedId, setCopiedId] = useState<string>()

  const visiblePromotions = mockPromotions.filter(
    (promotion) =>
      statusFilter === 'all' ||
      promotion.status === (statusFilter as PromotionStatus),
  )

  const openDetail = (promotion: AdminPromotion) =>
    navigate(`/admin/preorders/${promotion.promotionId}`)

  // 연결할 사전예약 상품이 없으면 프로모션부터 만들 수 없다.
  const startCreate = () => {
    if (mockLinkableProducts.length === 0) {
      openModal(
        <ConfirmDialog
          title="안내"
          description={
            '현재 새 사전예약 상품이 없습니다.\n먼저 만들고 사전예약 안내 탭을 생성할 수 있습니다.\n\n사전예약 상품을 생성하러 가시겠습니까?'
          }
          confirmLabel="생성 하러 하기"
          onConfirm={() => {
            closeModal()
            navigate('/admin/products/new')
          }}
          onCancel={closeModal}
        />,
      )
      return
    }
    navigate('/admin/preorders/new')
  }

  const copyLink = (promotion: AdminPromotion) => {
    void navigator.clipboard.writeText(promotion.publicUrl).then(() => {
      setCopiedId(promotion.promotionId)
    })
  }

  const columns: TableColumn<AdminPromotion>[] = [
    {
      key: 'name',
      header: '프로모션',
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
      render: (promotion) =>
        copiedId === promotion.promotionId ? (
          <span className={styles.copied}>복사됨</span>
        ) : (
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
        <Button icon="plus" size="medium" onClick={startCreate}>
          새 프로모션
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
        }}
        emptyMessage="조건에 맞는 프로모션이 없습니다."
      />
    </div>
  )
}
