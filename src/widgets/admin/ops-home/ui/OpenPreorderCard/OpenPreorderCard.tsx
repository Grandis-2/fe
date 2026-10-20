import { Link } from 'react-router'

import type { OpenPreorder } from '@features/open-preorder-picker'
import {
  ADMIN_WAITINGROOM_PATH,
  adminReservationsPath,
} from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { Skeleton, Tag } from '@shared/ui'

import * as styles from './OpenPreorderCard.css'

/** 맨 뒤 예상 대기가 이만큼 길면 고른 사전예약의 대기 상자를 경고 색으로 칠한다 */
const LONG_WAIT_SECONDS = 10 * 60

export type OpenPreorderCardProps = {
  items: readonly OpenPreorder[]
  /** 고른 사전예약. null이면 전체 */
  selected: string | null
  onSelect: (productId: string) => void
  /** 대기열 현황을 아직 못 받았다 */
  loading?: boolean
}

const closeLabel = (closesAt: string) =>
  `${new Date(closesAt).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })} 마감`

const FailureTag = ({ failures }: { failures: number | null }) =>
  failures === null ? null : failures > 0 ? (
    <Tag variant="subtle" size="medium" color="red">
      실패 {formatNumber(failures)}
    </Tag>
  ) : (
    <Tag variant="subtle" size="medium" color="green">
      정상
    </Tag>
  )

/**
 * 진행 중인 사전예약 카드.
 * - 전체: 사전예약마다 "맨 뒤 대기"를 가장 크게 둔 타일. 누르면 그 사전예약을 고른다.
 * - 하나를 골랐을 때: 그 사전예약의 대기·입장 상한 사용과 바로 갈 곳.
 */
export function OpenPreorderCard({
  items,
  selected,
  onSelect,
  loading = false,
}: OpenPreorderCardProps) {
  const picked = items.find((item) => item.productId === selected)

  if (picked) {
    const stopped = picked.waiting > 0 && picked.credit <= 0
    const long =
      !stopped &&
      picked.credit > 0 &&
      picked.waiting / picked.credit >= LONG_WAIT_SECONDS
    const capUse = picked.cap > 0 ? Math.min(1, picked.credit / picked.cap) : 0

    return (
      <section className={styles.root} aria-labelledby="ops-open-card">
        <div className={styles.header}>
          <h2 id="ops-open-card" className={styles.title}>
            {picked.name}
          </h2>
          <Tag variant="subtle" size="medium" color="primary">
            접수 중 · {closeLabel(picked.closesAt)}
          </Tag>
        </div>

        <div
          className={
            stopped
              ? styles.hero.stopped
              : long
                ? styles.hero.long
                : styles.hero.normal
          }
        >
          {stopped ? (
            <div className={styles.heroMain}>
              <span className={styles.heroLabelBad}>입장 멈춤</span>
              <span className={styles.heroText}>
                {formatNumber(picked.waiting)}명이 기다리는데 들어오는 사람이
                없어요
              </span>
            </div>
          ) : (
            <>
              <div className={styles.heroMain}>
                <span className={styles.heroLabel}>맨 뒤 예상 대기</span>
                <span className={styles.heroValue}>
                  {picked.wait ?? '대기 없음'}
                </span>
              </div>
              <div className={styles.heroDivider} aria-hidden="true" />
              <div className={styles.stat}>
                <span className={styles.statLabel}>대기</span>
                <span className={styles.statValue}>
                  {formatNumber(picked.waiting)}
                  <span className={styles.statUnit}>명</span>
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>입장</span>
                <span className={styles.statValue}>
                  {formatNumber(picked.credit)}
                  <span className={styles.statUnit}>명/초</span>
                </span>
              </div>
            </>
          )}
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockTitle}>입장 상한 사용</span>
            <span className={styles.blockMeta}>
              초당 <b>{formatNumber(picked.credit)}</b> / 상한{' '}
              {formatNumber(picked.cap)}명
            </span>
          </div>
          <div
            className={styles.track}
            role="img"
            aria-label={`입장 상한의 ${Math.round(capUse * 100)}% 사용`}
          >
            <div
              className={styles.fill}
              style={{ width: `${capUse * 100}%` }}
            />
          </div>
          {picked.cap > 0 && capUse >= 1 && (
            <span className={styles.hint}>
              상한을 다 쓰고 있어요. 대기를 줄이려면 상한을 올리세요.
            </span>
          )}
        </div>

        <div className={styles.actions}>
          <Link
            to={ADMIN_WAITINGROOM_PATH}
            className={stopped ? styles.actionDanger : styles.action}
          >
            입장 상한 조절
          </Link>
          <Link
            to={adminReservationsPath(undefined, picked.productId)}
            className={styles.action}
          >
            예약 현황
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.root} aria-labelledby="ops-open-card">
      <div className={styles.header}>
        <h2 id="ops-open-card" className={styles.title}>
          진행 중인 사전예약
        </h2>
        <Link to={ADMIN_WAITINGROOM_PATH} className={styles.link}>
          대기열 관리
        </Link>
      </div>

      {loading ? (
        <div className={styles.tiles}>
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} height={76} radius={12} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>지금 접수 중인 사전예약이 없어요.</div>
      ) : (
        <ul className={styles.tiles}>
          {items.map((item) => (
            <li key={item.productId}>
              <button
                type="button"
                className={styles.tile}
                onClick={() => onSelect(item.productId)}
              >
                <span className={styles.tileWait}>
                  <span className={styles.heroLabel}>맨 뒤 대기</span>
                  <span className={styles.tileWaitValue}>
                    {item.wait ?? '없음'}
                  </span>
                </span>
                <span className={styles.tileText}>
                  <span className={styles.tileName}>{item.name}</span>
                  <span className={styles.tileMeta}>
                    {formatNumber(item.waiting)}명 · 초당{' '}
                    {formatNumber(item.credit)}명
                  </span>
                </span>
                <FailureTag failures={item.failures} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
