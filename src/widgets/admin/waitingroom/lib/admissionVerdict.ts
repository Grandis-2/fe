import { isBraking } from '@entities/admin-waitingroom'
import { formatNumber } from '@shared/lib/formatNumber'

import type { AdmissionSignals } from './admissionSignals'

export type AdmissionTone = 'success' | 'warning' | 'danger' | 'muted'

export type AdmissionVerdict = {
  /** 판정 종류 — 할 일 버튼(다시 열기·속도 낮추기)을 고른다 */
  kind:
    | 'unknown'
    | 'stopped'
    | 'stale'
    | 'braking'
    | 'measuring'
    | 'congested'
    | 'following'
  tone: AdmissionTone
  /** 지금 상태 한마디 */
  title: string
  /** 그래서 무엇을 하면 되는지 */
  hint: string
}

/**
 * 대기열 관리 맨 위 판정 — 외부 등록이 접수를 따라가는지. 처리 한계를 미리 짐작하지 않고,
 * 외부 등록 대기가 쌓이는지를 직접 본다. 먼저 걸리는 하나만 말한다.
 * - 줄이 있는데 입장이 0이면 아무도 못 들어가니 가장 먼저 말한다.
 * - 현황이 오래됐으면(snapshotStale) 새로 오는 사람이 모두 줄에 서서 지금 숫자를 믿을 수 없다.
 * - 브레이크는 서버 스스로 버겁다고 판단한 것이라 다음으로 말한다.
 * - 기록이 모자라면 판단을 미룬다.
 * - 외부 등록 대기가 기간 내내 늘었으면 밀림, 아니면 따라감이다.
 * @param waiting 기다리는 사람 수
 * @param stale 대기열 현황이 오래됐는지(snapshotStale)
 * @param brakeFactor 브레이크 배율. 1보다 작으면 브레이크
 * @param admitting 실제 적용 중인 초당 입장 인원(브레이크 반영)
 * @param signals 접수·처리 속도와 밀림(admissionSignals)
 */
export function admissionVerdict({
  waiting,
  stale,
  brakeFactor,
  admitting,
  signals,
}: {
  waiting: number
  stale: boolean
  brakeFactor: number | null
  admitting: number
  signals: AdmissionSignals
}): AdmissionVerdict {
  if (waiting > 0 && admitting <= 0) {
    return {
      kind: 'stopped',
      tone: 'danger',
      title: '입장 멈춤',
      hint: `${formatNumber(waiting)}명이 기다리는데 아무도 못 들어가요`,
    }
  }
  if (stale) {
    return {
      kind: 'stale',
      tone: 'warning',
      title: '현황 정보가 오래됐어요',
      hint: '지금 새로 오는 사람은 모두 줄에 서요 · 속도는 그대로 두세요',
    }
  }
  if (isBraking(brakeFactor)) {
    return {
      kind: 'braking',
      tone: 'danger',
      title: '서버가 입장을 줄이는 중이에요',
      hint: `브레이크 ${brakeFactor}× · 설정을 올려도 실제 입장은 그만큼만 늘어요`,
    }
  }
  if (!signals.judged) {
    return {
      kind: 'measuring',
      tone: 'muted',
      title: '재는 중',
      hint: `약 ${signals.judgedInSeconds}초 뒤 외부 등록이 따라가는지 알려 드려요`,
    }
  }
  if (signals.congested) {
    const gap = Math.round((signals.received ?? 0) - (signals.processed ?? 0))
    return {
      kind: 'congested',
      tone: 'warning',
      title: '외부 등록이 밀리고 있어요',
      hint:
        gap > 0
          ? `접수가 처리보다 초당 ${formatNumber(gap)}건 빨라요 · 낮추세요`
          : '외부 등록 대기가 계속 늘고 있어요 · 낮추세요',
    }
  }
  return {
    kind: 'following',
    tone: 'success',
    title: '외부 등록이 따라가고 있어요',
    hint:
      (signals.received ?? 0) < 1
        ? '지금은 접수가 거의 없어요'
        : '들어온 만큼 바로 등록되고 있어요',
  }
}
