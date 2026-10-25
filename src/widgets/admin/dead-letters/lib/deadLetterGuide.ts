import type { DeadLetterRecord } from '@entities/admin-dead-letter'
import { formatDistance } from '@shared/lib/formatDistance'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import type { ProgressStep } from '@shared/ui'

type GuideInput = Pick<
  DeadLetterRecord,
  | 'status'
  | 'failureReason'
  | 'eventType'
  | 'receiveCount'
  | 'createdAt'
  | 'redriveRequestedBy'
  | 'redriveStartedAt'
  | 'redrivenAt'
  | 'outcomeAt'
  | 'discardedBy'
  | 'discardedAt'
  | 'discardNote'
>

export type DeadLetterGuide = {
  tone: 'danger' | 'warning' | 'info'
  title: string
  description: string
}

const at = (iso: string | null) => (iso ? formatDotDateTime(iso) : '—')
const by = (who: string | null, iso: string | null) =>
  [who, iso && formatDotDateTime(iso)].filter(Boolean).join(' · ') || '—'

/**
 * 상세 맨 위 '지금 할 일' — 무엇이 멈췄고 지금 누를 버튼이 무엇인지 한 줄로 말한다.
 * 처리 대기는 실패 이유마다 할 일이 다르다(고친 뒤 되돌리기 / 배포 뒤 되돌리기 / 버리기).
 */
export function deadLetterGuide(record: GuideInput): DeadLetterGuide {
  switch (record.status) {
    case 'OPEN':
      if (record.failureReason === 'UNREADABLE_BODY') {
        return {
          tone: 'warning',
          title: '원문이 깨져 되돌려도 또 실패해요',
          description:
            '원문을 확인하고 보낸 쪽에 다시 발행을 요청한 뒤, 사유를 남기고 버리세요.',
        }
      }
      if (record.failureReason === 'UNKNOWN_EVENT_TYPE') {
        return {
          tone: 'warning',
          title: `받는 서버가 ${record.eventType ?? '이 종류'}를 몰라요`,
          description:
            '이 종류를 처리하는 코드를 배포한 뒤 되돌리세요. 잘못 보낸 메시지라면 사유를 남기고 버려요.',
        }
      }
      return {
        tone: 'danger',
        title: `처리 중 오류로 ${record.receiveCount}번 받고 멈췄어요`,
        description:
          '서버 로그에서 messageId로 오류를 찾아 고친 뒤 되돌리세요. 고치지 않고 되돌리면 다시 실패해 새 메시지로 쌓여요.',
      }
    // 보내기에 실패하면 서버가 REDRIVING에 그대로 둔다 — 보냈다고 단정하지 않는다.
    case 'REDRIVING':
      return {
        tone: 'info',
        title: '원래 큐로 보내는 중이에요',
        description:
          '보통 몇 초 안에 끝나요. 오래 이대로면 보내기에 실패한 것일 수 있어 개발팀에 알려 주세요.',
      }
    case 'REDRIVEN':
      return {
        tone: 'info',
        title: '원래 큐로 보냈고, 처리 결과를 기다리는 중이에요',
        description:
          '보통 1분 안에 끝나요. 결과가 올 때까지 이 화면이 저절로 새로 고쳐요.',
      }
    case 'SUCCEEDED':
      return {
        tone: 'info',
        title: '되돌려서 정상 처리됐어요',
        description: '할 일이 없어요.',
      }
    case 'REDRIVE_FAILED':
      return {
        tone: 'warning',
        title: '되돌렸지만 또 실패해 새 메시지로 다시 쌓였어요',
        description:
          "이 메시지는 기록으로만 남아요. 처리 대기 목록에서 '이전 실패'가 붙은 새 메시지를 이어서 처리하세요 — 같은 원인이 남아 있는지 먼저 확인해요.",
      }
    case 'DISCARDED':
      return {
        tone: 'info',
        title: '버린 메시지예요 — 이 메시지가 하려던 처리는 일어나지 않았어요',
        description: [
          by(record.discardedBy, record.discardedAt),
          record.discardNote && `"${record.discardNote}"`,
        ]
          .filter(Boolean)
          .join(' · '),
      }
  }
}

/**
 * 진행 — 쌓임 → 되돌리기 요청 → 원래 큐로 보냄 → 처리 결과. 버린 메시지와 원문이 깨진
 * 메시지는 되돌리지 않는 길이라 단계가 다르다.
 */
export function deadLetterSteps(record: GuideInput): ProgressStep[] {
  const queued: ProgressStep = {
    key: 'queued',
    label: 'DLQ에 쌓임',
    detail: `${at(record.createdAt)} · 받은 ${record.receiveCount}회`,
    tone: record.status === 'OPEN' ? 'stuck' : 'done',
  }

  if (record.status === 'DISCARDED') {
    return [
      queued,
      {
        key: 'discarded',
        label: '버림',
        detail: by(record.discardedBy, record.discardedAt),
        tone: 'done',
      },
    ]
  }
  if (record.status === 'OPEN' && record.failureReason === 'UNREADABLE_BODY') {
    return [
      queued,
      {
        key: 'republish',
        label: '재발행 요청',
        detail: '보낸 쪽',
        tone: 'todo',
      },
      { key: 'discard', label: '버림', detail: '사유 기록', tone: 'todo' },
    ]
  }

  const requested = record.redriveStartedAt !== null
  const sent = record.redrivenAt !== null
  return [
    queued,
    {
      key: 'requested',
      label: '되돌리기 요청',
      detail: requested
        ? by(record.redriveRequestedBy, record.redriveStartedAt)
        : record.failureReason === 'UNKNOWN_EVENT_TYPE'
          ? '받는 서버 배포 뒤'
          : '원인을 고친 뒤',
      tone: requested ? 'done' : 'todo',
    },
    {
      key: 'sent',
      label: '원래 큐로 보냄',
      detail: at(record.redrivenAt),
      tone: sent ? 'done' : record.status === 'REDRIVING' ? 'now' : 'todo',
    },
    record.status === 'SUCCEEDED'
      ? {
          key: 'outcome',
          label: '처리됨',
          detail: at(record.outcomeAt),
          tone: 'done',
        }
      : record.status === 'REDRIVE_FAILED'
        ? {
            key: 'outcome',
            label: '처리 결과 · 다시 실패',
            detail: `${at(record.outcomeAt)} · 새 메시지로 쌓임`,
            tone: 'stuck',
          }
        : {
            key: 'outcome',
            label: '처리 결과',
            detail:
              record.status === 'REDRIVEN'
                ? '기다리는 중'
                : '처리됨 또는 다시 실패',
            tone: record.status === 'REDRIVEN' ? 'now' : 'todo',
          },
  ]
}

/** 처리 대기라면 얼마나 멈춰 있었는지 — 머리 줄에 붙인다 */
export const stuckFor = (
  record: Pick<GuideInput, 'status' | 'createdAt'>,
  now: number,
) =>
  record.status === 'OPEN'
    ? `${formatDistance(now - Date.parse(record.createdAt))}째 멈춤`
    : null
