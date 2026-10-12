import type { DrawEntryState, DrawPhase } from '@entities/draw'

// 회차 단계 × 내 응모 단계에서 화면이 정할 것 — 상태 뱃지, 안내 박스, 하단 버튼.
// enter 응모 다이얼로그 열기 · pay 응모비 결제창 열기 · orders 주문 내역으로 · none 누를 수 없음.
export type DrawActionKind = 'enter' | 'pay' | 'orders' | 'none'

export type DrawNoteTone = 'highlight' | 'info' | 'muted'

export type DrawView = {
  badge: string
  note?: { tone: DrawNoteTone; title: string; body: string }
  cta: { label: string; kind: DrawActionKind }
}

const PHASE_BADGE: Record<DrawPhase, string> = {
  SCHEDULED: '오픈 예정',
  OPEN: '응모 중',
  CLOSED: '마감',
}

const NO_ENTRY_CTA: Record<DrawPhase, DrawView['cta']> = {
  SCHEDULED: { label: '응모 시작 전이에요', kind: 'none' },
  OPEN: { label: '응모하기', kind: 'enter' },
  CLOSED: { label: '응모가 마감됐어요', kind: 'none' },
}

export function getDrawView(phase: DrawPhase, state: DrawEntryState): DrawView {
  switch (state) {
    case 'none':
      return { badge: PHASE_BADGE[phase], cta: NO_ENTRY_CTA[phase] }
    case 'unpaid':
      return {
        badge: '결제 대기',
        note: {
          tone: 'info',
          title: '응모비 결제가 남았어요',
          body: '응모비를 결제해야 추첨 대상이 돼요. 응모 마감 전에 결제를 마쳐 주세요.',
        },
        cta: { label: '응모비 결제하기', kind: 'pay' },
      }
    case 'authorizing':
      return {
        badge: '결제 확인 중',
        note: {
          tone: 'info',
          title: '결제를 확인하고 있어요',
          body: '잠시만 기다려 주세요. 확인이 끝나면 자동으로 바뀌어요.',
        },
        cta: { label: '결제 확인 중이에요', kind: 'none' },
      }
    case 'missed':
      return {
        badge: PHASE_BADGE.CLOSED,
        note: {
          tone: 'muted',
          title: '추첨 대상이 아니에요',
          body: '응모비를 결제하지 않아 이번 추첨에는 참여하지 못했어요.',
        },
        cta: NO_ENTRY_CTA.CLOSED,
      }
    case 'waiting':
      return {
        badge: '응모 완료',
        note: {
          tone: 'info',
          title: '응모가 완료됐어요',
          body:
            phase === 'CLOSED'
              ? '추첨 결과를 기다리고 있어요. 결과가 나오면 이 페이지에서 확인할 수 있어요.'
              : '응모 기간이 끝나면 추첨해요. 결과는 이 페이지와 마이페이지에서 확인할 수 있어요.',
        },
        cta: { label: '결과 발표 전이에요', kind: 'none' },
      }
    case 'won':
      return {
        badge: '당첨',
        note: {
          tone: 'highlight',
          title: '축하해요, 당첨됐어요',
          body: '응모할 때 입력한 배송지로 증정품을 보내드려요. 주문 내역에서 배송 상태를 확인할 수 있어요.',
        },
        cta: { label: '주문 내역 보기', kind: 'orders' },
      }
    case 'lost':
      return {
        badge: '발표 완료',
        note: {
          tone: 'muted',
          title: '아쉽지만 당첨되지 않았어요',
          body: '다음 럭키드로우가 열리면 또 응모해 보세요.',
        },
        cta: { label: '추첨이 끝났어요', kind: 'none' },
      }
  }
}
