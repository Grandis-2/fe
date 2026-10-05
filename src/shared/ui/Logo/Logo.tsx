import * as styles from './Logo.css'

export type LogoProps = {
  // 로고 뒤에 같은 서체로 이어 붙일 말(관리자 헤더의 ' ADMIN')
  suffix?: string
  className?: string
}

export function Logo({ suffix, className }: LogoProps) {
  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')}>
      NO<span className={styles.v}>V</span>A{suffix}
    </span>
  )
}
