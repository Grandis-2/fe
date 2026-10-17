import { Button, DateRangeField } from '@shared/ui'
import type { DateRange } from '@shared/ui'

import * as styles from './FirstDeliveryField.css'

export type FirstDeliveryFieldProps = {
  /** 'YYYY-MM-DD' 기간. 비어 있으면 아직 안 고른 상태 */
  value: DateRange
  onChange: (value: DateRange) => void
  /** 등록할 때만 고를 수 있다 — 아래 설명 참고 */
  editable: boolean
  /** 배송 구간 설정으로 보낸다. 안 주면 버튼이 안 나온다 */
  onEditShipmentBatches?: () => void
}

/**
 * 1차 배송 예정 기간. 사전예약 등록에 필수다 — 서버가 배송 차수마다 시작·종료일을 둘
 * 다 받는다. 등록하면 이 기간으로 1차 배송 차수가 만들어진다.
 *
 * 고르는 건 등록할 때만이다. 차수 저장(PUT)은 전체를 보낸 목록으로 갈아 끼우는데
 * 이 폼은 1차만 알고 있어서, 등록 뒤에 여기서 저장하면 2차 이후가 지워진다.
 * 그래서 전체를 들고 있는 배송 구간 설정으로 보낸다.
 */
const FIELD_LABEL = '1차 배송 기간'

export function FirstDeliveryField({
  value,
  onChange,
  editable,
  onEditShipmentBatches,
}: FirstDeliveryFieldProps) {
  return (
    <div className={styles.root}>
      <div className={styles.title}>{FIELD_LABEL}</div>

      {editable ? (
        <DateRangeField
          label={FIELD_LABEL}
          placeholder="배송 예정 기간을 선택해 주세요"
          value={value}
          onChange={onChange}
        />
      ) : (
        <div className={styles.lockedRow}>
          <span className={styles.hint}>
            등록 후에는 배송 구간 설정 탭에서 배송 차수 수정이 가능합니다.
          </span>
          {onEditShipmentBatches && (
            <Button
              type="button"
              size="small"
              variant="solid"
              color="primary"
              onClick={onEditShipmentBatches}
            >
              배송 구간 설정으로 이동
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
