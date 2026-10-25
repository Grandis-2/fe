export type LoadTestSignals = {
  /** 대기열이 예약 서버 상태를 보고 입장을 줄이는 중(브레이크 배율 < 1) */
  braking: boolean
  /** 지금 브레이크 배율. 모르면 null */
  brakeFactor: number | null
  /** 처리 중 적체의 분당 변화. 표본이 모자라면 null */
  backlogPerMinute: number | null
  /** 보는 범위(최근 N분) 동안 늘어난 외부 등록 실패. 표본이 모자라면 null */
  newRegisterFailures: number | null
  /** 보는 범위 동안 늘어난 상태 반영 실패(이벤트 DLQ 대기). 표본이 모자라면 null */
  newEventFailures: number | null
  /** 외부 등록 실패 중 가장 많은 오류 코드 */
  topErrorCode: string | null
  /** 문구에 넣을 범위 이름 — '최근 10분' */
  rangeLabel: string
}

export type LoadTestVerdict = {
  kind:
    | 'register-failures'
    | 'event-failures'
    | 'braking'
    | 'backlog'
    | 'measuring'
    | 'ok'
  status: 'success' | 'warning' | 'error' | 'info'
  title: string
  description?: string
}

/**
 * 지금 어디가 막혔는지 한 줄로. 심각한 것부터 본다 — 실패(데이터가 안 맞게 됨) →
 * 브레이크(대기열이 스스로 입장을 줄임) → 적체(처리가 접수를 못 따라감) 순이다.
 */
export function diagnose(signals: LoadTestSignals): LoadTestVerdict {
  const {
    braking,
    brakeFactor,
    backlogPerMinute,
    newRegisterFailures,
    newEventFailures,
    topErrorCode,
    rangeLabel,
  } = signals
  const backlogNote =
    backlogPerMinute !== null && backlogPerMinute > 0
      ? `처리 중 적체가 분당 +${Math.round(backlogPerMinute).toLocaleString('ko-KR')}건씩 늘고 있어요.`
      : null

  if (newRegisterFailures !== null && newRegisterFailures > 0) {
    return {
      kind: 'register-failures',
      status: 'error',
      title: `외부 등록 실패 — ${rangeLabel} 동안 ${newRegisterFailures.toLocaleString('ko-KR')}건 늘었어요`,
      description: [
        topErrorCode && `가장 많은 원인 ${topErrorCode}.`,
        '부하가 끝나면 예약 현황에서 재처리해야 해요.',
      ]
        .filter(Boolean)
        .join(' '),
    }
  }
  if (newEventFailures !== null && newEventFailures > 0) {
    return {
      kind: 'event-failures',
      status: 'error',
      title: `상태 반영 실패 — ${rangeLabel} 동안 ${newEventFailures.toLocaleString('ko-KR')}건 늘었어요`,
      description: '이벤트 DLQ에서 원인을 확인하세요.',
    }
  }
  if (braking) {
    return {
      kind: 'braking',
      status: 'warning',
      title: '병목: 예약 처리 — 대기열이 입장을 줄이고 있어요',
      description: [
        `예약 서버의 오류·지연 때문에 입장을 ${brakeFactor ?? '?'}배로 줄였어요(브레이크).`,
        backlogNote,
      ]
        .filter(Boolean)
        .join(' '),
    }
  }
  if (backlogPerMinute === null) {
    return { kind: 'measuring', status: 'info', title: '값을 모으는 중이에요' }
  }
  if (backlogPerMinute > 0) {
    return {
      kind: 'backlog',
      status: 'warning',
      title: '병목: 외부 등록 — 처리가 접수를 못 따라가요',
      description: backlogNote ?? undefined,
    }
  }
  return {
    kind: 'ok',
    status: 'success',
    // 흐름만 본다 — 전부터 남은 적체·실패는 아래 점검이 따로 보여 준다.
    title: '처리 흐름 정상 — 들어오는 만큼 외부 등록을 처리하고 있어요',
  }
}
