import { formatNumber } from '@shared/lib/formatNumber'

import type { SentRun } from '../model/sentRun'

/** 예상 시간이 이만큼 지나도록은 '보내는 중'으로 본다 — 서버가 나눠 보내 조금씩 늦는다 */
export const GRACE_SECONDS = 30

export type RecoveryStatus = {
  tone: 'success' | 'warning' | 'info'
  message: string
}

/**
 * 장애 대응 맨 위 한 줄 — 지금 어떤 상태이고 다음에 무엇을 하면 되는지. 단계 표시 대신 이
 * 한 줄이 상황에 따라 바뀐다.
 * - 보내기 전: 실패 없음 / 실패가 늘고 있음(아직 보내지 말 것) / 보낼 준비됨
 * - 보낸 뒤: 보내는 중(남은 시간) → 회복됨 / 줄었음 / 그대로
 * @param failures 지금 재처리 필요 건수(고른 범위). 못 받았으면 undefined
 * @param rising 최근 1분 사이 실패가 늘고 있나. 표본이 모자라면 null
 * @param failuresAtSend 보낼 때 그 범위의 실패 수
 * @param scope 고른 사전예약 이름. 전체면 생략
 */
export function recoveryStatus({
  failures,
  rising,
  sent,
  failuresAtSend,
  now,
  scope,
}: {
  failures: number | undefined
  rising: boolean | null
  sent: SentRun | null
  failuresAtSend: number | undefined
  now: number
  scope?: string
}): RecoveryStatus {
  const subject = scope ? `${scope} — ` : ''
  if (failures === undefined) {
    return { tone: 'info', message: '실패 건수를 불러오는 중이에요.' }
  }

  if (sent) {
    const doneAt = sent.at + sent.estimatedSeconds * 1000
    if (now <= doneAt + GRACE_SECONDS * 1000) {
      const remaining = Math.ceil((doneAt - now) / 1000)
      return {
        tone: 'info',
        message: `전체 ${formatNumber(sent.targetCount)}건을 나눠 다시 보내는 중이에요 · ${remaining > 0 ? `약 ${formatNumber(remaining)}초 남음` : '마무리하는 중'}`,
      }
    }
    const before = failuresAtSend ?? failures
    if (failures === 0) {
      return {
        tone: 'success',
        message: `${subject}회복됐어요 · 실패 ${formatNumber(before)} → 0건`,
      }
    }
    if (failures < before) {
      return {
        tone: 'info',
        message: `${subject}실패가 ${formatNumber(before)} → ${formatNumber(failures)}건으로 줄었어요 · 남은 실패는 원인을 보고 다시 보내세요`,
      }
    }
    // 오픈 중엔 새 접수에서도 실패가 생겨, 보낸 뒤 실패가 늘었다고 다시 보내기가 실패한 건
    // 아니다 — 묶음별 결과가 없어(백엔드 요청서 R6) 둘을 가를 수 없으니 그렇게 말한다.
    if (failures > before) {
      return {
        tone: 'warning',
        message: `${subject}보낸 뒤에도 실패가 ${formatNumber(before)} → ${formatNumber(failures)}건으로 늘었어요 · 다시 보낸 것이 또 실패했거나 새 접수에서 실패가 나고 있어요. 실패가 늘지 않을 때 다시 보내세요`,
      }
    }
    return {
      tone: 'warning',
      message: `${subject}예상 시간이 지났는데 실패가 그대로예요(${formatNumber(failures)}건) · 잠시 뒤 다시 보내거나 외부 시스템 담당자에게 알리세요`,
    }
  }

  if (failures === 0) {
    return {
      tone: 'success',
      message: `${subject}다시 보낼 외부 등록 실패가 없어요.`,
    }
  }
  if (rising) {
    return {
      tone: 'warning',
      message: `${subject}실패가 계속 늘고 있어요(${formatNumber(failures)}건) · 외부 시스템이 아직 회복되지 않았을 수 있어요. 늘지 않을 때 보내세요`,
    }
  }
  return {
    tone: 'info',
    message: `${subject}${formatNumber(failures)}건이 다시 보내기를 기다려요 · ${rising === null ? '실패 추이를 재는 중이에요' : '실패가 늘지 않아 지금 보내도 돼요'}`,
  }
}
