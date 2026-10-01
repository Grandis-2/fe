import AutoScroll from 'embla-carousel-auto-scroll'
import useEmblaCarousel from 'embla-carousel-react'

import { ProductCard, useProductCards } from '@/entities/product'
import { useProductCardSelection } from '@/features/product-card-select'
import { typography } from '@/shared/config/theme'
import { Container, InlineAlert } from '@/shared/ui'
import { Banner } from '@/widgets/banner'

import * as styles from './MainPage.css'

// Embla loop는 콘텐츠 총 너비가 부족하면 이음매에서 "loop fallback"으로 점프한다 —
// 뷰포트의 2배 남짓으로는 여전히 빠듯해서 그 지점에서 튀어 보이므로, 실제 상품
// 세트를 여러 번 반복해 여유 있게 버퍼를 키운다.
const BEST_CAROUSEL_BUFFER = 4

export function MainPage() {
  const bestQuery = useProductCards('best')
  const recommendedQuery = useProductCards('recommend')
  const bestProducts = bestQuery.data ?? []
  const recommendedProducts = recommendedQuery.data ?? []

  const { getCardProps } = useProductCardSelection()

  // 로딩·에러·빈 결과를 캐러셀/그리드 자리에 그대로 채워 넣는다.
  const bestMessage = bestQuery.isPending
    ? '불러오는 중이에요.'
    : bestQuery.isError
      ? '베스트 상품을 불러오지 못했어요.'
      : bestProducts.length === 0
        ? '아직 등록된 베스트 상품이 없어요.'
        : null
  const recommendedMessage = recommendedQuery.isPending
    ? '불러오는 중이에요.'
    : recommendedQuery.isError
      ? '추천 상품을 불러오지 못했어요.'
      : recommendedProducts.length === 0
        ? '아직 등록된 추천 상품이 없어요.'
        : null

  // dragFree: 스냅포인트 없이 자유롭게 흐르도록 — 없으면 오토스크롤이 슬라이드 경계마다 멈칫하며 들러붙는다.
  const [emblaRef] = useEmblaCarousel(
    { loop: true, dragFree: true, align: 'start' },
    [AutoScroll({ speed: 1, stopOnInteraction: false })],
  )

  return (
    <>
      {/* data-header-theme="dark": 헤더가 이 구간 위에 있는 동안 흰 글자로 바뀐다(Header.tsx). */}
      <div className={styles.bannerOverlap} data-header-theme="dark">
        <Banner />
      </div>

      <div className={styles.hero} data-header-theme="dark">
        {/* <SwirlBackground /> */}
        <div className={styles.bestTitle}>베스트 상품을 만나보세요</div>
        {/* 어두운 히어로 안이지만 흰 카드가 대부분을 덮는 구간이라 밝은 구간으로 표시한다. */}
        {bestMessage ? (
          <InlineAlert status={bestQuery.isError ? 'error' : 'info'}>
            {bestMessage}
          </InlineAlert>
        ) : (
          <div
            className={styles.carouselViewport}
            ref={emblaRef}
            data-header-theme="light"
          >
            <div className={styles.carouselContainer}>
              {Array.from(
                { length: bestProducts.length * BEST_CAROUSEL_BUFFER },
                (_, i) => {
                  const product = bestProducts[i % bestProducts.length]
                  return (
                    <div
                      key={`${product.productId}-${i}`}
                      className={styles.carouselSlide}
                    >
                      <ProductCard {...getCardProps(product)} />
                    </div>
                  )
                },
              )}
            </div>
          </div>
        )}
      </div>

      <Container>
        <div
          className={[
            typography.title.xlSemibold,
            styles.recommendedTitle,
          ].join(' ')}
        >
          추천 상품
        </div>
        {recommendedMessage ? (
          <InlineAlert status={recommendedQuery.isError ? 'error' : 'info'}>
            {recommendedMessage}
          </InlineAlert>
        ) : (
          <div className={styles.recommendedSection}>
            {recommendedProducts.map((product) => (
              <ProductCard key={product.productId} {...getCardProps(product)} />
            ))}
          </div>
        )}
      </Container>
    </>
  )
}
