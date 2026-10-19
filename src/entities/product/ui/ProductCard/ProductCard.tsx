import { Link } from 'react-router'

import { productPath } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { formatNumber } from '@shared/lib/formatNumber'
import { Slider, Tag } from '@shared/ui'

import { ProductColorSwatches } from '../ProductColorSwatches'

import * as styles from './ProductCard.css'

import type { SaleMode } from '../../model/product'
import type { ProductColorSwatchItem } from '../ProductColorSwatches'

export type ProductCardData = {
  productId: string | number
  imageSrcs: string[]
  imageAlt?: string
  name: string
  modelNumber: string
  colorName: string
  colorSwatches: ProductColorSwatchItem[]
  basePrice: number
  // 0~100(%). 0이면 할인 표시 없이 basePrice만 그린다.
  discountRate?: number
  priceUnit?: string
  saleMode: SaleMode
}

export type ProductCardProps = {
  product: ProductCardData
  onColorSelect?: (index: number) => void
  className?: string
}

export function ProductCard({
  product,
  onColorSelect,
  className,
}: ProductCardProps) {
  const {
    productId,
    imageSrcs,
    imageAlt = '',
    name,
    modelNumber,
    colorName,
    colorSwatches,
    basePrice,
    discountRate = 0,
    priceUnit = '원',
    saleMode,
  } = product
  const isPreorder = saleMode === 'PREORDER'
  const salePrice = Math.round(basePrice * (1 - discountRate / 100))
  return (
    <div
      data-theme="dark"
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      <div className={styles.media}>
        {isPreorder && (
          <Tag color="preorder" size="small" className={styles.badge}>
            사전예약
          </Tag>
        )}
        <div className={styles.sliderFill}>
          {/* key를 imageSrcs에 묶어 Slider를 다시 마운트시킨다 — imageSrcs를 바꾸는 건
              색상 선택뿐이라(옵션 선택은 안 건드림), 이렇게 하면 색상 바뀔 때만
              슬라이더가 첫 장으로 리셋된다. */}
          <Slider key={imageSrcs.join('|')}>
            {imageSrcs.map((src) => (
              <img
                key={src}
                src={src}
                alt={imageAlt}
                className={styles.image}
              />
            ))}
          </Slider>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.nameGroup}>
          <Link to={productPath(productId)} className={styles.name}>
            {name}
          </Link>
          {modelNumber && (
            <div
              className={[typography.body.sub, styles.modelNumber].join(' ')}
            >
              {modelNumber}
            </div>
          )}
        </div>
        <ProductColorSwatches
          colorName={colorName}
          size="small"
          colors={colorSwatches}
          onSelect={onColorSelect}
        />
        <div
          className={[typography.body.subSemibold, styles.priceRow].join(' ')}
        >
          {discountRate > 0 && (
            <>
              <del
                className={[typography.body.sub, styles.originalPrice].join(
                  ' ',
                )}
              >
                {formatNumber(basePrice)}
                {priceUnit}
              </del>
              <span
                className={[
                  typography.title.mdSemibold,
                  styles.discountRate,
                ].join(' ')}
              >
                {discountRate}%
              </span>
            </>
          )}
          <span
            className={[typography.title.mdSemibold, styles.priceAmount].join(
              ' ',
            )}
          >
            {formatNumber(salePrice)}
          </span>
          {/* 색상·옵션에 따라 오르는 시작가라 '부터'를 붙인다. */}
          <span
            className={[typography.body.subMedium, styles.priceUnit].join(' ')}
          >
            {priceUnit}부터
          </span>
        </div>
      </div>
    </div>
  )
}

export function ProductCardSkeleton({
  className,
}: Pick<ProductCardProps, 'className'>) {
  return (
    <div
      data-theme="dark"
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-hidden
    >
      <div className={styles.skeletonMedia} />
      <div className={styles.skeletonDots}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={styles.skeletonDot} />
        ))}
      </div>
      <div className={styles.content}>
        <div className={styles.nameGroup}>
          <div
            className={styles.skeletonLine}
            style={{ height: '20px', width: '72%' }}
          />
          <div
            className={styles.skeletonLine}
            style={{ height: '14px', width: '38%' }}
          />
        </div>
        <div className={styles.skeletonSwatches}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={styles.skeletonSwatch} />
          ))}
        </div>
        <div
          className={styles.skeletonLine}
          style={{ height: '24px', width: '52%', marginTop: '6px' }}
        />
      </div>
    </div>
  )
}
