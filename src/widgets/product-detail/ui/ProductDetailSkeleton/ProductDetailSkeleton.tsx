import { Skeleton, SkeletonGroup } from '@shared/ui'

import * as overview from '../ProductOverview/ProductOverview.css'

import * as styles from './ProductDetailSkeleton.css'

const OptionGroupSkeleton = ({
  labelWidth,
  rows,
}: {
  labelWidth: number
  rows: number
}) => (
  <div className={styles.group}>
    <Skeleton width={labelWidth} height={18} />
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} height={58} radius={12} />
    ))}
  </div>
)

/**
 * 상품 상세를 불러오는 동안의 자리 — 사진·옵션 패널, 탭, 첫 영역을 실제 배치대로 깐다.
 * 두 칸 배치는 ProductOverview의 클래스를 그대로 써서 다 왔을 때 자리가 튀지 않는다.
 */
export function ProductDetailSkeleton() {
  return (
    <SkeletonGroup>
      <div className={styles.content}>
        <div className={overview.layout}>
          <div className={overview.imageColumn}>
            <div className={styles.imageFrame}>
              <Skeleton height="auto" radius={14} />
            </div>
            <div className={styles.thumbnails}>
              {[0, 1].map((i) => (
                <Skeleton key={i} width={76} height={76} radius={12} />
              ))}
            </div>
          </div>

          <div className={overview.optionPanel}>
            <div className={overview.titleGroup}>
              <Skeleton width="62%" height={32} radius={8} />
              <Skeleton width={64} height={15} />
            </div>
            <OptionGroupSkeleton labelWidth={48} rows={2} />
            <div className={styles.group}>
              <Skeleton width={48} height={18} />
              <div className={styles.swatches}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className={styles.swatch}>
                    <Skeleton width={34} height={34} radius={17} />
                    <Skeleton width={56} height={12} />
                  </div>
                ))}
              </div>
            </div>
            <OptionGroupSkeleton labelWidth={40} rows={3} />

            <div className={styles.summary}>
              <div className={styles.summarySelected}>
                <Skeleton width={72} height={14} />
                <div className={styles.chips}>
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} width={72} height={32} radius={8} />
                  ))}
                </div>
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} className={styles.summaryRow}>
                  <Skeleton width={88} height={15} />
                  <Skeleton width={96} height={15} />
                </div>
              ))}
              <div className={styles.summaryTotal}>
                <Skeleton width={88} height={16} />
                <Skeleton width={140} height={26} />
              </div>
              <div className={styles.actions}>
                <span className={styles.cartButton} />
                <span className={styles.checkoutButton} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tabBar}>
        <div className={styles.tabs}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.tab}>
              <Skeleton width={72} height={16} />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <Skeleton width={120} height={26} radius={8} />
        <Skeleton tone="dark" height={360} radius={20} />
      </div>

      <div className={styles.bottomBar}>
        <span className={styles.bottomCart} />
        <span className={styles.bottomCheckout} />
      </div>
    </SkeletonGroup>
  )
}
