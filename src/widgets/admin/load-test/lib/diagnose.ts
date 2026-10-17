export type LoadTestSignals = {
  /** 대기열이 예약 서버 상태를 보고 입장을 줄이는 중(브레이크 배율 < 1) */
  braking: boolean
  /** 처리 중 적체(PENDING_SYNC)의 분당 변화. 표본이 모자라면 null */
  backlogPerMinute: number | null
  /** 시험 시작 뒤 늘어난 외부 등록 실패(DEAD_LETTER). 시작 전이면 null */
  newRegisterFailures: number | null
  /** 시험 시작 뒤 늘어난 상태 반영 실패(이벤트 DLQ 대기). 시작 전이면 null */
  newEventFailures: number | null
  /** 외부 등록 실패 중 가장 많은 오류 코드 */
  topErrorCode: string | null
}

export type LoadTestVerdict = {
  status: 'success' | 'warning' | 'error' | 'info'
  message: string
}

/**
 * 지금 어디가 막혔는지 한 줄로. 심각한 것부터 본다 — 실패(데이터가 안 맞게 됨) →
 * 브레이크(대기열이 스스로 입장을 줄임) → 적체(처리가 접수를 못 따라감) 순이다.
 */
export function diagnose(signals: LoadTestSignals): LoadTestVerdict {
  const {
    braking,
    backlogPerMinute,
    newRegisterFailures,
    newEventFailures,
    topErrorCode,
  } = signals

  if (newRegisterFailures !== null && newRegisterFailures > 0) {
    const cause = topErrorCode ? `, 가장 많은 원인 ${topErrorCode}` : ''
    return {
      status: 'error',
      message: `외부 등록 실패가 시험 시작 뒤 ${newRegisterFailures}건 늘었습니다${cause}. 시험이 끝나면 예약 현황에서 재처리해야 합니다.`,
    }
  }
  if (newEventFailures !== null && newEventFailures > 0) {
    return {
      status: 'error',
      message: `상태 반영 실패가 시험 시작 뒤 ${newEventFailures}건 늘었습니다. 이벤트 DLQ에서 원인을 확인하세요.`,
    }
  }
  if (braking) {
    return {
      status: 'warning',
      message:
        '예약 서버의 오류나 지연 때문에 대기열이 입장을 자동으로 줄이고 있습니다. 예약 처리 쪽이 병목입니다.',
    }
  }
  if (backlogPerMinute === null) {
    return { status: 'info', message: '값을 모으는 중입니다.' }
  }
  if (backlogPerMinute > 0) {
    return {
      status: 'warning',
      message: `외부 등록이 접수를 따라가지 못하고 있습니다. 처리 중 적체가 분당 ${Math.round(backlogPerMinute)}건씩 늘고 있습니다.`,
    }
  }
  return {
    status: 'success',
    // 흐름만 본다 — 시험 전부터 남은 적체·실패는 아래 카드가 따로 보여준다.
    message:
      '처리 흐름은 정상입니다. 들어오는 만큼 외부 등록을 처리하고 있습니다.',
  }
}
