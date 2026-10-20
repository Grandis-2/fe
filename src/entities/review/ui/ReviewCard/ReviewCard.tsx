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
  className?: string
}

export function ReviewCard({ review, className }: ReviewCardProps) {
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
      <ImageWithFallback src={imageUrl} className={styles.thumbnail} />
      <div className={styles.main}>
        <div className={styles.top}>
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
          <div
            className={[typography.body.defaultRegular, styles.reviewText].join(
              ' ',
            )}
          >
            {body}
          </div>
        </div>
        <div className={[typography.body.sub, styles.productName].join(' ')}>
          {productTitle} · {optionTitle}
        </div>
      </div>
      <div className={[typography.body.sub, styles.meta].join(' ')}>
        <span>{authorName}</span>
        <span>{formatDotDate(createdAt)}</span>
      </div>
    </div>
  )
}

// 썸네일·별점·본문·상품명 자리를 같은 크기로 깔아 응답이 와도 높이가 튀지 않게 한다.
// 스크린리더 안내는 감싸는 SkeletonGroup이 한 번만 한다.
export function ReviewCardSkeleton({
  className,
}: Pick<ReviewCardProps, 'className'>) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <Skeleton width={120} height={120} radius={8} />
      <div className={styles.main}>
        <div className={styles.top}>
          <Skeleton width={96} height={18} />
          <Skeleton width="80%" height={20} />
        </div>
        <Skeleton width="40%" height={16} />
      </div>
    </div>
  )
}
