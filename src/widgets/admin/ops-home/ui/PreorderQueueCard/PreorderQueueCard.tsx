import { Link } from 'react-router'

import {
  settingSourceLabel,
  waitEstimate,
  waitingroomRuntimeColor,
  waitingroomRuntimeLabel,
  waitingroomRuntimeLabels,
  type WaitingroomProductRate,
  type WaitingroomProductStatus,
} from '@entities/admin-waitingroom'
import { ADMIN_WAITINGROOM_PATH } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { Tag } from '@shared/ui'

import * as styles from './PreorderQueueCard.css'

export type PreorderQueueCardProps = {
  /**
   * 사전예약 하나의 대기열이면 상품 현황, 전체면 합친 값(runtime은 없고 credit은 실제
   * 적용 중인 전역 입장 속도, cap은 전역 운영값).
   */
  queue: Pick<WaitingroomProductStatus, 'waiting' | 'credit' | 'cap'> &
    Partial<Pick<WaitingroomProductStatus, 'runtime'>>
  /** 대기열 관리의 운영값. 아직 못 받았으면 없다 — 상한은 현황의 cap으로 보인다 */
  rate?: Pick<WaitingroomProductRate, 'cap'> &
    Partial<Pick<WaitingroomProductRate, 'queueLimit'>>
  /**
   * 전체 대기열이면 브레이크 배율을 준다 — 상품 상한·줄 최대 길이 대신 전역 입장 속도와
   * 배율을 보인다.
   */
  brakeFactor?: number | null
}

/**
 * 고른 사전예약(또는 전체)의 대기열 상태(제목은 놓는 쪽이 단다) — 지금 줄과 입장 속도, 그리고 그 속도를 정하는 설정(상한이
 * 기본값인지 관리자가 정한 값인지). 바꾸는 건 대기열 관리에서 한다.
 */
export function PreorderQueueCard({
  queue,
  rate,
  brakeFactor,
}: PreorderQueueCardProps) {
  const capSource = rate ? settingSourceLabel[rate.cap.source] : null
  const whole = brakeFactor !== undefined
  const items = [
    { label: '대기', value: `${formatNumber(queue.waiting)}명` },
    { label: '초당 입장', value: `${formatNumber(queue.credit)}명` },
    {
      label: '맨 뒤 예상 대기',
      value: waitEstimate(queue.waiting, queue.credit) ?? '줄 없음',
    },
    {
      label: whole ? '전역 입장 속도' : '입장 상한',
      value: `초당 ${formatNumber(rate?.cap.value ?? queue.cap)}명${capSource ? ` · ${capSource}` : ''}`,
    },
    whole
      ? {
          label: '브레이크 배율',
          value: brakeFactor == null ? '—' : `${brakeFactor}× (서버 자동)`,
        }
      : {
          label: '줄 최대 길이',
          value:
            rate?.queueLimit == null
              ? '제한 없음'
              : `${formatNumber(rate.queueLimit)}명`,
        },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        {queue.runtime && (
          <Tag
            variant="subtle"
            size="small"
            rounded={false}
            color={waitingroomRuntimeColor[queue.runtime]}
            widthOptions={waitingroomRuntimeLabels}
          >
            {waitingroomRuntimeLabel[queue.runtime]}
          </Tag>
        )}
        <Link className={styles.link} to={ADMIN_WAITINGROOM_PATH}>
          대기열 관리에서 바꾸기
        </Link>
      </div>
      <dl className={styles.items}>
        {items.map((item) => (
          <div key={item.label} className={styles.item}>
            <dt className={styles.label}>{item.label}</dt>
            <dd className={styles.value}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
