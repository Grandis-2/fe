import { useState } from 'react'

import { Link2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useAdminProducts } from '@entities/admin-product'
import {
  formatPromotionPeriod,
  promotionDue,
  promotionProductProblem,
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
  preorderPath,
} from '@shared/config/routes'
import { copyText } from '@shared/lib/copyText'
import { useNow } from '@shared/lib/useNow'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import {
  Button,
  Dropdown,
  ImageWithFallback,
  InlineAlert,
  Input,
  SegmentedTabs,
  Table,
  Tag,
} from '@shared/ui'
import type { DropdownOption, TableColumn } from '@shared/ui'

import * as styles from './AdminPromotionsPage.css'

// 지금 손볼 사전예약부터 — 진행 중 → 진행 예정 → 종료.
const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'ONGOING', label: '진행 중' },
  { value: 'SCHEDULED', label: '진행 예정' },
  { value: 'ENDED', label: '종료' },
] as const

type StatusFilter = (typeof statusFilters)[number]['value']

type PromotionSort = 'due' | 'start' | 'updated'

const sortOptions: DropdownOption<PromotionSort>[] = [
  { label: '진행 중 먼저 · 종료 임박순', value: 'due' },
  { label: '시작일순', value: 'start' },
  { label: '최근 수정순', value: 'updated' },
]

const statusOrder: Record<PromotionStatus, number> = {
  ONGOING: 0,
  SCHEDULED: 1,
  ENDED: 2,
}

// 진행 중은 끝이 가까운 것, 예정은 시작이 가까운 것, 종료는 최근에 끝난 것부터.
const byDue = (a: AdminPromotion, b: AdminPromotion) =>
  statusOrder[a.status] - statusOrder[b.status] ||
  (a.status === 'ONGOING'
    ? a.endDate.localeCompare(b.endDate)
    : a.status === 'SCHEDULED'
      ? a.startDate.localeCompare(b.startDate)
      : b.endDate.localeCompare(a.endDate))

const sorters: Record<
  PromotionSort,
  (a: AdminPromotion, b: AdminPromotion) => number
> = {
  due: byDue,
  start: (a, b) => a.startDate.localeCompare(b.startDate),
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
}

// 연결 상품 칩은 이만큼만 보이고 나머지는 '+N'으로 접는다.
const VISIBLE_PRODUCTS = 2

const pad = (value: number) => String(value).padStart(2, '0')

/** '14:05 수정'(오늘) 또는 '10.18 수정' */
const editedLabel = (iso: string, now: Date) => {
  const date = new Date(iso)
  return date.toDateString() === now.toDateString()
    ? `오늘 ${pad(date.getHours())}:${pad(date.getMinutes())} 수정`
    : `${pad(date.getMonth() + 1)}.${pad(date.getDate())} 수정`
}

/**
 * 사전예약 목록. 서버는 최신순 전체만 주므로(최대 100개씩 모두 받는다) 상태 탭·검색·정렬은
 * 화면이 한다.
 */
export function AdminPromotionsPage() {
  const navigate = useNavigate()
  // 남은 날은 날짜 단위라 1분마다 다시 읽으면 충분하다.
  const now = useNow(60_000)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<PromotionSort>('due')

  const promotions = useAdminPromotions()
  // 연결할 상품이 있는지만 본다 — 한 개만 받는다.
  const preorderProducts = useAdminProducts({ saleMode: 'PREORDER', size: 1 })
  // 고객 노출 판정용 — 첫 100개 안에 없는 상품은 판정하지 않는다(목록 밖일 수 있다).
  const listedPreorders = useAdminProducts({ saleMode: 'PREORDER', size: 100 })

  // 탭 건수도 검색어로 거른 목록에서 센다 — 표와 숫자가 어긋나지 않게.
  const query = keyword.trim().toLowerCase()
  const matched = (promotions.data ?? []).filter(
    (promotion) =>
      !query ||
      promotion.name.toLowerCase().includes(query) ||
      promotion.products.some((product) =>
        product.title.toLowerCase().includes(query),
      ),
  )
  const counts = Object.fromEntries(
    statusFilters.map(({ value }) => [
      value,
      value === 'all'
        ? matched.length
        : matched.filter((promotion) => promotion.status === value).length,
    ]),
  ) as Record<StatusFilter, number>
  const visiblePromotions = matched
    .filter(
      (promotion) =>
        statusFilter === 'all' || promotion.status === statusFilter,
    )
    .toSorted(sorters[sort])

  // 고객이 지금 보고 있는데 상품이 제대로 안 보이는 사전예약 — 검색과 상관없이 알린다.
  const broken = (promotions.data ?? []).filter(
    (promotion) =>
      promotion.status === 'ONGOING' &&
      promotionProductProblem(promotion, listedPreorders.data),
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
  // 고객 사전예약 상세(/preorder/{promotionId})가 곧 홍보 페이지다.
  const copyLink = (promotion: AdminPromotion) =>
    void copyText(`${location.origin}${preorderPath(promotion.promotionId)}`)
      .then(() => showToast('링크가 복사되었습니다!'))
      .catch(() => showToast('링크를 복사하지 못했습니다. 다시 시도해 주세요.'))

  const tabs = statusFilters.map(({ value, label }) => ({
    value,
    label: (
      <span className={styles.tabLabel}>
        {label}
        {/* 못 받았으면 숫자를 빼서 0개로 읽히지 않게 한다. */}
        {promotions.data && (
          <span className={styles.tabCount}>{counts[value]}</span>
        )}
      </span>
    ),
  }))

  const columns: TableColumn<AdminPromotion>[] = [
    {
      key: 'promotion',
      header: '사전예약',
      render: (promotion) => (
        <span className={styles.promotion}>
          <ImageWithFallback
            className={styles.thumbnail}
            src={promotion.thumbnailUrl}
            alt=""
          />
          <span className={styles.stacked}>
            <span className={styles.mainText}>{promotion.name}</span>
            <span className={styles.subText}>
              상세 이미지 {promotion.detailImageUrls.length}장 ·{' '}
              {editedLabel(promotion.updatedAt, now)}
            </span>
          </span>
        </span>
      ),
    },
    // 관리자 응답엔 상품 이름과 판매 방식뿐이라 접수 단계는 싣지 않는다.
    {
      key: 'products',
      header: '연결 상품',
      render: (promotion) => {
        const problem = promotionProductProblem(promotion, listedPreorders.data)
        const hidden = promotion.products.length - VISIBLE_PRODUCTS
        return (
          <span className={styles.stacked}>
            {promotion.products.length > 0 && (
              <span className={styles.products}>
                {promotion.products
                  .slice(0, VISIBLE_PRODUCTS)
                  .map((product) => (
                    <span key={product.productId} className={styles.product}>
                      {product.title}
                      {product.saleMode === 'IN_STOCK' && (
                        <span className={styles.productMode}>일반 상품</span>
                      )}
                    </span>
                  ))}
                {hidden > 0 && (
                  <span className={styles.subText}>+{hidden}</span>
                )}
              </span>
            )}
            {problem ? (
              <span className={styles.warnText}>{problem}</span>
            ) : (
              promotion.status !== 'ENDED' &&
              promotion.detailImageUrls.length === 0 && (
                <span className={styles.warnText}>상세 이미지가 없어요</span>
              )
            )}
          </span>
        )
      },
    },
    {
      key: 'period',
      header: '노출 기간',
      render: (promotion) => {
        const due = promotionDue(promotion, now.getTime())
        return (
          <span className={styles.stacked}>
            <span className={styles.number}>
              {formatPromotionPeriod(promotion)}
            </span>
            <span className={due.urgent ? styles.warnText : styles.subText}>
              {due.label}
            </span>
          </span>
        )
      },
    },
    {
      key: 'status',
      header: '상태',
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
      header: '링크',
      align: 'center',
      // 고객 상세는 기간이 지나면 404라 끝난 사전예약엔 링크를 주지 않는다.
      render: (promotion) =>
        promotion.status !== 'ENDED' && (
          <Button
            size="small"
            variant="subtle"
            color="cancel"
            icon={Link2}
            aria-label={`${promotion.name} 고객 페이지 링크 복사`}
            onClick={(event) => {
              // 행 클릭으로 상세까지 열리면 안 된다.
              event.stopPropagation()
              copyLink(promotion)
            }}
          />
        ),
    },
  ]

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>사전예약 관리</h1>
          <span className={styles.subText}>
            고객에게 보이는 사전예약 페이지예요. 접수 오픈·마감은 연결한
            상품에서 정해요.
          </span>
        </div>
        <Button icon={Plus} size="medium" onClick={startCreate}>
          새 사전예약
        </Button>
      </header>

      {broken.length > 0 && (
        <InlineAlert status="warning">
          <span className={styles.notice}>
            <span>
              <b>진행 중인 &quot;{broken[0].name}&quot;</b>
              {broken.length > 1 && ` 외 ${broken.length - 1}개`}:{' '}
              {promotionProductProblem(broken[0], listedPreorders.data)}. 고객
              페이지에 예약할 상품이 안 보여요.
            </span>
            <Button
              size="small"
              variant="outline"
              color="cancel"
              onClick={() => openDetail(broken[0])}
            >
              확인하기
            </Button>
          </span>
        </InlineAlert>
      )}

      <SegmentedTabs
        items={tabs}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <div className={styles.filters}>
        <div className={styles.searchField}>
          <Input
            label="사전예약명 · 연결 상품명 검색"
            size="small"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <Dropdown
          className={styles.field}
          label="정렬"
          fieldLabel="정렬"
          options={sortOptions}
          value={sort}
          onSelect={setSort}
        />
      </div>

      <Table
        columns={columns}
        rows={visiblePromotions}
        rowKey={(promotion) => promotion.promotionId}
        pageSize={10}
        onRowClick={openDetail}
        rowAction={{
          label: (promotion) => `${promotion.name} 상세 보기`,
          onClick: openDetail,
        }}
        loading={promotions.isPending}
        emptyMessage={
          promotions.isError
            ? getErrorMessage(
                promotions.error,
                '사전예약을 불러오지 못했습니다.',
              )
            : '조건에 맞는 사전예약이 없습니다.'
        }
      />
    </div>
  )
}
