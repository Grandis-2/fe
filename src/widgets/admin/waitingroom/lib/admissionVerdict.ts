export type AdmissionTone = 'success' | 'warning' | 'danger' | 'muted'

export type AdmissionVerdict = { tone: AdmissionTone; message: string }

/**
 * 대기열 관리 맨 위 판정 — 지금 입장 속도를 올려도 되는지. 모든 사전예약이 같은 예약 서버와
 * 외부 예약 시스템을 쓰므로 전체 기준 하나로 본다.
 * - 브레이크가 걸렸으면 서버가 이미 버거운 것이라 다른 것보다 먼저 말한다.
 * - 외부 등록 대기가 늘고 있으면 처리보다 빨리 들이는 중이다.
 * - 대기가 있고 입장이 처리 속도의 70%를 넘으면 빠듯하다.
 * - 들어오는 양이 거의 없으면 처리 속도가 한계가 아니라 들어온 만큼이라 판단하지 않는다.
 * @param backlogPerMinute 외부 등록 대기의 분당 변화. 표본이 모자라면 null
 * @param backlog 지금 외부 등록 대기 건수
 * @param admitting 실제 적용 중인 초당 입장 인원(브레이크 반영)
 * @param processing 관측한 초당 외부 등록 처리 건수. 표본이 모자라면 null
 * @param receiving 관측한 초당 접수 건수
 */
export function admissionVerdict({
  braking,
  backlogPerMinute,
  backlog,
  admitting,
  processing,
  receiving,
}: {
  braking: boolean
  backlogPerMinute: number | null
  backlog: number
  admitting: number
  processing: number | null
  receiving: number
}): AdmissionVerdict {
  if (braking) {
    return {
      tone: 'danger',
      message: '서버가 입장을 줄이는 중 · 원인부터 보세요',
    }
  }
  if (processing === null || backlogPerMinute === null) {
    return { tone: 'muted', message: '처리 흐름을 재는 중이에요' }
  }
  if (backlogPerMinute >= 1) {
    return { tone: 'danger', message: '처리보다 빨라요 · 낮추세요' }
  }
  if (backlog > 0 && admitting >= processing * 0.7) {
    return { tone: 'warning', message: '한계에 가까워요 · 더 올리면 밀려요' }
  }
  if (receiving < 1) {
    return { tone: 'muted', message: '판단할 만큼 들어오는 양이 없어요' }
  }
  return { tone: 'success', message: '여유 있어요 · 올려도 돼요' }
}

/** 바꿀 속도가 처리 속도에 비해 어떤지 — 미리보기 한 줄 */
export function previewNote(next: number, processing: number) {
  if (next > processing)
    return { tone: 'danger' as const, text: '처리 속도를 넘어요' }
  if (next >= processing * 0.7) {
    return { tone: 'warning' as const, text: '빠듯해져요' }
  }
  return { tone: 'success' as const, text: '여유 안이에요' }
}
