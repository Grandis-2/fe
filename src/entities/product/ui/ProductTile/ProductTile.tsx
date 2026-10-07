import type { ReactNode } from 'react'

import { Link } from 'react-router'

import { productPath } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { formatWon } from '@shared/lib/formatNumber'
import { PriceText } from '@shared/ui'

import * as styles from './ProductTile.css'

export type ProductTileProps = {
  productId: string | number
  // 검색어 강조처럼 쓰는 쪽이 꾸밀 수 있게 노드로 받는다.
  name: ReactNode
  imageUrl?: string | null
  // 판매 중 옵션이 없으면 최저가가 없어(null) 가격 줄을 비운다.
  price: number | null
}

// 이미지·이름·가격만 있는 작은 상품 카드(어두운 화면용). 옵션·색상까지 고르는 큰 카드는 ProductCard.
// 검색어 강조처럼 이름을 꾸며 넘길 수 있게 상품 객체 대신 값을 따로 받는다.
export function ProductTile({
  productId,
  name,
  imageUrl,
  price,
}: ProductTileProps) {
  return (
    <Link to={productPath(productId)} className={styles.tile}>
      <div className={styles.media}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className={styles.image}
            // 이미지를 못 받으면 깨진 아이콘 대신 빈 타일로 둔다.
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden'
            }}
          />
        )}
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
      <div className={[styles.media, styles.skeleton].join(' ')} />
      <div className={styles.lineSkeleton} style={{ width: '70%' }} />
      <div className={styles.lineSkeleton} style={{ width: '40%' }} />
    </div>
  )
}
