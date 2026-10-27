import { Link } from 'react-router'

import { useProductRanking } from '@entities/product'
import { useRequireLogin } from '@features/login'
import { enterPreorderOnClick } from '@features/preorder-queue'
import { productPath } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { formatWon } from '@shared/lib/formatNumber'
import { useScrollArrows } from '@shared/lib/useScrollArrows'
import { ImageWithFallback, PriceText, ScrollArrows, Tag } from '@shared/ui'

import * as styles from './ProductRanking.css'

const RANK_LIMIT = 10

const cardClass = (rank: number) =>
  [styles.card, styles.cardSize[rank < 10 ? 'single' : 'double']].join(' ')

// 최근 3일 조회수 순 최대 10개. 집계가 없거나(빈 목록) 읽지 못하면(503 등) 명세대로 영역째 숨긴다.
export function ProductRanking() {
  const { data: ranked, isPending, isError } = useProductRanking()
  const enterPreorder = enterPreorderOnClick(useRequireLogin())

  const { rowRef, onScroll, canPrev, canNext, page } = useScrollArrows(
    ranked?.length,
  )

  if (isError || ranked?.length === 0) return null

  return (
    <section className={styles.root} aria-labelledby="product-ranking-title">
      <div className={styles.header}>
        <h3
          id="product-ranking-title"
          className={[typography.title.xlSemibold, styles.title].join(' ')}
        >
          {/* 10개보다 적게 올 수 있다. */}
          많이 찾는 상품 TOP {ranked?.length ?? RANK_LIMIT}
        </h3>
        <ScrollArrows canPrev={canPrev} canNext={canNext} onPage={page} />
      </div>

      <div
        ref={rowRef}
        className={styles.row}
        aria-busy={isPending}
        onScroll={onScroll}
      >
        {isPending ? (
          <>
            <span className={styles.srOnly}>상품 불러오는 중</span>
            {Array.from({ length: RANK_LIMIT }, (_, i) => (
              <div key={i} className={cardClass(i + 1)} aria-hidden>
                <div className={styles.visual}>
                  <span className={styles.rankSkeleton}>{i + 1}</span>
                  <div className={styles.tileSkeleton} />
                </div>
                <div className={styles.info}>
                  <div
                    className={styles.lineSkeleton}
                    style={{ width: '70%' }}
                  />
                  <div
                    className={styles.lineSkeleton}
                    style={{ width: '45%' }}
                  />
                </div>
              </div>
            ))}
          </>
        ) : (
          ranked?.map((product, i) => {
            const rank = i + 1
            return (
              <Link
                key={product.productId}
                to={productPath(product.productId)}
                className={cardClass(rank)}
                onClick={enterPreorder(product)}
              >
                <div className={styles.visual}>
                  <span className={styles.rank} aria-hidden>
                    {rank}
                  </span>
                  <div className={styles.tile}>
                    {product.saleMode === 'PREORDER' && (
                      <Tag
                        color="preorder"
                        size="small"
                        className={styles.badge}
                      >
                        사전예약
                      </Tag>
                    )}
                    <ImageWithFallback
                      src={product.imageUrl}
                      className={styles.image}
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className={styles.info}>
                  <span
                    className={[typography.body.subSemibold, styles.name].join(
                      ' ',
                    )}
                  >
                    <span className={styles.srOnly}>{rank}위 </span>
                    {product.title}
                  </span>
                  {product.minPrice !== null && (
                    <span className={typography.body.subSemibold}>
                      <PriceText value={formatWon(product.minPrice)} from />
                    </span>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </section>
  )
}
