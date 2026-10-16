import {
  drawStageLabel,
  drawStageOf,
  isDrawSettled,
  useAdminDrawProgress,
  type AdminDraw,
} from '@entities/admin-draw'
import { getErrorMessage } from '@shared/api/client'
import { DEFAULT_REFRESH_INTERVAL } from '@shared/config/refreshInterval'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { showToast } from '@shared/model/toastStore'
import {
  Button,
  FormSection,
  InlineAlert,
  RefreshStatus,
  StatCard,
  Tag,
} from '@shared/ui'

import { DrawStageSteps } from '../DrawStageSteps'

import * as styles from './AdminDrawDetail.css'

export type AdminDrawDetailProps = {
  draw: AdminDraw
  /** 회차를 받은 시각(ms) — 진행을 아직 못 받았을 때 단계를 나누는 기준 */
  fetchedAt: number
}

const dateTimeOrDash = (iso: string | null) =>
  iso ? formatDotDateTime(iso) : '—'

/**
 * 회차 하나의 응모·추첨 진행. 추첨은 서버가 자동으로 해서 조작은 없고, 결과가 반영될
 * 때까지 진행을 자동으로 다시 받는다.
 */
export function AdminDrawDetail({ draw, fetchedAt }: AdminDrawDetailProps) {
  const progress = useAdminDrawProgress(draw.drawId, DEFAULT_REFRESH_INTERVAL)
  const p = progress.data
  const settled = isDrawSettled(p)
  // 받은 값의 시각으로 나눈다 — 렌더할 때마다 시계를 읽으면 같은 값인데 단계가 흔들린다.
  const stage = drawStageOf(
    draw,
    p,
    Math.max(progress.dataUpdatedAt, fetchedAt),
  )

  // 클립보드는 권한·비보안 컨텍스트(http)에서 거절될 수 있어 실패도 알린다.
  const copyId = () =>
    void navigator.clipboard
      .writeText(draw.drawId)
      .then(() => showToast('회차 id를 복사했습니다.'))
      .catch(() => showToast('회차 id를 복사하지 못했습니다.'))

  const count = (value: number | undefined) =>
    value === undefined ? '—' : `${formatNumber(value)}건`

  const rows = [
    { label: '응모비', value: formatWon(draw.entryFee) },
    { label: '당첨 인원', value: `${formatNumber(draw.winnerCount)}명` },
    { label: '응모 시작', value: formatDotDateTime(draw.opensAt) },
    { label: '응모 마감', value: formatDotDateTime(draw.closesAt) },
    { label: '추첨 요청', value: dateTimeOrDash(p?.drawRequestedAt ?? null) },
    { label: '결과 반영', value: dateTimeOrDash(p?.settledAt ?? null) },
    { label: '만든 시각', value: formatDotDateTime(draw.createdAt) },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{draw.title}</h1>
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          color={
            stage === 'STUCK' ? 'red' : stage === 'SETTLED' ? 'gray' : 'blue'
          }
        >
          {drawStageLabel[stage]}
        </Tag>
      </div>

      <RefreshStatus
        updatedAt={progress.dataUpdatedAt}
        onRefresh={() => void progress.refetch()}
        note={
          settled ? '결과 반영이 끝나 자동 갱신하지 않음' : '10초마다 자동 갱신'
        }
      />

      {progress.isError && (
        <InlineAlert status={p ? 'warning' : 'error'}>
          {getErrorMessage(progress.error, '진행 상황을 불러오지 못했습니다.')}
          {p && ' 아래 숫자는 마지막으로 받은 값입니다.'}
        </InlineAlert>
      )}
      {stage === 'STUCK' && (
        <InlineAlert status="error">
          마감 뒤 1시간이 넘도록 결과가 반영되지 않았습니다. 회차 id를 개발팀에
          알려 주세요.
          <Button
            size="small"
            variant="outline"
            color="cancel"
            className={styles.alertAction}
            onClick={copyId}
          >
            회차 id 복사
          </Button>
        </InlineAlert>
      )}

      <FormSection title="진행 단계">
        <DrawStageSteps stage={stage} />
      </FormSection>

      <FormSection
        title="응모 현황"
        description="결제 대기는 응모비를 내지 않은 응모라 추첨 대상이 아니고 추첨을 막지도 않습니다."
      >
        <div className={styles.cards}>
          <StatCard
            label="결제 완료(추첨 대상)"
            loading={progress.isPending}
            muted={!p}
            value={count(p?.paidEntries)}
          />
          <StatCard
            label="결제 확인 중"
            loading={progress.isPending}
            muted={!p}
            value={count(p?.authorizingEntries)}
          />
          <StatCard
            label="결제 대기"
            loading={progress.isPending}
            muted={!p}
            value={count(p?.awaitingEntries)}
          />
          <StatCard
            label="당첨"
            loading={progress.isPending}
            muted={!p}
            value={
              p
                ? `${formatNumber(p.winners)} / ${formatNumber(draw.winnerCount)}명`
                : '—'
            }
          />
        </div>
      </FormSection>

      <div className={styles.columns}>
        <FormSection title="증정품">
          <div className={styles.card}>
            <div className={styles.gift}>
              {draw.gift.imageUrl ? (
                <img
                  className={styles.giftImage}
                  src={draw.gift.imageUrl}
                  alt={`${draw.gift.productTitle} ${draw.gift.optionTitle}`}
                />
              ) : (
                <div className={styles.giftImage} aria-hidden="true" />
              )}
              <div>
                <div className={styles.giftName}>{draw.gift.productTitle}</div>
                <div className={styles.giftOption}>{draw.gift.optionTitle}</div>
              </div>
            </div>
            <div className={styles.note}>
              만든 때의 이름·사진으로 고정됩니다. 당첨자마다 응모 때 배송지로
              0원 주문이 생깁니다.
            </div>
          </div>
        </FormSection>

        <FormSection title="회차 정보">
          <dl className={styles.card}>
            {rows.map(({ label, value }) => (
              <div key={label} className={styles.row}>
                <dt className={styles.term}>{label}</dt>
                <dd className={styles.value}>{value}</dd>
              </div>
            ))}
            <div className={styles.row}>
              <dt className={styles.term}>회차 id</dt>
              <dd className={styles.value}>
                {draw.drawId}{' '}
                <Button
                  size="small"
                  variant="outline"
                  color="cancel"
                  onClick={copyId}
                >
                  복사
                </Button>
              </dd>
            </div>
          </dl>
        </FormSection>
      </div>
    </div>
  )
}
