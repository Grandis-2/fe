import { Link } from 'react-router'

import { typography } from '@/shared/config/theme'
import { formatNumber } from '@/shared/lib/formatNumber'
import { Slider, Tag } from '@/shared/ui'

import { ProductColorSwatches } from '../ProductColorSwatches'
import { ProductOptionSelector } from '../ProductOptionSelector'

import * as styles from './ProductCard.css'

import type { SaleMode } from '../../model/productCard'
import type { ProductColorSwatchItem } from '../ProductColorSwatches'
import type { ProductOption } from '../ProductOptionSelector'

export type ProductCardOption = ProductOption

export type ProductCardData = {
  productId: string
  imageSrcs: string[]
  imageAlt?: string
  name: string
  modelNumber: string
  colorName: string
  colorSwatches: ProductColorSwatchItem[]
  options: ProductCardOption[]
  basePrice: number
  priceUnit?: string
  saleMode: SaleMode
}

export type ProductCardProps = {
  product: ProductCardData
  onColorSelect?: (index: number) => void
  onOptionSelect?: (index: number) => void
  className?: string
}

export function ProductCard({
  product,
  onColorSelect,
  onOptionSelect,
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
    options,
    basePrice,
    priceUnit = '원',
    saleMode,
  } = product
  const selectedOption = options.find((option) => option.selected)
  const totalPrice = basePrice + (selectedOption?.extraPrice ?? 0)
  const isPreorder = saleMode === 'PREORDER'
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.media}>
        {isPreorder && (
          <Tag color="primary" size="small" className={styles.badge}>
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
          <Link to={`/products/${productId}`} className={styles.name}>
            {name}
          </Link>
          <div className={[typography.body.sub, styles.modelNumber].join(' ')}>
            {modelNumber}
          </div>
        </div>
        <ProductColorSwatches
          colorName={colorName}
          size="small"
          colors={colorSwatches}
          onSelect={onColorSelect}
        />
        <ProductOptionSelector
          label="용량"
          size="small"
          options={options}
          onSelect={onOptionSelect}
        />
        <div
          className={[typography.body.subSemibold, styles.priceRow].join(' ')}
        >
          <span
            className={[typography.title.lgSemibold, styles.priceAmount].join(
              ' ',
            )}
          >
            {formatNumber(totalPrice)}
          </span>
          <span
            className={[typography.title.mdSemibold, styles.priceUnit].join(
              ' ',
            )}
          >
            {priceUnit}
          </span>
        </div>
      </div>
    </div>
  )
}
