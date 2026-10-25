import { Modal } from '@shared/ui'

import { PreorderDetail } from '../PreorderDetail'

import * as styles from './PreorderDetailPreviewModal.css'

export type PreorderDetailPreviewModalProps = {
  /** 있으면 열린다. 사전예약 홍보 id */
  preorderId?: string
  onClose: () => void
}

/**
 * 관리자 사전예약 관리가 쓰는 고객 화면 미리보기 창. 고객 API로 받아 고객 상세와 같은 모양으로
 * 그린다 — 저장한 내용 기준이고, 노출 기간 밖이면 고객 API가 404를 준다.
 */
export function PreorderDetailPreviewModal({
  preorderId,
  onClose,
}: PreorderDetailPreviewModalProps) {
  return (
    <Modal
      open={preorderId !== undefined}
      onClose={onClose}
      size="wide"
      title="고객 화면 미리보기"
      description="저장한 내용을 고객 화면 그대로 보여줍니다. 예약·알림 신청은 눌리지 않습니다."
    >
      {preorderId && (
        <div className={styles.screen}>
          <PreorderDetail preorderId={preorderId} preview />
        </div>
      )}
    </Modal>
  )
}
