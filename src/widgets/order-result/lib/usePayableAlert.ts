import { useEffect, useRef } from 'react'

import type { ReservationDisplayStatus } from '@entities/preorder'
import { showToast } from '@shared/model/toastStore'

const WAITING: ReservationDisplayStatus[] = ['RECEIVED', 'PROCESSING']

// 외부 등록을 기다리던 예약이 구매 확정 대기로 바뀌는 순간 알린다. 다른 탭에 가 있으면 탭 제목도 바꿔 두고,
// 돌아오거나 화면을 떠나면 되돌린다. 처음부터 구매 확정 대기로 열린 예약은 바뀐 게 아니라 알리지 않는다.
export function usePayableAlert(displayStatus?: ReservationDisplayStatus) {
  const prev = useRef(displayStatus)

  useEffect(() => {
    const was = prev.current
    prev.current = displayStatus
    if (!was || !WAITING.includes(was) || displayStatus !== 'PAYABLE') return
    showToast('구매 확정이 가능해졌어요. 기한 안에 확정해 주세요.')
    if (!document.hidden) return
    const original = document.title
    document.title = '(1) 구매 확정 가능'
    const restore = () => {
      if (!document.hidden) document.title = original
    }
    document.addEventListener('visibilitychange', restore)
    return () => {
      document.removeEventListener('visibilitychange', restore)
      document.title = original
    }
  }, [displayStatus])
}
