import { useState } from 'react'

import { GripVertical, Plus, X } from 'lucide-react'

import {
  linkedProductStage,
  linkedProductStageColor,
  linkedProductStageLabel,
  linkedProductStageLabels,
  PROMOTION_PRODUCTS_MAX,
  type PromotionLinkableProduct,
} from '@entities/admin-promotion'
import { useDragReorder } from '@shared/lib/useDragReorder'
import { Button, Checkbox, Skeleton, SkeletonGroup, Tag } from '@shared/ui'

import * as styles from './PromotionProductLinker.css'

export type PromotionProductLinkerProps = {
  /** 묶을 수 있는 상품 — 수정 화면이면 이미 묶인 상품도 들어 있다 */
  products: PromotionLinkableProduct[]
  /** 상품 목록을 받는 중 — '상품 없음' 대신 줄 모양을 먼저 깐다 */
  loading?: boolean
  /** 연결할 상품들(보이는 순서) — 폼을 저장할 때 함께 저장된다 */
  value: string[]
  /** 저장돼 있던 연결 — 여기 없는 상품은 '새로 연결'로 표시한다. 등록 화면은 비운다 */
  saved?: string[]
  onChange: (productIds: string[]) => void
  onAddProduct: () => void
  /** 단계(오픈 전·후)를 가를 지금 시각 */
  now: number
}

const optionSummary = ({ colors, storages }: PromotionLinkableProduct) =>
  [
    colors.length > 0 && `색상 ${colors.length}`,
    storages.length > 0 && `용량 ${storages.length}`,
  ].filter(Boolean)

/**
 * 연결한 상품을 고객 페이지에 보일 순서대로 늘어놓고, 끌거나 ↑/↓로 순서를 바꾸고 ×로 뺀다.
 * 새로 묶을 상품은 '사전예약 상품 연결'을 눌러 펼친 후보에서 고른다 — 후보를 늘 펼쳐 두면
 * 상품이 많을 때 무엇을 골랐는지 찾기 어렵다.
 */
export function PromotionProductLinker({
  products,
  loading = false,
  value,
  saved = [],
  onChange,
  onAddProduct,
  now,
}: PromotionProductLinkerProps) {
  const [picking, setPicking] = useState(false)
  const { draggingId, itemProps } = useDragReorder({
    ids: value,
    onReorder: (next) => onChange(next),
  })

  const byId = new Map(products.map((product) => [product.productId, product]))
  const candidates = products.filter(
    (product) => !value.includes(product.productId),
  )
  const isFull = value.length >= PROMOTION_PRODUCTS_MAX

  const toggle = (productId: string) =>
    onChange(
      value.includes(productId)
        ? value.filter((id) => id !== productId)
        : [...value, productId],
    )

  if (loading) {
    return (
      <SkeletonGroup className={styles.list}>
        {[0, 1].map((row) => (
          <div key={row} className={styles.skeletonRow}>
            <Skeleton width="40%" height={20} />
            <Skeleton width={160} height={16} />
          </div>
        ))}
      </SkeletonGroup>
    )
  }

  return (
    <div className={styles.root}>
      {value.length === 0 ? (
        <div className={styles.empty}>연결한 상품이 없습니다.</div>
      ) : (
        <ol className={styles.list} aria-label="연결한 상품">
          {value.map((productId, index) => {
            const product = byId.get(productId)
            const name = product?.name ?? '불러오지 못한 상품'
            const stage = product && linkedProductStage(product, now)
            const isNew = !saved.includes(productId)
            return (
              <li
                key={productId}
                className={[
                  styles.row,
                  isNew && saved.length > 0 && styles.rowNew,
                  draggingId === productId && styles.rowDragging,
                ]
                  .filter(Boolean)
                  .join(' ')}
                {...itemProps(productId)}
                // 끌기를 못 쓰는 사용자를 위해 포커스한 줄은 ↑/↓로 옮긴다.
                tabIndex={0}
                aria-label={`${index + 1}번째 ${name}, 위아래 화살표로 순서 바꾸기`}
              >
                <GripVertical className={styles.grip} aria-hidden="true" />
                <span className={styles.body}>
                  <span className={styles.name}>{name}</span>
                  <span className={styles.meta}>
                    {[
                      product?.openAtLabel,
                      ...(product ? optionSummary(product) : []),
                      isNew &&
                        saved.length > 0 &&
                        '새로 연결 — 저장하면 반영돼요',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                {stage && (
                  <Tag
                    variant="subtle"
                    size="medium"
                    rounded={false}
                    widthOptions={linkedProductStageLabels}
                    color={linkedProductStageColor[stage]}
                  >
                    {linkedProductStageLabel[stage]}
                  </Tag>
                )}
                <Button
                  size="small"
                  variant="subtle"
                  color="cancel"
                  icon={X}
                  aria-label={`${name} 연결 빼기`}
                  onClick={() => toggle(productId)}
                />
              </li>
            )
          })}
        </ol>
      )}

      <div className={styles.actions}>
        <Button
          size="small"
          variant="outline"
          color="cancel"
          icon={Plus}
          aria-expanded={picking}
          disabled={isFull}
          onClick={() => setPicking((open) => !open)}
        >
          사전예약 상품 연결
        </Button>
        <Button
          size="small"
          variant="outline"
          color="cancel"
          onClick={onAddProduct}
        >
          새 상품 등록
        </Button>
      </div>

      {picking &&
        !isFull &&
        (candidates.length === 0 ? (
          <div className={styles.empty}>
            더 연결할 수 있는 사전예약 상품이 없습니다.
          </div>
        ) : (
          <div className={styles.candidates} aria-label="연결할 수 있는 상품">
            {candidates.map((product) => (
              <button
                key={product.productId}
                type="button"
                className={styles.candidate}
                onClick={() => toggle(product.productId)}
              >
                {/* 줄 전체가 버튼이라 체크박스는 표시만 하고 클릭은 받지 않는다. */}
                <Checkbox checked={false} readOnly tabIndex={-1} />
                <span className={styles.body}>
                  <span className={styles.name}>{product.name}</span>
                  <span className={styles.meta}>
                    {[product.openAtLabel, ...optionSummary(product)].join(
                      ' · ',
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ))}

      <span className={styles.hint}>
        최대 {PROMOTION_PRODUCTS_MAX}개 · 한 상품은 사전예약 하나에만
        연결돼요(다른 곳에 연결된 상품은 후보에 안 나와요) · 비공개·준비 중
        상품도 고를 수 있지만 고객 화면엔 공개된 상품만 보여요
      </span>
    </div>
  )
}
