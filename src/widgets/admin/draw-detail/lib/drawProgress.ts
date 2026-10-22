import type {
  AdminDraw,
  AdminDrawProgress,
  DrawStage,
} from '@entities/admin-draw'
import { formatDistance } from '@shared/lib/formatDistance'
import { formatShortDateTime } from '@shared/lib/formatDotDate'
import { formatNumber } from '@shared/lib/formatNumber'
import type { ProgressStep } from '@shared/ui'

// 단계 순서 — 지금 단계보다 앞이면 끝난 칸이다. 결과 지연은 추첨 칸에서 멈춘 것으로 본다.
const ORDER: Record<DrawStage, number> = {
  SCHEDULED: 0,
  OPEN: 1,
  WAITING_PAYMENT: 2,
  DRAWING: 3,
  STUCK: 3,
  SETTLED: 4,
}

/**
 * 회차가 어디까지 왔는지 다섯 칸으로 — 응모 시작 → 응모 중 → 결제 확인 대기 → 추첨 →
 * 결과 반영. 칸마다 그 일이 일어난(일어날) 시각을 붙인다.
 */
export function drawProgressSteps(
  draw: Pick<AdminDraw, 'opensAt' | 'closesAt'>,
  progress: AdminDrawProgress | undefined,
  stage: DrawStage,
  now: number,
): ProgressStep[] {
  const at = ORDER[stage]
  const opens = formatShortDateTime(draw.opensAt)
  const closes = formatShortDateTime(draw.closesAt)

  return [
    stage === 'SCHEDULED'
      ? {
          key: 'opens',
          label: '응모 시작',
          detail: `${formatDistance(Date.parse(draw.opensAt) - now)} 뒤 · ${opens}`,
          tone: 'now',
        }
      : { key: 'opens', label: '응모 시작', detail: opens, tone: 'done' },
    stage === 'OPEN'
      ? {
          key: 'open',
          label: '응모 중',
          detail: `${formatDistance(Date.parse(draw.closesAt) - now)} 뒤 마감 · ${closes}`,
          tone: 'now',
        }
      : {
          key: 'open',
          label: '응모 마감',
          detail: closes,
          tone: at > ORDER.OPEN ? 'done' : 'todo',
        },
    stage === 'WAITING_PAYMENT'
      ? {
          key: 'payment',
          label: '결제 확인 대기',
          detail: `확인 중 ${formatNumber(progress?.authorizingEntries ?? 0)}건`,
          tone: 'now',
        }
      : {
          key: 'payment',
          label: '결제 확인',
          detail: at > ORDER.WAITING_PAYMENT ? '끝남' : '마감 뒤',
          tone: at > ORDER.WAITING_PAYMENT ? 'done' : 'todo',
        },
    stage === 'STUCK'
      ? {
          key: 'draw',
          label: '추첨 · 결과 지연',
          detail: '마감 뒤 1시간 넘게 결과 없음',
          tone: 'stuck',
        }
      : stage === 'DRAWING'
        ? {
            key: 'draw',
            label: '추첨 중',
            detail: '서버가 자동으로 추첨',
            tone: 'now',
          }
        : stage === 'SETTLED'
          ? {
              key: 'draw',
              label: '추첨',
              // 결제 완료가 당첨 인원 이하면 추첨을 요청하지 않고 모두 당첨으로 반영한다.
              detail: progress?.drawRequestedAt
                ? formatShortDateTime(progress.drawRequestedAt)
                : '추첨 없이 모두 당첨',
              tone: 'done',
            }
          : {
              key: 'draw',
              label: '추첨',
              detail: '마감 30초 뒤부터 자동',
              tone: 'todo',
            },
    stage === 'SETTLED' && progress?.settledAt
      ? {
          key: 'settled',
          label: '결과 반영',
          detail: formatShortDateTime(progress.settledAt),
          tone: 'done',
        }
      : {
          key: 'settled',
          label: '결과 반영',
          detail: '당첨 주문이 생겨요',
          tone: 'todo',
        },
  ]
}
