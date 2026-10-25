import { useMemo, useState } from 'react'

import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { useSession } from '@entities/auth'
import {
  formatModelPeriod,
  formatPreorderPeriod,
  getPreorderSchedule,
  kstInstant,
  useActiveReservations,
  usePreorder,
  useSubscribedOpenAlerts,
  useToggleOpenAlert,
  type Preorder,
  type PreorderModel,
  type PreorderStatus,
} from '@entities/preorder'
import { useRequireLogin } from '@features/login'
import {
  existingReservationAction,
  joinPreorderQueue,
} from '@features/preorder-queue'
import { getErrorMessage } from '@shared/api/client'
import { PREORDER_PATH, productPath } from '@shared/config/routes'
import { useCountdown } from '@shared/lib/useCountdown'
import { showToast } from '@shared/model/toastStore'
import {
  Button,
  ImageWithFallback,
  InlineAlert,
  PageSkeleton,
} from '@shared/ui'

import { getNotices, getScheduleSteps } from '../../lib/preorderDetailCopy'
import { PreorderModelSheet } from '../PreorderModelSheet'

import * as styles from './PreorderDetail.css'

const STATUS_LABEL: Record<PreorderStatus, string> = {
  live: '오늘 오픈',
  soon: '오픈 예정',
  done: '종료',
}

const CTA_LABEL: Record<PreorderStatus, string> = {
  live: '사전예약 하러가기',
  soon: '오픈 알림 받기',
  done: '일반 구매하러 가기',
}

export type PreorderDetailProps = {
  /** 사전예약 홍보 id(라우트 파라미터) */
  preorderId: string
  /** 관리자 미리보기(PreorderPromotion의 preview) */
  preview?: boolean
}

// 사전예약 홍보를 불러와 상세를 그린다. 없거나 기간 밖이면 서버가 404를 준다.
export function PreorderDetail({
  preorderId,
  preview = false,
}: PreorderDetailProps) {
  const { data: preorder, error } = usePreorder(preorderId)

  if (error) {
    return (
      <InlineAlert status="error">
        {getErrorMessage(error, '사전예약을 불러오지 못했어요.')}
      </InlineAlert>
    )
  }
  // 실패는 위에서 걸렀으니 데이터가 없으면 아직 받는 중이다.
  if (!preorder) return <PageSkeleton tone="dark" />
  return <PreorderPromotion preorder={preorder} preview={preview} />
}

export type PreorderPromotionProps = {
  preorder: Preorder
  /**
   * 관리자 미리보기 — 고객 화면 그대로 그리되 뒤로 가기를 빼고 하단 버튼을 막는다.
   * 미리보기에서 예약·알림 신청이 실제로 나가면 안 된다.
   */
  preview?: boolean
}

// 사전예약 프로모션 상세. 상태(날짜로 계산)마다 뱃지·일정 강조·유의사항·하단 버튼·
// 모델 시트가 달라진다 — 진행 중: 예약, 오픈 전: 카운트다운 + 오픈 알림, 마감: 일반 구매.
export function PreorderPromotion({
  preorder,
  preview = false,
}: PreorderPromotionProps) {
  const navigate = useNavigate()
  const requireLogin = useRequireLogin()
  const { status, ddayLabel } = getPreorderSchedule(preorder)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { isLoggedIn } = useSession()
  // 오픈 알림은 모델(상품)마다 따로 신청한다.
  const subscribedIds = useSubscribedOpenAlerts(
    preorder.models.map((model) => model.productId),
    isLoggedIn && status === 'soon' && !preview,
  )
  const toggleOpenAlert = useToggleOpenAlert()
  // 이미 예약한 모델은 시트에서 예약하기 대신 그 예약 버튼을 보인다 — 시트를 열었을 때 내 예약 전부를 한 번 묻는다.
  const reservations = useActiveReservations(
    isLoggedIn && isSheetOpen && status !== 'soon',
  )

  // 매 렌더 새 Date면 useCountdown의 interval이 매초 다시 걸린다 — 날짜가 바뀔 때만 만든다.
  const openAt = useMemo(
    () => kstInstant(preorder.opensAt, preorder.openTime),
    [preorder.opensAt, preorder.openTime],
  )
  const countdown = useCountdown(openAt)
  // 알림 마감(오픈 1시간 전)부터 오픈까지 — 카운트다운을 보인다. 시트는 열리고 그 안의 예약하기만
  // 모델 오픈 시각까지 막힌다(isModelReservable). 카운트다운이 매초 다시 그려 오픈 순간 풀린다.
  const isBeforeOpen = status === 'live' && !countdown.isOver

  // 예약·오픈 알림은 회원 전용, 마감 후 일반 구매는 상품 페이지로 바로 간다.
  const openSheet = () =>
    status === 'done'
      ? setIsSheetOpen(true)
      : requireLogin(() => setIsSheetOpen(true))

  const toggleNotify = (model: PreorderModel) =>
    toggleOpenAlert.mutate(
      { productId: model.id, subscribed: !subscribedIds.has(model.id) },
      {
        onError: (caught) =>
          showToast(getErrorMessage(caught, '오픈 알림을 바꾸지 못했어요.')),
      },
    )

  // 모델마다 예약 시간이 다르면 진행 일정의 사전예약 단계 아래에 모델별 기간을 따로 보인다.
  const modelPeriods = preorder.models.map((model) => ({
    model,
    period: formatModelPeriod(preorder, model),
  }))
  const hasModelPeriods =
    new Set(modelPeriods.map(({ period }) => period)).size > 1

  const ctaLabel =
    status === 'soon' && subscribedIds.size > 0
      ? `알림 신청 완료 · ${subscribedIds.size}개 모델`
      : CTA_LABEL[status]

  return (
    <div className={styles.root}>
      <div className={styles.intro}>
        {!preview && (
          <Link to={PREORDER_PATH} className={styles.back}>
            <ChevronLeft size={16} aria-hidden="true" />
            사전예약
          </Link>
        )}
        <div className={styles.badges}>
          <span className={styles.statusBadge[status]}>
            {STATUS_LABEL[status]}
          </span>
          {status !== 'done' && (
            <span className={styles.dday[status]}>{ddayLabel}</span>
          )}
        </div>
        <h1 className={styles.title}>{preorder.title}</h1>
        <div className={styles.period}>{formatPreorderPeriod(preorder)}</div>
      </div>

      <div className={styles.hero}>
        <ImageWithFallback
          src={preorder.imageSrc}
          alt={preorder.imageAlt ?? ''}
          className={styles.heroImage[status === 'done' ? 'dimmed' : 'normal']}
        />
        {status === 'done' && (
          <span className={styles.closedNotice}>사전예약이 마감되었어요</span>
        )}
      </div>

      <div className={styles.sections}>
        {preorder.detailImageSrcs.length > 0 && (
          <div className={styles.detailImages}>
            {preorder.detailImageSrcs.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`${preorder.title} 안내 ${index + 1}`}
                loading="lazy"
                className={styles.detailImage}
              />
            ))}
          </div>
        )}

        {/* 혜택 API가 없어 지금은 비어 온다 — 비면 섹션째 뺀다. */}
        {preorder.benefits.length > 0 && (
          <section className={styles.section}>
            <h2
              className={
                styles.sectionTitle[status === 'done' ? 'muted' : 'normal']
              }
            >
              사전예약 혜택
              {status === 'done' && (
                <span className={styles.ended}> · 종료</span>
              )}
            </h2>
            <ol className={styles.benefits}>
              {preorder.benefits.map((benefit, index) => (
                <li key={benefit.title} className={styles.benefit}>
                  <span className={styles.benefitNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.benefitTitle}>{benefit.title}</span>
                  <span className={styles.benefitDescription}>
                    {benefit.description}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle.normal}>진행 일정</h2>
          <ol className={styles.schedule}>
            {getScheduleSteps(preorder, status).map((step) => (
              <li
                key={step.label}
                className={styles.step[step.isCurrent ? 'current' : 'rest']}
                aria-current={step.isCurrent ? 'step' : undefined}
              >
                <span className={styles.stepLabel}>{step.label}</span>
                <span className={styles.stepDate}>{step.date}</span>
                {step.isPreorder && hasModelPeriods && (
                  <ul className={styles.modelPeriods}>
                    {modelPeriods.map(({ model, period }) => (
                      <li key={model.id} className={styles.modelPeriod}>
                        <span className={styles.modelPeriodName}>
                          {model.name}
                        </span>
                        <span className={styles.modelPeriodTime}>{period}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.noticeSection}>
          <h2 className={styles.noticeTitle}>유의사항</h2>
          <ul className={styles.notices}>
            {getNotices(preorder, status).map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.bottomBar}>
        {(status === 'soon' || isBeforeOpen) && (
          <div className={styles.countdown}>
            <span className={styles.countdownLabel}>오픈까지</span>
            <span className={styles.countdownTime}>
              {countdown.days}
              <span className={styles.countdownUnit}>일</span>
              {String(countdown.hours).padStart(2, '0')}:{countdown.minutes}:
              {countdown.seconds}
            </span>
          </div>
        )}
        {status === 'done' && (
          <div className={styles.bottomNotice}>
            사전예약은 종료되었어요. 지금은 일반 구매로 만나보세요.
          </div>
        )}
        <Button
          size="large"
          className={styles.cta}
          disabled={preview}
          onClick={openSheet}
        >
          {ctaLabel}
        </Button>
      </div>

      <PreorderModelSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        preorder={preorder}
        status={status}
        subscribedIds={subscribedIds}
        onReserve={(model) => {
          setIsSheetOpen(false)
          joinPreorderQueue({
            productId: model.productId,
            productName: model.name,
            to: productPath(model.productId),
          })
        }}
        reservations={reservations}
        onOpenReservation={(reservation) => {
          setIsSheetOpen(false)
          navigate(existingReservationAction(reservation).to)
        }}
        onToggleNotify={toggleNotify}
        onPurchase={(model) => navigate(productPath(model.productId))}
      />
    </div>
  )
}
