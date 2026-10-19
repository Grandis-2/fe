import type { ReactNode } from 'react'

import { Link } from 'react-router'

import { Tag } from '@shared/ui'

import * as styles from './OpsTaskCard.css'

/** 급한 정도. 카드 순서도 이 순서다 — 실패 → 멈춤 → 기한·일상 */
export type OpsTaskLevel = 'urgent' | 'check' | 'todo'

const levelLabel: Record<OpsTaskLevel, string> = {
  urgent: '긴급',
  check: '확인',
  todo: '할 일',
}

// 색만으로 구분하지 않게 글자(긴급·확인·할 일)를 함께 단다.
const levelColor: Record<OpsTaskLevel, 'red' | 'yellow' | 'primary'> = {
  urgent: 'red',
  check: 'yellow',
  todo: 'primary',
}

export type OpsTaskCardProps = {
  level: OpsTaskLevel
  title: ReactNode
  description: ReactNode
  /** 이 일을 처리하는 화면 */
  action: { label: string; to: string }
}

/** 운영 홈 '지금 처리할 일' 한 줄 — 무엇이 몇 건인지와 처리할 화면으로 가는 버튼 */
export function OpsTaskCard({
  level,
  title,
  description,
  action,
}: OpsTaskCardProps) {
  return (
    <article className={[styles.root, styles.tone[level]].join(' ')}>
      <Tag
        variant="subtle"
        size="medium"
        rounded={false}
        color={levelColor[level]}
        widthOptions={Object.values(levelLabel)}
      >
        {levelLabel[level]}
      </Tag>
      <div className={styles.text}>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
      </div>
      <Link
        to={action.to}
        className={[
          styles.action,
          level === 'urgent' ? styles.actionPrimary : styles.actionOutline,
        ].join(' ')}
      >
        {action.label}
      </Link>
    </article>
  )
}
