import { ProductCard, useProductCards } from '@entities/product'
import { useProductCardSelection } from '@features/product-card-select'
import { typography } from '@shared/config/theme'
import { Container, InlineAlert } from '@shared/ui'
import { Banner } from '@widgets/banner'
import { ProductRanking } from '@widgets/product-ranking'

import * as styles from './MainPage.css'

export function MainPage() {
  const recommendedQuery = useProductCards('recommend')
  const recommendedProducts = recommendedQuery.data ?? []

  const { getCardProps } = useProductCardSelection()

  // 로딩·에러·빈 결과를 그리드 자리에 그대로 채워 넣는다.
  const recommendedMessage = recommendedQuery.isPending
    ? '불러오는 중이에요.'
    : recommendedQuery.isError
      ? '추천 상품을 불러오지 못했어요.'
      : recommendedProducts.length === 0
        ? '아직 등록된 추천 상품이 없어요.'
        : null

  return (
    <>
      {/* data-header-theme="dark": 헤더가 이 구간 위에 있는 동안 흰 글자로 바뀐다(Header.tsx). */}
      <div className={styles.bannerOverlap} data-header-theme="dark">
        <Banner />
      </div>

      <div className={styles.hero} data-header-theme="dark">
        <Container>
          <ProductRanking />
        </Container>
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
