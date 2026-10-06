import { Link } from 'react-router'

import { useProductCards } from '@entities/product'
import { productPath } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { formatWon } from '@shared/lib/formatNumber'
import { useScrollArrows } from '@shared/lib/useScrollArrows'
import { InlineAlert, PriceText, ScrollArrows } from '@shared/ui'

import * as styles from './ProductRanking.css'

const RANK_LIMIT = 10

const cardClass = (rank: number) =>
  [styles.card, styles.cardSize[rank < 10 ? 'single' : 'double']].join(' ')

// ponytail: 순위 API가 없어 베스트 상품 순서를 그대로 순위로 쓴다 — 순위 API가 생기면 교체.
export function ProductRanking() {
  const { data, isPending, isError } = useProductCards('best')
  const ranked = data?.slice(0, RANK_LIMIT)

  const { rowRef, onScroll, canPrev, canNext, page } = useScrollArrows(
    ranked?.length,
  )

  const message = isError
    ? '많이 찾는 상품을 불러오지 못했어요.'
    : ranked?.length === 0
      ? '아직 집계된 상품이 없어요.'
      : null

  return (
    <section className={styles.root} aria-labelledby="product-ranking-title">
      <div className={styles.header}>
        <h3
          id="product-ranking-title"
          className={[typography.title.xlSemibold, styles.title].join(' ')}
        >
          많이 찾는 상품 TOP {RANK_LIMIT}
        </h3>
        <ScrollArrows canPrev={canPrev} canNext={canNext} onPage={page} />
      </div>

      {message ? (
        <InlineAlert status={isError ? 'error' : 'info'}>{message}</InlineAlert>
      ) : (
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
              const image = product.colors[0]?.imageUrls[0]
              return (
                <Link
                  key={product.productId}
                  to={productPath(product.productId)}
                  className={cardClass(rank)}
                >
                  <div className={styles.visual}>
                    <span className={styles.rank} aria-hidden>
                      {rank}
                    </span>
                    <div className={styles.tile}>
                      {image && (
                        <img src={image} alt="" className={styles.image} />
                      )}
                    </div>
                  </div>
                  <div className={styles.info}>
                    <span
                      className={[
                        typography.body.subSemibold,
                        styles.name,
                      ].join(' ')}
                    >
                      <span className={styles.srOnly}>{rank}위 </span>
                      {product.name}
                    </span>
                    <span className={typography.body.subSemibold}>
                      <PriceText value={formatWon(product.basePrice)} />
                    </span>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}
    </section>
  )
}
