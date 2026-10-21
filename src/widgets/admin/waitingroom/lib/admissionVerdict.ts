import { isBraking } from '@entities/admin-waitingroom'
import { formatNumber } from '@shared/lib/formatNumber'

export type AdmissionTone = 'success' | 'warning' | 'danger' | 'muted'

export type AdmissionVerdict = {
  tone: AdmissionTone
  /** 지금 상태 한마디 */
  title: string
  /** 그래서 무엇을 하면 되는지 */
  hint: string
}

/** 입장이 외부 등록 처리 속도의 이만큼을 넘으면 한계 근처로 본다 */
export const TIGHT_RATIO = 0.7

/**
 * 대기열 관리 맨 위 판정 — 지금 입장 속도를 올려도 되는지. 모든 사전예약이 같은 예약 서버와
 * 외부 예약 시스템을 쓰므로 전체 기준 하나로 본다.
 * - 줄이 있는데 입장이 0이면 아무도 못 들어가니 가장 먼저 말한다.
 * - 현황이 오래됐으면(snapshotStale) 새로 오는 사람이 모두 줄에 서서, 지금 숫자로 올려도
 *   된다고 말할 수 없다.
 * - 브레이크가 걸렸으면 서버가 이미 버거운 것이라 다음으로 말한다.
 * - 외부 등록 대기가 늘고 있으면 처리보다 빨리 들이는 중이다.
 * - 대기가 있고 입장이 처리 속도의 70%를 넘으면 한계 근처다.
 * - 들어오는 양이 거의 없으면 처리 속도가 한계가 아니라 들어온 만큼이라 판단하지 않는다.
 * @param waiting 기다리는 사람 수
 * @param stale 대기열 현황이 오래됐는지(snapshotStale)
 * @param brakeFactor 브레이크 배율. 1보다 작으면 브레이크
 * @param backlogPerMinute 외부 등록 대기의 분당 변화. 표본이 모자라면 null
 * @param backlog 지금 외부 등록 대기 건수
 * @param admitting 실제 적용 중인 초당 입장 인원(브레이크 반영)
 * @param processing 관측한 초당 외부 등록 처리 건수. 표본이 모자라면 null
 * @param receiving 관측한 초당 접수 건수
 */
export function admissionVerdict({
  waiting,
  stale,
  brakeFactor,
  backlogPerMinute,
  backlog,
  admitting,
  processing,
  receiving,
}: {
  waiting: number
  stale: boolean
  brakeFactor: number | null
  backlogPerMinute: number | null
  backlog: number
  admitting: number
  processing: number | null
  receiving: number
}): AdmissionVerdict {
  if (waiting > 0 && admitting <= 0) {
    return {
      tone: 'danger',
      title: '입장 멈춤',
      hint: `${formatNumber(waiting)}명이 기다리는데 아무도 못 들어가요`,
    }
  }
  if (stale) {
    return {
      tone: 'warning',
      title: '현황 정보가 오래됐어요',
      hint: '지금 새로 오는 사람은 모두 줄에 서요 · 속도는 그대로 두세요',
    }
  }
  if (isBraking(brakeFactor)) {
    return {
      tone: 'danger',
      title: '서버가 입장을 줄이는 중',
      hint: `브레이크 ${brakeFactor}× · 올려도 안 빨라져요`,
    }
  }
  if (processing === null || backlogPerMinute === null) {
    return { tone: 'muted', title: '재는 중', hint: '30초쯤 지나면 판단해요' }
  }
  if (backlogPerMinute >= 1) {
    return {
      tone: 'danger',
      title: '처리보다 빨라요',
      hint: '외부 등록이 밀리고 있어요 · 낮추세요',
    }
  }
  if (backlog > 0 && admitting >= processing * TIGHT_RATIO) {
    return {
      tone: 'warning',
      title: '한계에 가까워요',
      hint: '더 올리면 밀려요',
    }
  }
  if (receiving < 1) {
    return {
      tone: 'muted',
      title: '판단할 만큼 들어오는 양이 없어요',
      hint: '접수가 늘면 다시 판단해요',
    }
  }
  return { tone: 'success', title: '여유 있어요', hint: '올려도 돼요' }
}

/** 바꿀 속도가 처리 속도에 비해 어떤지 — 미리보기 한 줄 */
export function previewNote(next: number, processing: number) {
  if (next > processing)
    return { tone: 'danger' as const, text: '처리 속도를 넘어요' }
  if (next >= processing * TIGHT_RATIO) {
    return { tone: 'warning' as const, text: '한계 근처예요' }
  }
  return { tone: 'success' as const, text: '여유 안이에요' }
}
