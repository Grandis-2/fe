export type FlowVerdict = {
  status: 'success' | 'warning' | 'info'
  message: string
}

/**
 * 운영 홈 맨 위 한 줄 — 지금 처리 흐름이 버티는지. 실패 건수는 아래 '지금 처리할 일'이
 * 따로 보여 주므로 여기서는 흐름만 본다. 대기열이 스스로 입장을 줄이는 중(브레이크)이면
 * 예약 처리 쪽이 이미 버거운 것이라 적체보다 먼저 말한다.
 * @param backlogPerMinute 외부 등록 대기의 분당 변화. 표본이 모자라면 null
 */
export function flowVerdict({
  braking,
  backlogPerMinute,
}: {
  braking: boolean
  backlogPerMinute: number | null
}): FlowVerdict {
  if (braking) {
    return {
      status: 'warning',
      message:
        '예약 서버의 오류나 지연 때문에 대기열이 입장을 자동으로 줄이고 있어요.',
    }
  }
  if (backlogPerMinute === null) {
    return {
      status: 'info',
      message: '처리 흐름을 재는 중이에요. 이 화면을 열어 둔 동안 값을 모아요.',
    }
  }
  if (backlogPerMinute >= 1) {
    return {
      status: 'warning',
      message: `처리가 밀리고 있어요. 들어오는 예약이 처리보다 분당 약 ${Math.round(backlogPerMinute)}건씩 많아요.`,
    }
  }
  return {
    status: 'success',
    message:
      '처리 흐름은 정상이에요. 들어오는 만큼 외부 등록을 처리하고 있어요.',
  }
}
