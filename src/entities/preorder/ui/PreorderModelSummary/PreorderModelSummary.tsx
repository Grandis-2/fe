import { typography } from '@shared/config/theme'
import { Button } from '@shared/ui'

import * as styles from './PreorderModelSummary.css'

export type PreorderModelSummaryProps = {
  imageSrc?: string
  imageAlt?: string
  name: string
  opensAtLabel: string
  // 예약 시작 전/후, 그리고 시작 전이라면 알림 신청을 이미 했는지 — CTA 라벨/동작이 이 두
  // 상태 조합으로 갈린다 (예약 하기 / 알림 신청 / 신청 완료).
  isOver: boolean
  isAlert: boolean
  onReserve?: () => void
  onNotify?: () => void
  className?: string
}

export function PreorderModelSummary({
  imageSrc,
  imageAlt = '',
  name,
  opensAtLabel,
  isOver,
  isAlert,
  onReserve,
  onNotify,
  className,
}: PreorderModelSummaryProps) {
  const ctaLabel = isOver ? '예약 하기' : isAlert ? '신청 완료' : '알림 신청'
  const ctaDisabled = !isOver && isAlert

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {imageSrc ? (
        <img src={imageSrc} alt={imageAlt} className={styles.thumbnail} />
      ) : (
        <div className={styles.thumbnailPlaceholder} />
      )}
      <div>
        <div className={[typography.title.smMedium, styles.name].join(' ')}>
          {name}
        </div>
        <div className={[typography.body.sub, styles.opensAt].join(' ')}>
          {opensAtLabel}
        </div>
      </div>
      <Button
        onClick={isOver ? onReserve : onNotify}
        disabled={ctaDisabled}
        size="small"

        rounded
      >
        {ctaLabel}
      </Button>
    </div>
  )
}
