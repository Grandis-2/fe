export type FlowVerdict = {
  status: 'success' | 'warning' | 'info'
  message: string
}

/**
 * 운영 홈 맨 위 한 줄 — 지금 처리 흐름이 버티는지. 실패 건수는 아래 '지금 처리할 일'이
 * 따로 보여 주므로 여기서는 흐름만 본다. 대기열이 스스로 입장을 줄이는 중(브레이크)이면
 * 예약 처리 쪽이 이미 버거운 것이라 적체보다 먼저 말한다.
 *
 * 브레이크는 대기열 전체에 하나뿐이라 언제나 모든 사전예약 기준이고, 처리 흐름(적체)은
 * scope로 받은 사전예약 기준이다(없으면 전체).
 * @param backlogPerMinute 외부 등록 대기의 분당 변화. 표본이 모자라면 null
 * @param scope 고른 사전예약 이름. 전체면 생략
 */
export function flowVerdict({
  braking,
  backlogPerMinute,
  scope,
}: {
  braking: boolean
  backlogPerMinute: number | null
  scope?: string
}): FlowVerdict {
  if (braking) {
    return {
      status: 'warning',
      message: '서버가 버거워 모든 사전예약의 입장을 자동으로 줄이는 중이에요',
    }
  }
  const subject = scope ? `${scope} — ` : ''
  if (backlogPerMinute === null) {
    return {
      status: 'info',
      message: `${subject}처리 흐름을 재는 중이에요`,
    }
  }
  if (backlogPerMinute >= 1) {
    return {
      status: 'warning',
      message: `${subject}처리가 밀려요 · 분당 ${Math.round(backlogPerMinute)}건씩 쌓이는 중`,
    }
  }
  return {
    status: 'success',
    message: `${subject}처리 흐름 정상`,
  }
}
