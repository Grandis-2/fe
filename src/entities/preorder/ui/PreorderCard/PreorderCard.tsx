import { Link } from 'react-router'

import * as styles from './PreorderCard.css'

export type PreorderCardData = {
  id: string | number
  imageSrc: string
  imageAlt?: string
  title: string
  opensAt: string
  closesAt: string
}

export type PreorderCardProps = {
  data: PreorderCardData
  className?: string
}

export function PreorderCard({ data, className }: PreorderCardProps) {
  const { imageSrc, imageAlt = '', title, opensAt, closesAt } = data

  return (
    // div onClick이 아니라 링크 — 키보드 포커스·새 탭 열기·스크린리더가 링크로 인식한다.
    <Link
      to={`/preorder/${data.id}`}
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      <img src={imageSrc} alt={imageAlt} className={styles.image} />
      <div className={styles.body}>
        <div className={styles.title}>{title}</div>
        <div className={styles.period}>{`${opensAt} ~ ${closesAt}`}</div>
      </div>
    </Link>
  )
}
