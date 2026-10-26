import { NEEDS_PURCHASE, type Reservation } from '@entities/preorder'
import { mypagePath, paymentPath, resultPath } from '@shared/config/routes'

// 이 모델에 이미 진행 중인 예약이 있을 때 예약하기 자리에 둘 버튼 — 서버는 회원·모델마다 예약 하나라 다시 예약할 수 없다.
// 구매 확정이 필요하면 그 예약의 결제로, 외부 등록을 기다리면 예약 접수 화면으로, 그 밖(확정·기한 지남·취소 중)은 사전예약 내역으로.
export const existingReservationAction = ({
  preorderId,
  displayStatus,
}: Pick<Reservation, 'preorderId' | 'displayStatus'>) =>
  NEEDS_PURCHASE.includes(displayStatus)
    ? { label: '구매 확정하기', to: paymentPath(preorderId) }
    : displayStatus === 'RECEIVED' || displayStatus === 'PROCESSING'
      ? { label: '예약 확인하기', to: resultPath('preorder', preorderId) }
      : { label: '예약 내역 보기', to: mypagePath('preorder-check') }
