import { useState, type MouseEventHandler } from 'react'

import { Link } from 'react-router'

import { productPath } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { formatNumber } from '@shared/lib/formatNumber'
import { usePreloadedSrcs } from '@shared/lib/usePreloadedSrcs'
import { ImageWithFallback, Slider, Tag } from '@shared/ui'

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
  // 상품명 링크를 누를 때 — preventDefault하면 상세로 가지 않는다(사전예약 대기열 등).
  onLinkClick?: MouseEventHandler<HTMLAnchorElement>
  className?: string
}

export function ProductCard({
  product,
  onColorSelect,
  onLinkClick,
  className,
}: ProductCardProps) {
  const {
    productId,
    imageSrcs: nextImageSrcs,
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
  // 색을 바꿔도 새 사진을 다 받기 전까진 이전 사진을 둔다.
  const imageSrcs = usePreloadedSrcs(nextImageSrcs)
  // 지금 보고 있는 슬라이드. 색을 고르면 0으로 돌려 첫 장부터 보인다 — 슬라이더(Swiper)는 그대로 두고
  // 사진만 바꾼다. key로 다시 마운트하면 색을 고를 때마다 Swiper를 새로 만들어 버벅인다.
  const [slideIndex, setSlideIndex] = useState(0)
  const selectColor = (index: number) => {
    setSlideIndex(0)
    onColorSelect?.(index)
  }
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
          {imageSrcs.length > 0 ? (
            <Slider
              activeIndex={slideIndex}
              onActiveIndexChange={setSlideIndex}
            >
              {imageSrcs.map((src) => (
                <ImageWithFallback
                  key={src}
                  src={src}
                  alt={imageAlt}
                  className={styles.image}
                />
              ))}
            </Slider>
          ) : (
            <ImageWithFallback alt={imageAlt} className={styles.image} />
          )}
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.nameGroup}>
          <Link
            to={productPath(productId)}
            className={styles.name}
            onClick={onLinkClick}
          >
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
          onSelect={onColorSelect && selectColor}
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
