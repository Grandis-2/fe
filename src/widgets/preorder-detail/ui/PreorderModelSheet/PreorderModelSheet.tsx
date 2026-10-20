import {
  formatModelPeriod,
  isModelOpen,
  OpenAlertToggle,
  PreorderModelSummary,
  type Preorder,
  type PreorderModel,
  type PreorderStatus,
} from '@entities/preorder'
import { BottomSheet, Button } from '@shared/ui'

import * as styles from './PreorderModelSheet.css'

const COPY: Record<PreorderStatus, { title: string; description: string }> = {
  live: { title: '사전예약', description: '예약할 모델을 선택해주세요.' },
  soon: {
    title: '오픈 알림 신청',
    description: '알림 받을 모델을 선택해주세요. 오픈 시 앱 푸시로 알려드려요.',
  },
  done: { title: '일반 구매', description: '구매할 모델을 선택해주세요.' },
}

export type PreorderModelSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  preorder: Pick<Preorder, 'models' | 'opensAt' | 'openTime' | 'closeTime'>
  /** 현재 시각으로 계산한 값이라 preorder에서 다시 구하지 않고 위젯 것을 받는다(배지와 어긋나지 않게). */
  status: PreorderStatus
  /** 오픈 알림을 신청한 모델 id */
  subscribedIds: ReadonlySet<string>
  onReserve: (model: PreorderModel) => void
  onToggleNotify: (model: PreorderModel) => void
  onPurchase: (model: PreorderModel) => void
}

// 상세 하단 버튼으로 여는 모델 선택 시트. 상태마다 제목·안내·모델 버튼이 다르다 —
// 진행 중은 예약하기, 오픈 전은 알림 받기(토글), 마감은 일반 구매하기.
// 폭은 공용 BottomSheet 그대로(100%, 최대 콘텐츠 폭) 두고 색만 어둡게 입힌다.
export function PreorderModelSheet({
  open,
  onOpenChange,
  preorder,
  status,
  subscribedIds,
  onReserve,
  onToggleNotify,
  onPurchase,
}: PreorderModelSheetProps) {
  const { title, description } = COPY[status]

  // 마감 전엔 모델마다 자기 예약 기간을 보인다 — 한 홍보 안에서도 모델끼리 시간이 다를 수 있다.
  const captionOf = (model: PreorderModel) =>
    status === 'done'
      ? '바로 구매 가능 · 1–2일 내 도착'
      : `예약 기간 ${formatModelPeriod(preorder, model)}`

  const renderAction = (model: PreorderModel) => {
    if (status === 'soon') {
      return (
        <OpenAlertToggle
          subscribed={subscribedIds.has(model.id)}
          name={model.name}
          onToggle={() => onToggleNotify(model)}
        />
      )
    }
    return (
      <Button
        rounded
        className={styles.action}
        // 홍보가 열려도 오픈 시각이 늦은 모델은 그 시각까지 막는다.
        disabled={status === 'live' && !isModelOpen(preorder, model)}
        onClick={() => (status === 'live' ? onReserve : onPurchase)(model)}
      >
        {status === 'live' ? '예약하기' : '구매하기'}
      </Button>
    )
  }

  return (
    <BottomSheet.Root open={open} onOpenChange={onOpenChange}>
      <BottomSheet.Content className={styles.sheet}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <BottomSheet.Title className={styles.title}>
              {title}
            </BottomSheet.Title>
            <BottomSheet.Description className={styles.description}>
              {description}
            </BottomSheet.Description>
          </div>
          <div className={styles.models}>
            {preorder.models.map((model) => (
              <PreorderModelSummary
                key={model.id}
                model={model}
                caption={captionOf(model)}
                action={renderAction(model)}
              />
            ))}
          </div>
          <BottomSheet.Close asChild>
            <Button color="close" className={styles.close}>
              닫기
            </Button>
          </BottomSheet.Close>
        </div>
      </BottomSheet.Content>
    </BottomSheet.Root>
  )
}
