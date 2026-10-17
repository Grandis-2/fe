import { WifiOff } from 'lucide-react'

import { Button } from '../Button'
import { InlineAlert } from '../InlineAlert'

import * as styles from './PollingNotice.css'

import type { FetchStatus } from '@tanstack/react-query'

export type PollingNoticeProps = {
  // 폴링 쿼리 결과에서 그대로 넘긴다.
  query: { fetchStatus: FetchStatus; failureCount: number }
  // 제한 시간이 지나 자동 조회를 멈췄을 때의 안내와 [다시 확인]. 주면 다른 안내보다 먼저 보인다.
  timeout?: {
    title: React.ReactNode
    description?: React.ReactNode
    onRecheck: () => void
  } | null
}

// 회원 화면의 폴링 대기(대기열·결제 승인 등)가 실패하고 있거나 제한 시간이 지났을 때의 안내.
// 정상이면 아무것도 그리지 않는다. "서버 문제"·"결제 실패"로 단정하지 않는다 — 와이파이에 붙어 있어도
// 인터넷이 안 되면 응답 없음으로 보이고, 결과를 못 받았을 뿐 실제로는 성공했을 수 있다.
// 다시 묻는 건 버튼으로만 받는다 — 같은 순간 제한에 닿은 사용자들이 한꺼번에 다시 몰리지 않게.
export function PollingNotice({
  query: { fetchStatus, failureCount },
  timeout,
}: PollingNoticeProps) {
  if (timeout)
    return (
      <div className={styles.timeout}>
        <InlineAlert
          status="warning"
          variant="big"
          description={timeout.description}
        >
          {timeout.title}
        </InlineAlert>
        <Button variant="outline" size="small" onClick={timeout.onRecheck}>
          다시 확인
        </Button>
      </div>
    )
  if (fetchStatus === 'paused')
    return (
      <InlineAlert status="warning" icon={WifiOff}>
        인터넷 연결이 끊겼어요. 연결되면 자동으로 이어서 확인해요.
      </InlineAlert>
    )
  if (fetchStatus === 'fetching' && failureCount > 0)
    return (
      <InlineAlert status="warning">
        연결이 불안정해 다시 확인하고 있어요.
      </InlineAlert>
    )
  return null
}
