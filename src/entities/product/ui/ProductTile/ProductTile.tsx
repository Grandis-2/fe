import type { MouseEventHandler, ReactNode } from 'react'

import { Link } from 'react-router'

import { productPath } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { formatWon } from '@shared/lib/formatNumber'
import { ImageWithFallback, PriceText } from '@shared/ui'

import * as styles from './ProductTile.css'

export type ProductTileProps = {
  productId: string | number
  // 검색어 강조처럼 쓰는 쪽이 꾸밀 수 있게 노드로 받는다.
  name: ReactNode
  imageUrl?: string | null
  // 판매 중 옵션이 없으면 최저가가 없어(null) 가격 줄을 비운다.
  price: number | null
  // 링크를 누를 때 — preventDefault하면 상세로 가지 않는다(사전예약 대기열 등).
  onLinkClick?: MouseEventHandler<HTMLAnchorElement>
}

// 이미지·이름·가격만 있는 작은 상품 카드(어두운 화면용). 옵션·색상까지 고르는 큰 카드는 ProductCard.
// 검색어 강조처럼 이름을 꾸며 넘길 수 있게 상품 객체 대신 값을 따로 받는다.
export function ProductTile({
  productId,
  name,
  imageUrl,
  price,
  onLinkClick,
}: ProductTileProps) {
  return (
    <Link
      to={productPath(productId)}
      className={styles.tile}
      onClick={onLinkClick}
    >
      <div className={styles.media}>
        <ImageWithFallback src={imageUrl} className={styles.image} />
      </div>
      <span className={[typography.body.subSemibold, styles.name].join(' ')}>
        {name}
      </span>
      {price !== null && (
        <span className={typography.body.defaultMedium}>
          <PriceText value={formatWon(price)} from />
        </span>
      )}
    </Link>
  )
}

export function ProductTileSkeleton() {
  return (
    <div className={styles.tile} aria-hidden>
      <div className={[styles.media, styles.mediaSkeleton].join(' ')} />
      <div className={styles.lineSkeleton} style={{ width: '70%' }} />
      <div className={styles.lineSkeleton} style={{ width: '40%' }} />
    </div>
  )
}
