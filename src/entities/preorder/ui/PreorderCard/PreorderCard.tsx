import { Link } from 'react-router'

import { preorderPath } from '@shared/config/routes'

import {
  formatPreorderDate,
  getPreorderSchedule,
} from '../../lib/preorderSchedule'

import * as styles from './PreorderCard.css'

import type { Preorder } from '../../model/preorder'

// 카드는 상세 데이터 중 목록에 보이는 칸만 받는다.
export type PreorderCardData = Pick<
  Preorder,
  'id' | 'imageSrc' | 'imageAlt' | 'title' | 'benefit' | 'opensAt' | 'closesAt'
>

export type PreorderCardProps = {
  data: PreorderCardData
  className?: string
}

// 이미지를 꽉 채우고 아래 그라데이션 위에 글자를 얹는다. 웹은 세로(3:4), 모바일은 가로(4:3)다.
// 상태(진행 중·오픈 예정·마감)는 날짜로 정한다.
export function PreorderCard({ data, className }: PreorderCardProps) {
  const { imageSrc, imageAlt = '', title, benefit, opensAt, closesAt } = data
  const { status, ddayLabel } = getPreorderSchedule(opensAt, closesAt)

  return (
    // div onClick이 아니라 링크 — 키보드 포커스·새 탭 열기·스크린리더가 링크로 인식한다.
    <Link
      to={preorderPath(data.id)}
      className={[styles.root, styles.status[status], className]
        .filter(Boolean)
        .join(' ')}
    >
      <img src={imageSrc} alt={imageAlt} className={styles.image} />
      <span className={[styles.dday, styles.ddayColor[status]].join(' ')}>
        {ddayLabel}
      </span>
      <div className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={styles.benefit}>{benefit}</span>
        <span className={styles.meta}>
          예약 기간 {formatPreorderDate(opensAt)} ~{' '}
          {formatPreorderDate(closesAt)}
        </span>
      </div>
    </Link>
  )
}
