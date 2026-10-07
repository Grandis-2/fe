import { useMemo, useState } from 'react'

import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import {
  formatPreorderDate,
  getPreorderSchedule,
  type Preorder,
  type PreorderModel,
  type PreorderStatus,
} from '@entities/preorder'
import { useRequireLogin } from '@features/login'
import { joinPreorderQueue } from '@features/preorder-queue'
import { PREORDER_PATH, productPath } from '@shared/config/routes'
import { useCountdown } from '@shared/lib/useCountdown'
import { Button } from '@shared/ui'

import {
  formatOpenTime,
  getNotices,
  getScheduleSteps,
  monthDay,
} from '../../lib/preorderDetailCopy'
import { PreorderModelSheet } from '../PreorderModelSheet'

import * as styles from './PreorderDetail.css'

const STATUS_LABEL: Record<PreorderStatus, string> = {
  live: '진행 중',
  soon: '오픈 예정',
  done: '종료',
}

const CTA_LABEL: Record<PreorderStatus, string> = {
  live: '사전예약 하러가기',
  soon: '오픈 알림 받기',
  done: '일반 구매하러 가기',
}

export type PreorderDetailProps = {
  preorder: Preorder
}

// 사전예약 프로모션 상세. 상태(날짜로 계산)마다 뱃지·일정 강조·유의사항·하단 버튼·
// 모델 시트가 달라진다 — 진행 중: 예약, 오픈 전: 카운트다운 + 오픈 알림, 마감: 일반 구매.
export function PreorderDetail({ preorder }: PreorderDetailProps) {
  const navigate = useNavigate()
  const requireLogin = useRequireLogin()
  const { status, ddayLabel } = getPreorderSchedule(
    preorder.opensAt,
    preorder.closesAt,
  )
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  // ponytail: 오픈 알림 API가 없어 신청 상태를 화면에만 둔다 — 새로고침하면 사라진다. API 연동 시 교체.
  const [subscribedIds, setSubscribedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )

  // 매 렌더 새 Date면 useCountdown의 interval이 매초 다시 걸린다 — 날짜가 바뀔 때만 만든다.
  const openAt = useMemo(
    () => new Date(`${preorder.opensAt}T${preorder.openTime}:00`),
    [preorder.opensAt, preorder.openTime],
  )
  const countdown = useCountdown(openAt)

  // 예약·오픈 알림은 회원 전용, 마감 후 일반 구매는 상품 페이지로 바로 간다.
  const openSheet = () =>
    status === 'done'
      ? setIsSheetOpen(true)
      : requireLogin(() => setIsSheetOpen(true))

  const toggleNotify = (model: PreorderModel) =>
    setSubscribedIds((prev) => {
      const next = new Set(prev)
      if (next.has(model.id)) next.delete(model.id)
      else next.add(model.id)
      return next
    })

  const ctaLabel =
    status === 'soon' && subscribedIds.size > 0
      ? `알림 신청 완료 · ${subscribedIds.size}개 모델`
      : CTA_LABEL[status]

  const period = `${formatPreorderDate(preorder.opensAt)} ~ ${formatPreorderDate(preorder.closesAt)}`

  return (
    <div className={styles.root}>
      <div className={styles.intro}>
        <Link to={PREORDER_PATH} className={styles.back}>
          <ChevronLeft size={16} aria-hidden="true" />
          사전예약
        </Link>
        <div className={styles.badges}>
          <span className={styles.statusBadge[status]}>
            {STATUS_LABEL[status]}
          </span>
          {status !== 'done' && (
            <span className={styles.dday[status]}>{ddayLabel}</span>
          )}
        </div>
        <h1 className={styles.title}>{preorder.title} 사전예약 프로모션</h1>
        <div className={styles.period}>
          {period}
          {status === 'soon' &&
            ` · ${monthDay(preorder.opensAt)} ${formatOpenTime(preorder.openTime)} 오픈`}
        </div>
      </div>

      <div className={styles.hero}>
        <img
          src={preorder.imageSrc}
          alt={preorder.imageAlt ?? ''}
          className={styles.heroImage[status === 'done' ? 'dimmed' : 'normal']}
        />
        {status === 'done' && (
          <span className={styles.closedNotice}>사전예약이 마감되었어요</span>
        )}
      </div>

      <div className={styles.sections}>
        <section className={styles.section}>
          <h2
            className={
              styles.sectionTitle[status === 'done' ? 'muted' : 'normal']
            }
          >
            사전예약 혜택
            {status === 'done' && <span className={styles.ended}> · 종료</span>}
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
        {status === 'soon' && !countdown.isOver && (
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
        <Button size="large" className={styles.cta} onClick={openSheet}>
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
            productName: model.name,
            to: productPath(model.productId),
          })
        }}
        onToggleNotify={toggleNotify}
        onPurchase={(model) => navigate(productPath(model.productId))}
      />
    </div>
  )
}
