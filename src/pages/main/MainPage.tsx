import { brandMenus } from '@entities/product'
import { Container } from '@shared/ui'
import { Banner } from '@widgets/banner'
import { CategoryProducts } from '@widgets/category-products'
import { ProductRanking } from '@widgets/product-ranking'

import * as styles from './MainPage.css'

export function MainPage() {
  return (
    <>
      {/* data-header-theme="dark": 헤더가 이 구간 위에 있는 동안 흰 글자로 바뀐다(Header.tsx). */}
      <div className={styles.bannerOverlap} data-header-theme="dark">
        <Banner />
      </div>

      <div className={styles.hero} data-header-theme="dark">
        <Container>
          <div className={styles.sections}>
            <ProductRanking />
            {Object.keys(brandMenus).map((category) => (
              <CategoryProducts key={category} category={category} />
            ))}
          </div>
        </Container>
      </div>
    </>
  )
}
