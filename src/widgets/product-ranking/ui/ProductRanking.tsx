import { useCallback, useEffect, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import { useProductCards } from '@entities/product'
import { productPath } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { formatWon } from '@shared/lib/formatNumber'
import { InlineAlert, PriceText } from '@shared/ui'

import * as styles from './ProductRanking.css'

const RANK_LIMIT = 10
// 화살표 한 번에 보이는 폭의 85%만 넘겨, 직전 카드 끝이 살짝 남아 이어지는 줄임을 알 수 있게 한다.
const PAGE_RATIO = 0.85

const cardClass = (rank: number) =>
  [styles.card, styles.cardSize[rank < 10 ? 'single' : 'double']].join(' ')

// ponytail: 순위 API가 없어 베스트 상품 순서를 그대로 순위로 쓴다 — 순위 API가 생기면 교체.
export function ProductRanking() {
  const { data, isPending, isError } = useProductCards('best')
  const ranked = data?.slice(0, RANK_LIMIT)

  const rowRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  // 끝에 닿으면 그쪽 화살표를 끈다. 스크롤·줄 폭 변화·목록이 채워질 때마다 다시 잰다.
  const syncArrows = useCallback(() => {
    const el = rowRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])
  const rankedCount = ranked?.length
  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    // 줄 자체의 폭은 그대로라 목록이 채워져도 ResizeObserver가 안 불린다 — 개수가 바뀌면 한 번 더 잰다.
    const observer = new ResizeObserver(syncArrows)
    observer.observe(el)
    return () => observer.disconnect()
  }, [syncArrows, rankedCount])

  const page = (dir: 1 | -1) => {
    const el = rowRef.current
    el?.scrollBy({ left: dir * el.clientWidth * PAGE_RATIO })
  }

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
        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.arrow}
            aria-label="이전 상품"
            disabled={!canPrev}
            onClick={() => page(-1)}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            className={styles.arrow}
            aria-label="다음 상품"
            disabled={!canNext}
            onClick={() => page(1)}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      </div>

      {message ? (
        <InlineAlert status={isError ? 'error' : 'info'}>{message}</InlineAlert>
      ) : (
        <div
          ref={rowRef}
          className={styles.row}
          aria-busy={isPending}
          onScroll={syncArrows}
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
