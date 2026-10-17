import { WifiOff } from 'lucide-react'

import { InlineAlert } from '../InlineAlert'

import type { FetchStatus } from '@tanstack/react-query'

export type PollingNoticeProps = {
  // 폴링 쿼리 결과에서 그대로 넘긴다.
  query: { fetchStatus: FetchStatus; failureCount: number }
}

// 회원 화면의 폴링 대기(대기열·결제 승인 등)가 실패하고 있을 때의 안내. 정상이면 아무것도 그리지 않는다.
// "서버 문제"로 단정하지 않는다 — 와이파이에 붙어 있어도 인터넷이 안 되면 응답 없음으로 보인다.
export function PollingNotice({
  query: { fetchStatus, failureCount },
}: PollingNoticeProps) {
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
