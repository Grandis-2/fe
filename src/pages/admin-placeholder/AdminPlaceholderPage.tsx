import * as styles from './AdminPlaceholderPage.css'

export type AdminPlaceholderPageProps = {
  title: string
}

// 기능 범위가 아직 안 정해진 관리자 화면(홈, 개발자 기능 메뉴)의 자리표시자.
// 스코프가 정해지면 각자 전용 페이지로 교체한다.
export function AdminPlaceholderPage({ title }: AdminPlaceholderPageProps) {
  return (
    <div className={styles.root}>
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>준비 중입니다.</div>
    </div>
  )
}
