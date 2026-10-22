import { Fragment } from 'react'

import { Copy } from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  drawStageLabel,
  drawStageOf,
  isDrawSettled,
  useAdminDrawProgress,
  type AdminDraw,
  type DrawStage,
} from '@entities/admin-draw'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import { DEFAULT_REFRESH_INTERVAL } from '@shared/config/refreshInterval'
import { ADMIN_DRAWS_PATH, adminOrdersPath } from '@shared/config/routes'
import { copyText } from '@shared/lib/copyText'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { shortId } from '@shared/lib/shortId'
import { showToast } from '@shared/model/toastStore'
import {
  Breadcrumb,
  Button,
  ImageWithFallback,
  InlineAlert,
  NoticeBanner,
  ProgressSteps,
  RefreshStatus,
  Tag,
} from '@shared/ui'

import { drawProgressSteps } from '../../lib/drawProgress'

import * as styles from './AdminDrawDetail.css'

export type AdminDrawDetailProps = {
  draw: AdminDraw
  /** 회차를 받은 시각(ms) — 진행을 아직 못 받았을 때 단계를 나누는 기준 */
  fetchedAt: number
}

const dateTimeOrDash = (iso: string | null | undefined) =>
  iso ? formatDotDateTime(iso) : '—'

// 예약 현황과 같은 기준 — 진행 중(남색 테두리), 끝남(남색 바탕), 아직(회색), 막힘(빨강).
const stageTag: Record<
  DrawStage,
  { color: 'primary' | 'gray' | 'red'; variant: 'subtle' | 'outline' }
> = {
  SCHEDULED: { color: 'gray', variant: 'subtle' },
  OPEN: { color: 'primary', variant: 'outline' },
  WAITING_PAYMENT: { color: 'primary', variant: 'outline' },
  DRAWING: { color: 'primary', variant: 'outline' },
  SETTLED: { color: 'primary', variant: 'subtle' },
  STUCK: { color: 'red', variant: 'subtle' },
}

/**
 * 회차 하나의 응모·추첨 진행. 추첨은 서버가 자동으로 해서 조작은 없고, 결과가 반영될
 * 때까지 진행을 자동으로 다시 받는다. 예약 상세와 같은 틀 — 지금 할 일(문제가 있을 때만),
 * 진행 칸, 아래 두 단에 응모 현황(넓게)과 증정품·회차 정보(좁게).
 */
export function AdminDrawDetail({ draw, fetchedAt }: AdminDrawDetailProps) {
  const navigate = useNavigate()
  const progress = useAdminDrawProgress(draw.drawId, DEFAULT_REFRESH_INTERVAL)
  const p = progress.data
  const settled = isDrawSettled(p)
  // 받은 값의 시각으로 나눈다 — 렌더할 때마다 시계를 읽으면 같은 값인데 단계가 흔들린다.
  const now = Math.max(progress.dataUpdatedAt, fetchedAt)
  const stage = drawStageOf(draw, p, now)
  const staleError = pollingError(progress)

  // 클립보드는 권한·비보안 컨텍스트(http)에서 거절될 수 있어 실패도 알린다.
  const copyId = () =>
    void copyText(draw.drawId)
      .then(() => showToast('회차 id를 복사했습니다.'))
      .catch(() => showToast('회차 id를 복사하지 못했습니다.'))

  const entries = p
    ? p.paidEntries + p.authorizingEntries + p.awaitingEntries
    : 0
  const share = (count: number) => `${(count / entries) * 100}%`
  // 결제 완료가 당첨 인원 이하면 추첨 없이 모두 당첨이라 경쟁률이 의미가 없다.
  const ratio =
    p && p.paidEntries > draw.winnerCount
      ? (p.paidEntries / draw.winnerCount).toFixed(1)
      : null

  const rows = [
    { label: '응모 시작', value: formatDotDateTime(draw.opensAt) },
    { label: '응모 마감', value: formatDotDateTime(draw.closesAt) },
    {
      label: '추첨 요청',
      value:
        settled && !p?.drawRequestedAt
          ? '추첨 없이 모두 당첨'
          : dateTimeOrDash(p?.drawRequestedAt),
    },
    { label: '결과 반영', value: dateTimeOrDash(p?.settledAt) },
    { label: '만든 시각', value: formatDotDateTime(draw.createdAt) },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.topBar}>
        <Breadcrumb
          items={[
            { label: '럭키드로우 관리', to: ADMIN_DRAWS_PATH },
            { label: draw.title },
          ]}
        />
        <RefreshStatus
          updatedAt={progress.dataUpdatedAt}
          onRefresh={() => void progress.refetch()}
          note={
            settled
              ? '결과 반영이 끝나 자동 갱신하지 않음'
              : '10초마다 자동 갱신'
          }
        />
      </div>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{draw.title}</h1>
        <Tag
          variant={stageTag[stage].variant}
          size="medium"
          rounded={false}
          color={stageTag[stage].color}
        >
          {drawStageLabel[stage]}
        </Tag>
        <span className={styles.summary}>
          {[
            `${draw.gift.productTitle} ${draw.gift.optionTitle}`,
            `${formatNumber(draw.winnerCount)}명 당첨`,
            `응모비 ${formatWon(draw.entryFee)}`,
          ].join(' · ')}
        </span>
      </div>

      {staleError !== null && (
        <InlineAlert status={p ? 'warning' : 'error'}>
          {getErrorMessage(staleError, '진행 상황을 불러오지 못했습니다.')}
          {p && ' 아래 숫자는 마지막으로 받은 값입니다.'}
        </InlineAlert>
      )}

      {/* 지금 할 일 — 결과 지연은 개발팀에 알릴 회차 id를, 결과 반영 뒤엔 배송할 주문을. */}
      {stage === 'STUCK' && (
        <NoticeBanner
          tone="danger"
          title="마감 뒤 1시간이 넘도록 결과가 반영되지 않았어요"
          description="회차 id를 개발팀에 알려 주세요."
          action={
            <Button size="small" icon={Copy} onClick={copyId}>
              회차 id 복사
            </Button>
          }
        />
      )}
      {stage === 'SETTLED' && p && p.winners > 0 && (
        <NoticeBanner
          tone="info"
          title={`당첨 주문 ${formatNumber(p.winners)}건이 생겼어요`}
          // 주문엔 회차 id가 없어 회차별로는 못 거른다 — 당첨 주문 전체로 보낸다.
          description="주문 관리에서 일반 주문처럼 배송을 진행해요. 모든 회차의 당첨 주문이 함께 보여요."
          action={
            <Button
              size="small"
              variant="outline"
              onClick={() => navigate(adminOrdersPath('DRAW'))}
            >
              당첨 주문 보기
            </Button>
          }
        />
      )}

      <section className={styles.panel} aria-labelledby="draw-progress">
        <h2 id="draw-progress" className={styles.panelTitle}>
          진행
        </h2>
        <ProgressSteps steps={drawProgressSteps(draw, p, stage, now)} />
        <span className={styles.note}>
          응모비를 결제한 응모만 추첨 대상이고, 결제 완료가 당첨 인원 이하면
          추첨 없이 모두 당첨이에요.
        </span>
      </section>

      <div className={styles.columns}>
        <section
          className={[styles.panel, styles.main].join(' ')}
          aria-labelledby="draw-entries"
        >
          <h2 id="draw-entries" className={styles.panelTitle}>
            응모 현황
          </h2>
          <dl className={styles.figures}>
            <div className={styles.figure}>
              <dt className={styles.figureLabel}>추첨 대상(결제 완료)</dt>
              <dd className={styles.figureValue}>
                {p ? formatNumber(p.paidEntries) : '—'}
                <span className={styles.figureUnit}>건</span>
              </dd>
            </div>
            <div className={styles.figure}>
              <dt className={styles.figureLabel}>경쟁률</dt>
              <dd className={styles.figureValue}>
                {ratio ?? (p ? '모두 당첨' : '—')}
                {ratio && <span className={styles.figureUnit}> : 1</span>}
              </dd>
            </div>
            <div className={styles.figure}>
              <dt className={styles.figureLabel}>당첨</dt>
              <dd className={styles.figureValue}>
                {p ? formatNumber(p.winners) : '—'}
                <span className={styles.figureUnit}>
                  {' '}
                  / {formatNumber(draw.winnerCount)}명
                </span>
              </dd>
            </div>
          </dl>

          {p && entries > 0 && (
            <div
              className={styles.bar}
              role="img"
              aria-label={`전체 응모 ${formatNumber(entries)}건 중 결제 완료 ${formatNumber(p.paidEntries)}건, 결제 확인 중 ${formatNumber(p.authorizingEntries)}건, 결제 대기 ${formatNumber(p.awaitingEntries)}건`}
            >
              <span
                className={styles.segment.paid}
                style={{ width: share(p.paidEntries) }}
              />
              <span
                className={styles.segment.authorizing}
                style={{ width: share(p.authorizingEntries) }}
              />
              <span
                className={styles.segment.awaiting}
                style={{ width: share(p.awaitingEntries) }}
              />
            </div>
          )}
          {p && (
            <ul className={styles.legend}>
              <li className={styles.legendItem}>
                <span className={styles.legendDot.paid} aria-hidden="true" />
                결제 완료
                <span className={styles.legendCount}>
                  {formatNumber(p.paidEntries)}
                </span>
              </li>
              <li className={styles.legendItem}>
                <span
                  className={styles.legendDot.authorizing}
                  aria-hidden="true"
                />
                결제 확인 중
                <span className={styles.legendCount}>
                  {formatNumber(p.authorizingEntries)}
                </span>
              </li>
              <li className={styles.legendItem}>
                <span
                  className={styles.legendDot.awaiting}
                  aria-hidden="true"
                />
                결제 대기
                <span className={styles.legendCount}>
                  {formatNumber(p.awaitingEntries)}
                </span>
              </li>
              <li className={[styles.legendItem, styles.legendTotal].join(' ')}>
                전체 응모
                <span className={styles.legendCount}>
                  {formatNumber(entries)}
                </span>
              </li>
            </ul>
          )}
          <span className={styles.note}>
            결제 대기는 응모비를 내지 않은 응모라 추첨 대상이 아니고, 추첨을
            막지도 않아요.
          </span>
        </section>

        <div className={styles.side}>
          <section className={styles.panel} aria-labelledby="draw-gift">
            <h2 id="draw-gift" className={styles.panelTitle}>
              증정품
            </h2>
            <div className={styles.gift}>
              <ImageWithFallback
                className={styles.giftImage}
                src={draw.gift.imageUrl}
                alt={`${draw.gift.productTitle} ${draw.gift.optionTitle}`}
              />
              <div>
                <div className={styles.giftName}>{draw.gift.productTitle}</div>
                <div className={styles.giftOption}>
                  {draw.gift.optionTitle} · {formatNumber(draw.winnerCount)}개
                  확보
                </div>
              </div>
            </div>
            <span className={styles.note}>
              만든 때의 이름·사진으로 고정돼요. 당첨자마다 응모 때 배송지로 0원
              주문이 생기고, 당첨이 적으면 남은 재고는 돌려놔요.
            </span>
          </section>

          <section className={styles.panel} aria-labelledby="draw-info">
            <h2 id="draw-info" className={styles.panelTitle}>
              회차 정보
            </h2>
            <dl className={styles.list}>
              {rows.map(({ label, value }) => (
                <Fragment key={label}>
                  <dt className={styles.term}>{label}</dt>
                  <dd className={styles.value}>{value}</dd>
                </Fragment>
              ))}
              <dt className={styles.term}>회차 id</dt>
              <dd className={[styles.value, styles.idValue].join(' ')}>
                <span title={draw.drawId}>{shortId(draw.drawId)}</span>
                <Button
                  size="small"
                  variant="outline"
                  color="cancel"
                  icon={Copy}
                  onClick={copyId}
                >
                  복사
                </Button>
              </dd>
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
