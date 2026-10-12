import { Button, DeliveryDateField } from '@shared/ui'

import * as styles from './FirstDeliveryField.css'

export type FirstDeliveryFieldProps = {
  /** 'YYYY-MM-DD'. 비어 있으면 미정 */
  value: string
  onChange: (value: string) => void
  /** 등록할 때만 고를 수 있다 — 아래 설명 참고 */
  editable: boolean
  /** 배송 구간 설정으로 보낸다. 안 주면 버튼이 안 나온다 */
  onEditDispatchWindow?: () => void
}

/**
 * 1차 배송 예상일. 옵션별 1차 배송 수량과 짝이라, 둘을 합쳐 등록할 때 1차 배송
 * 차수를 만들어 둔다(toFirstWaveRequest).
 *
 * 고르는 건 등록할 때만이다. 차수 저장(PUT)은 전체를 보낸 목록으로 갈아 끼우는데
 * 이 폼은 1차만 알고 있어서, 등록 뒤에 여기서 저장하면 2차 이후가 지워진다.
 * 그래서 전체를 들고 있는 배송 구간 설정으로 보낸다.
 */
export function FirstDeliveryField({
  value,
  onChange,
  editable,
  onEditDispatchWindow,
}: FirstDeliveryFieldProps) {
  return (
    <div className={styles.root}>
      <div className={styles.title}>1차 예상 배송일</div>

      {editable ? (
        <DeliveryDateField
          layout="field"
          value={value || null}
          onChange={(next) => onChange(next ?? '')}
        />
      ) : (
        <div className={styles.lockedRow}>
          <span className={styles.hint}>
            등록 후에는 배송 구간 설정 탭에서 배송 차수 수정이 가능합니다.
          </span>
          {onEditDispatchWindow && (
            <Button
              type="button"
              size="small"
              variant="solid"
              color="primary"
              onClick={onEditDispatchWindow}
            >
              배송 구간 설정으로 이동
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
