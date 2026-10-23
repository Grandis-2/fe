import type { AdminBannerFormValue } from '@entities/admin-banner'
import { BANNER_ICONS } from '@entities/banner'
import { Tag } from '@shared/ui'

import * as styles from './BannerPreview.css'

export type BannerPreviewProps = {
  value: Pick<
    AdminBannerFormValue,
    | 'badge'
    | 'title'
    | 'description'
    | 'tabLabel'
    | 'icon'
    | 'image'
    | 'imageAlt'
  >
}

/** 쓰는 중인 배너가 고객 메인 맨 위에 어떻게 보일지 — 폼 값이 바뀌는 대로 다시 그린다 */
export function BannerPreview({ value }: BannerPreviewProps) {
  const Icon = value.icon && BANNER_ICONS[value.icon]
  const [image] = value.image
  // 올리는 중엔 아직 서버 주소가 없어 화면용 미리보기 주소를 쓴다.
  const src = image?.previewUrl ?? image?.url
  const text = (content: string, fallback: string) =>
    content.trim() || <span className={styles.empty}>{fallback}</span>

  return (
    <div className={styles.root} aria-label="배너 미리보기">
      <div className={styles.text}>
        <div>
          <Tag color="primary" variant="solid" rounded={false} size="medium">
            {value.badge || '배지'}
          </Tag>
          <div className={styles.title}>{text(value.title, '제목')}</div>
          <div className={styles.description}>
            {text(value.description, '설명')}
          </div>
        </div>
        <div className={styles.tab}>
          <span className={styles.progress} />
          {Icon && <Icon size={20} aria-hidden />}
          <span className={styles.tabLabel}>
            {text(value.tabLabel, '탭 문구')}
          </span>
        </div>
      </div>
      <div
        className={[styles.visual, !src && styles.visualEmpty]
          .filter(Boolean)
          .join(' ')}
      >
        {src && <img src={src} alt={value.imageAlt} className={styles.image} />}
      </div>
    </div>
  )
}
