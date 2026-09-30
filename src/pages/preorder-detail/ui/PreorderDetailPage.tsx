import { useState } from 'react'

import { useNavigate } from 'react-router'

import { PreorderModelSummary } from '@/entities/preorder'
import { PreorderQueueCard } from '@/features/preorder-queue'
import { useCountdown } from '@/shared/lib/useCountdown'
import { Container, Button, BottomSheet, Modal } from '@/shared/ui'

import * as styles from './PreorderDetailPage.css'

// ponytail: 임시 하드코딩된 오픈 시간, 실제 데이터 연동 시 API 응답으로 교체
const TEMP_OPENS_AT = new Date('2026-09-20T10:00:00')

export function PreorderDetailPage() {
  const navigate = useNavigate()
  const { days, hours, minutes, seconds, isOver } = useCountdown(TEMP_OPENS_AT)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [isAlert, setIsAlert] = useState(false)
  const [queueModel, setQueueModel] = useState<{
    id: string
    name: string
  } | null>(null)

  const handleActionClick = () => {
    setBottomSheetOpen(true)
  }

  const handleNotify = () => {
    // ponytail: 알림 신청 API 연동 전 임시 처리 — 연동 시 실제 제출 로직으로 교체
    setIsAlert(true)
    alert('IPhone 18 Pro 알림 신청이 완료됐습니다.')
  }

  const handleNotifySubmit = () => {
    // ponytail: 알림 신청 API 연동 전 임시 처리 — 연동 시 실제 제출 로직으로 교체
    setBottomSheetOpen(false)
  }

  const handleReserve = (id: string, name: string) => {
    setBottomSheetOpen(false)
    setQueueModel({ id, name })
  }

  return (
    <Container
      desktopPaddingX={0}
      desktopPaddingY={0}
      mobilePaddingX={0}
      mobilePaddingY={0}
      className={styles.Container}
    >
      <div className={styles.title}>
        아이폰 18프로, 18프로맥스, 울트라 사전예약 프로모션
      </div>

      <div
        style={{
          width: '100%',
          height: '1000px',
          backgroundColor: '#c4c4c4',
        }}
      >
        first information section
      </div>
      <div
        style={{
          width: '100%',
          height: '1000px',
          backgroundColor: '#797979',
        }}
      >
        second information section
      </div>
      <div
        style={{
          width: '100%',
          height: '1000px',
          backgroundColor: '#303030',
        }}
      >
        third information section
      </div>
      <div className={styles.countdownWrapper}>
        {!isOver && (
          <div className={styles.countdown}>
            {`${days}일 ${hours}시간 ${minutes}분 ${seconds}초 후 신청 시작`}
          </div>
        )}
        <Button
          className={styles.actionButton}
          onClick={handleActionClick}
          size="medium"
        >
          {isOver ? '사전예약 하러가기' : '예약알림 신청하기'}
        </Button>
      </div>

      <BottomSheet.Root
        open={bottomSheetOpen}
        onOpenChange={setBottomSheetOpen}
      >
        <BottomSheet.Content>
          <BottomSheet.Title className={styles.bottomSheetTitle}>
            {isOver ? '사전예약 이동' : '예약알림 신청'}
          </BottomSheet.Title>
          <BottomSheet.Description className={styles.bottomSheetDescription}>
            {isOver
              ? '예약할 모델을 선택해주세요.'
              : '알림을 받을 모델을 선택해주세요.'}
          </BottomSheet.Description>
          <div className={styles.modelSummary}>
            <PreorderModelSummary
              name="IPhone 18 Pro"
              opensAtLabel={`오픈일 ${TEMP_OPENS_AT.toLocaleDateString()}`}
              isOver={isOver}
              isAlert={isAlert}
              onReserve={() => handleReserve('IP-18-PRO', 'IPhone 18 Pro')}
              onNotify={handleNotify}
            />

            <PreorderModelSummary
              name="IPhone 18 Pro Max"
              opensAtLabel={`오픈일 ${TEMP_OPENS_AT.toLocaleDateString()}`}
              isOver={isOver}
              isAlert={isAlert}
              onReserve={() =>
                handleReserve('IP-18-PRO-MAX', 'IPhone 18 Pro Max')
              }
              onNotify={handleNotify}
            />
          </div>
          <Button
            onClick={handleNotifySubmit}
            rounded
            color="cancel"
            // variant="outline"
          >
            닫기
          </Button>
        </BottomSheet.Content>
      </BottomSheet.Root>

      <Modal open={!!queueModel} onClose={() => setQueueModel(null)}>
        {queueModel && (
          <PreorderQueueCard
            productName={queueModel.name}
            onComplete={() => navigate(`/products/${queueModel.id}`)}
          />
        )}
      </Modal>
    </Container>
  )
}
