import { useState } from 'react'

import { Link, useLocation } from 'react-router'

import {
  DEAD_LETTER_DISCARD_NOTE_MAX,
  deadLetterEventLabel,
  deadLetterFailureReasonHint,
  deadLetterFailureReasonLabel,
  deadLetterFailureReasonTag,
  deadLetterStatusColor,
  deadLetterStatusLabel,
  deadLetterTargetLabel,
  isRefundRequest,
  useDiscardDeadLetter,
  useRedriveDeadLetter,
  type DeadLetterRecord,
  type DeadLetterService,
} from '@entities/admin-dead-letter'
import { orderNo } from '@entities/admin-order'
import { reservationNo } from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import {
  adminDeadLetterPath,
  adminOrderPath,
  adminReservationPath,
  type BackTo,
} from '@shared/config/routes'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { formatNumber } from '@shared/lib/formatNumber'
import { useNow } from '@shared/lib/useNow'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import {
  Button,
  CodeBlock,
  CopyButton,
  DescriptionList,
  InlineAlert,
  NoticeBanner,
  Panel,
  ProgressSteps,
  ReasonForm,
  SegmentedTabs,
  Tag,
} from '@shared/ui'

import {
  deadLetterGuide,
  deadLetterSteps,
  stuckFor,
} from '../../lib/deadLetterGuide'

import * as styles from './AdminDeadLetterDetail.css'

export type AdminDeadLetterDetailProps = {
  deadLetter: DeadLetterRecord
  /** 어느 서비스의 DLQ인지 — 되돌리기·버리기 주소와 관련 대상(예약/주문)이 갈린다 */
  service: DeadLetterService
  /** 되돌리기를 기다린 지 오래돼 저절로 새로 고치기를 멈췄다 */
  stalled?: boolean
}

type BodyView = 'pretty' | 'raw'

const bodyViews: { value: BodyView; label: string }[] = [
  { value: 'pretty', label: '펼쳐 보기' },
  { value: 'raw', label: '받은 그대로' },
]

// 판단에 쓰는 값 — 무슨 처리였고 어느 예약·주문인지.
const KEY_FIELDS = ['"eventType"', '"preorderId"', '"orderId"']

const timeOrDash = (iso: string | null) => (iso ? formatDotDateTime(iso) : '—')

/** 원문은 보통 JSON이라 읽기 좋게 펼친다. 깨진 원문은 그대로 보인다 */
function prettyBody(body: string): string | null {
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return null
  }
}

const byteSize = (text: string) => new TextEncoder().encode(text).length

// '분 단위'라 1분마다 다시 그리면 충분하다.
const NOW_INTERVAL_MS = 60_000

/**
 * 이벤트 DLQ 메시지 한 건(개발자용). 맨 위에 지금 할 일을 말하고, 어디까지 왔는지
 * 보여준 뒤, 넓은 왼쪽에 원문을, 좁은 오른쪽에 메시지 정보·로그 검색값·처리 기록을 둔다.
 * 원인은 messageId로 서버 로그에서 찾고, 고친 뒤 되돌리거나 다시 처리하면 안 되는
 * 메시지면 사유를 남기고 버린다.
 */
export function AdminDeadLetterDetail({
  deadLetter,
  service,
  stalled = false,
}: AdminDeadLetterDetailProps) {
  const location = useLocation()
  const now = useNow(NOW_INTERVAL_MS).getTime()
  const redrive = useRedriveDeadLetter(service)
  const discard = useDiscardDeadLetter(service)
  const busy = redrive.isPending || discard.isPending
  const pretty = prettyBody(deadLetter.body)
  const [view, setView] = useState<BodyView>('pretty')
  const guide = deadLetterGuide(deadLetter, { stalled })

  // 지난 실패 문구가 남아 있으면 이번 시도의 결과처럼 보인다.
  const resetErrors = () => {
    redrive.reset()
    discard.reset()
  }

  const confirmRedrive = () => {
    resetErrors()
    openModal({
      theme: 'light',
      title: '원래 큐로 되돌릴까요?',
      description:
        '이 메시지를 다시 처리하게 합니다. 원인을 고친 뒤에 보내야 다시 실패하지 않습니다.',
      confirmLabel: '되돌리기',
      onConfirm: () => {
        closeModal()
        redrive.mutate(deadLetter.deadLetterId, {
          onSuccess: () => showToast('원래 큐로 보냈습니다.'),
        })
      },
    })
  }

  // 되돌릴 수 없는 조치라 사유를 받는다(기록에 남는다).
  const confirmDiscard = () => {
    resetErrors()
    openModal({
      theme: 'light',
      title: '메시지를 버릴까요?',
      // 환불 요청을 버리면 주문이 취소 중에 멈추고 다시 보낼 길이 없다(명세) — 먼저 알린다.
      description: isRefundRequest(deadLetter.eventType)
        ? '환불 요청을 버리면 이 주문은 취소 중에 머물고, 주문 쪽에서 환불 요청을 다시 보낼 방법이 없습니다. 결제와 주문을 확인해 환불을 직접 처리해 주세요. 버리면 되돌릴 수 없습니다.'
        : '버리면 이 메시지가 하려던 처리는 일어나지 않고, 되돌릴 수 없습니다. 내용이 잘못됐다면 보낸 쪽에 다시 발행을 요청해 주세요.',
      children: (
        <ReasonForm
          label="버리는 이유"
          placeholder="예: 원문 손상 — 결제 서버에 재발행 요청함(#1234)"
          maxLength={DEAD_LETTER_DISCARD_NOTE_MAX}
          confirmLabel="버리기"
          onCancel={closeModal}
          onConfirm={(note) => {
            closeModal()
            discard.mutate(
              { deadLetterId: deadLetter.deadLetterId, note },
              { onSuccess: () => showToast('메시지를 버렸습니다.') },
            )
          }}
        />
      ),
    })
  }

  // 예약·주문 상세의 '돌아가기'가 이 메시지로 오게 한다.
  const backTo: BackTo = {
    label: '이벤트 DLQ 메시지',
    to: location.pathname + location.search,
  }
  const target = deadLetterTargetLabel[service]
  const relatedLink = deadLetter.orderId ? (
    <Link
      className={styles.link}
      to={adminOrderPath(deadLetter.orderId)}
      state={{ backTo }}
    >
      {orderNo(deadLetter.orderId)}
    </Link>
  ) : (
    deadLetter.preorderId && (
      <Link
        className={styles.link}
        to={adminReservationPath(deadLetter.preorderId)}
        state={{ backTo }}
      >
        {reservationNo(deadLetter.preorderId)}
      </Link>
    )
  )

  const history = [
    deadLetter.redriveStartedAt && {
      at: deadLetter.redriveStartedAt,
      what: '되돌리기 요청',
      who: deadLetter.redriveRequestedBy,
    },
    deadLetter.redrivenAt && {
      at: deadLetter.redrivenAt,
      what: '원래 큐로 보냄',
      who: null,
    },
    deadLetter.outcomeAt && {
      at: deadLetter.outcomeAt,
      what: deadLetterStatusLabel[deadLetter.status],
      who: null,
    },
    deadLetter.discardedAt && {
      at: deadLetter.discardedAt,
      what: `버림${deadLetter.discardNote ? ` — ${deadLetter.discardNote}` : ''}`,
      who: deadLetter.discardedBy,
    },
  ].filter((entry) => !!entry)

  const stuck = stuckFor(deadLetter, now)
  const code = view === 'pretty' && pretty !== null ? pretty : deadLetter.body

  return (
    <div className={styles.root}>
      <header className={styles.titleRow}>
        <div className={styles.heading}>
          <div className={styles.titleLine}>
            <h1 className={styles.title}>
              {deadLetterEventLabel(deadLetter.eventType)}
            </h1>
            <Tag
              variant="subtle"
              size="medium"
              rounded={false}
              color={deadLetterStatusColor[deadLetter.status]}
            >
              {deadLetterStatusLabel[deadLetter.status]}
            </Tag>
            <Tag
              size="small"
              {...deadLetterFailureReasonTag[deadLetter.failureReason]}
            >
              {deadLetterFailureReasonLabel[deadLetter.failureReason]}
            </Tag>
          </div>
          <div className={styles.summary}>
            {deadLetter.eventType && (
              <span className={styles.code}>{deadLetter.eventType}</span>
            )}
            {relatedLink && (
              <span>
                관련 {target} {relatedLink}
              </span>
            )}
            {stuck && <span>{stuck}</span>}
          </div>
        </div>

        <div className={styles.actions}>
          {deadLetter.redrivable && (
            <Button size="small" disabled={busy} onClick={confirmRedrive}>
              되돌리기
            </Button>
          )}
          {deadLetter.status === 'OPEN' && (
            <Button
              size="small"
              variant="outline"
              color="cancel"
              disabled={busy}
              onClick={confirmDiscard}
            >
              {deadLetter.redrivable ? '버리기' : '사유 쓰고 버리기'}
            </Button>
          )}
        </div>
      </header>

      {redrive.isError && (
        <InlineAlert status="error">
          {getErrorMessage(redrive.error, '되돌리지 못했습니다.')}
        </InlineAlert>
      )}
      {discard.isError && (
        <InlineAlert status="error">
          {getErrorMessage(discard.error, '버리지 못했습니다.')}
        </InlineAlert>
      )}

      <NoticeBanner
        tone={guide.tone}
        title={guide.title}
        description={guide.description}
        action={
          deadLetter.status === 'OPEN' &&
          deadLetter.failureReason === 'PROCESSING_FAILED' ? (
            <CopyButton
              value={deadLetter.messageId}
              label="messageId"
              showLabel
            />
          ) : undefined
        }
      />

      <Panel title="진행">
        <ProgressSteps steps={deadLetterSteps(deadLetter)} />
      </Panel>

      <div className={styles.columns}>
        <Panel
          className={styles.main}
          title={
            <>
              원문
              <span className={styles.titleNote}>
                {pretty !== null ? 'JSON' : '읽을 수 없는 원문'} ·{' '}
                {formatNumber(byteSize(deadLetter.body))} B
              </span>
            </>
          }
          aside={
            <>
              {pretty !== null && (
                <SegmentedTabs
                  items={bodyViews}
                  value={view}
                  onChange={setView}
                />
              )}
              <CopyButton value={deadLetter.body} label="원문" showLabel />
            </>
          }
        >
          <CodeBlock
            label="원문"
            code={code}
            // 펼친 JSON에서만 강조한다 — 깨진 원문은 어디까지가 값인지 알 수 없다.
            highlight={
              code === pretty
                ? (line) => KEY_FIELDS.some((key) => line.includes(key))
                : undefined
            }
          />
          <span className={styles.note}>
            {pretty === null
              ? 'JSON으로 읽을 수 없는 원문이라 받은 그대로 보여줍니다. '
              : `노란 줄은 판단에 쓰는 값(이벤트 종류·${target})이에요. `}
            회원 정보가 들어 있을 수 있으니 밖에 붙여 넣을 땐 가려 주세요.
          </span>
        </Panel>

        <div className={styles.side}>
          <Panel title="메시지">
            <DescriptionList
              items={[
                {
                  label: `관련 ${target}`,
                  value: relatedLink || (
                    <span className={styles.muted}>{target}과 무관</span>
                  ),
                },
                // 결제 이벤트에는 회원 id가 없다.
                ...(service === 'preorder'
                  ? [{ label: '회원 id', value: deadLetter.customerId ?? '—' }]
                  : []),
                {
                  label: '실패 이유',
                  value: (
                    <>
                      {deadLetterFailureReasonLabel[deadLetter.failureReason]}
                      <span className={styles.muted}>
                        {' '}
                        ·{' '}
                        {deadLetterFailureReasonHint[deadLetter.failureReason]}
                      </span>
                    </>
                  ),
                },
                {
                  label: '받은 횟수',
                  value: `${deadLetter.receiveCount}회`,
                },
                { label: '보낸 시각', value: timeOrDash(deadLetter.sentAt) },
                {
                  label: '쌓인 시각',
                  value: formatDotDateTime(deadLetter.createdAt),
                },
                {
                  label: '이전 실패',
                  value: deadLetter.redrivenFromId ? (
                    <Link
                      className={styles.link}
                      to={adminDeadLetterPath(
                        deadLetter.redrivenFromId,
                        service,
                      )}
                    >
                      이전 메시지 보기
                    </Link>
                  ) : (
                    <span className={styles.muted}>처음 멈춘 메시지</span>
                  ),
                },
              ]}
            />
          </Panel>

          <Panel title="로그에서 찾기" aside="값 옆 버튼으로 복사">
            <ul className={styles.trace}>
              {[
                { label: 'messageId', value: deadLetter.messageId },
                { label: 'eventId', value: deadLetter.eventId },
                { label: 'sourceQueue', value: deadLetter.sourceQueue },
                {
                  label: 'aggregate',
                  value: deadLetter.aggregateType
                    ? `${deadLetter.aggregateType} · ${deadLetter.aggregateId ?? '—'}`
                    : null,
                },
              ].map(({ label, value }) => (
                <li key={label} className={styles.traceRow}>
                  <span className={styles.traceLabel}>{label}</span>
                  <span className={styles.traceValue}>{value ?? '—'}</span>
                  {value && <CopyButton value={value} label={label} />}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="처리 기록">
            {history.length === 0 ? (
              <span className={styles.note}>
                아직 아무도 손대지 않았어요. 되돌리거나 버리면 누가 언제 했는지
                여기 남아요.
              </span>
            ) : (
              <ol className={styles.history}>
                {history.map((entry) => (
                  <li key={entry.what} className={styles.historyRow}>
                    <span className={styles.historyAt}>
                      {formatDotDateTime(entry.at)}
                    </span>
                    <span>
                      {entry.what}
                      {entry.who && (
                        <span className={styles.muted}> · {entry.who}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
