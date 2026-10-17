import type { Product } from '@entities/product'

import { detailImages, type DetailSection } from '../../lib/productDetail'

import * as styles from './ProductDetailImages.css'

export type ProductDetailImagesProps = {
  product: Pick<Product, 'title' | 'images'>
  section: DetailSection
}

// 영역(구매 혜택·모델 정보·유의 사항) 사진을 위에서 아래로 이어 붙인다. 없으면 빈 자리를 알린다.
export function ProductDetailImages({
  product,
  section,
}: ProductDetailImagesProps) {
  const images = detailImages(product, section)

  if (images.length === 0) {
    return <div className={styles.empty}>{section} 이미지가 아직 없어요.</div>
  }

  return (
    <div className={styles.images}>
      {images.map((url, index) => (
        <img
          key={url}
          className={styles.image}
          src={url}
          alt={`${product.title} ${section} ${index + 1}`}
          loading="lazy"
        />
      ))}
    </div>
  )
}
