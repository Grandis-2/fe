import { useState } from 'react'

import { Slider } from '@shared/ui'

import * as styles from './ProductGallery.css'

export type ProductGalleryProps = {
  images: string[]
  // 이미지 alt와 미리보기 버튼 라벨에 쓰는 상품명
  productName: string
}

// 상품 이미지 슬라이더 + 그 밑 미리보기(웹 전용). 둘이 같은 이미지를 가리키도록 현재 번호를
// 여기서 들고 있는다 — 페이지는 이미지 목록만 넘긴다.
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [imageIndex, setImageIndex] = useState(0)

  return (
    <>
      <div className={styles.imageFrame}>
        <div className={styles.sliderFill}>
          <Slider
            navigation
            activeIndex={imageIndex}
            onActiveIndexChange={setImageIndex}
          >
            {images.map((src) => (
              <img
                key={src}
                src={src}
                alt={productName}
                className={styles.image}
              />
            ))}
          </Slider>
        </div>
      </div>
      {/* 웹에서만 슬라이더 밑에 미리보기를 보여준다. 누르면 그 이미지로 이동한다. */}
      <div className={styles.thumbnails}>
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            aria-label={`${productName} 이미지 ${index + 1}`}
            aria-pressed={index === imageIndex}
            className={[
              styles.thumbnail,
              index === imageIndex && styles.thumbnailSelected,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setImageIndex(index)}
          >
            <img src={src} alt="" className={styles.thumbnailImage} />
          </button>
        ))}
      </div>
    </>
  )
}
