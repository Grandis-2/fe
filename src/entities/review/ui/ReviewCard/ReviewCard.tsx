import { typography } from '@shared/config/theme'
import { formatDotDate } from '@shared/lib/formatDotDate'
import { ImageWithFallback, Skeleton } from '@shared/ui'

import * as styles from './ReviewCard.css'

import type { Review } from '../../model/review'

const MAX_RATING = 5

export type ReviewCardProps = {
  review: Pick<
    Review,
    | 'imageUrl'
    | 'rating'
    | 'body'
    | 'productTitle'
    | 'optionTitle'
    | 'authorName'
    | 'createdAt'
  >
  // 상품 상세처럼 한 상품의 후기만 모인 곳에선 꺼서 사진·상품명 없이 옵션만 보인다.
  showProduct?: boolean
  className?: string
}

export function ReviewCard({
  review,
  showProduct = true,
  className,
}: ReviewCardProps) {
  const {
    imageUrl,
    rating,
    body,
    productTitle,
    optionTitle,
    authorName,
    createdAt,
  } = review
  // rating이 API/목업 오류로 범위를 벗어나거나(음수, 5 초과) 정수가 아니어도
  // 별점 라벨과 채워지는 별 개수가 항상 같은 값을 보도록 먼저 정규화한다.
  const safeRating = Number.isFinite(rating)
    ? Math.min(MAX_RATING, Math.max(0, Math.round(rating)))
    : 0
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {showProduct && (
        <ImageWithFallback
          src={imageUrl}
          className={styles.thumbnail}
          loading="lazy"
        />
      )}
      <div className={styles.main}>
        <div className={styles.header}>
          <div
            className={styles.rating}
            role="img"
            aria-label={`별점 ${safeRating}점`}
          >
            {Array.from({ length: MAX_RATING }, (_, index) => (
              <span
                key={index}
                className={styles.star[index < safeRating ? 'filled' : 'empty']}
                aria-hidden="true"
              >
                ★
              </span>
            ))}
          </div>
          <div className={[typography.body.sub, styles.meta].join(' ')}>
            {authorName} · {formatDotDate(createdAt)}
          </div>
        </div>
        <div
          className={[typography.body.defaultRegular, styles.reviewText].join(
            ' ',
          )}
        >
          {body}
        </div>
        <div className={[typography.body.sub, styles.productName].join(' ')}>
          {showProduct ? `${productTitle} · ${optionTitle}` : optionTitle}
        </div>
      </div>
    </div>
  )
}

// 썸네일·별점·본문·옵션 자리를 같은 크기로 깔아 응답이 와도 높이가 튀지 않게 한다.
// 스크린리더 안내는 감싸는 SkeletonGroup이 한 번만 한다.
export function ReviewCardSkeleton({
  showProduct = true,
  className,
}: Pick<ReviewCardProps, 'showProduct' | 'className'>) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {showProduct && <Skeleton width={120} height={120} radius={8} />}
      <div className={styles.main}>
        <div className={styles.header}>
          <Skeleton width={96} height={18} />
          <Skeleton width={110} height={14} />
        </div>
        <Skeleton width="80%" height={20} />
        <Skeleton width="40%" height={16} />
      </div>
    </div>
  )
}
