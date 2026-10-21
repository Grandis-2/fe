import type {
  AdminBannerRequest,
  AdminBannerView,
  BannerIcon,
  BannerTarget,
} from '@shared/api/types'
import type { UploadedImage } from '@shared/ui'

export type AdminBanner = AdminBannerView
export type BannerTargetType = BannerTarget['type']

export type BannerTextField = keyof Pick<
  AdminBannerRequest,
  'badge' | 'title' | 'description' | 'tabLabel' | 'imageAlt'
>

/** 명세의 글자 수 상한 */
export const BANNER_TEXT_MAX: Record<BannerTextField, number> = {
  badge: 20,
  title: 100,
  description: 200,
  tabLabel: 60,
  imageAlt: 100,
}

/** 만들기 폼이 다루는 값 — 고르기 전인 칸(아이콘·사진·대상)은 비어 있을 수 있다 */
export type AdminBannerFormValue = Record<BannerTextField, string> & {
  icon: BannerIcon | null
  /** ImageUploader가 배열을 다뤄서 한 장이어도 배열이다 */
  image: UploadedImage[]
  targetType: BannerTargetType
  targetId: string
  visible: boolean
}

export const createEmptyBannerFormValue = (): AdminBannerFormValue => ({
  badge: '',
  title: '',
  description: '',
  tabLabel: '',
  imageAlt: '',
  icon: null,
  image: [],
  targetType: 'PRODUCT',
  targetId: '',
  visible: true,
})

/** 고치기 화면의 초기값. 사진은 지금 주소를 그대로 둔다(그대로 보내면 사진이 안 바뀐다) */
export const toBannerFormValue = (
  banner: AdminBanner,
): AdminBannerFormValue => ({
  badge: banner.badge,
  title: banner.title,
  description: banner.description,
  tabLabel: banner.tabLabel,
  imageAlt: banner.imageAlt,
  icon: banner.icon,
  image: [
    {
      id: banner.imageUrl,
      url: banner.imageUrl,
      name: banner.imageUrl.split('/').pop() ?? '',
    },
  ],
  targetType: banner.target.type,
  targetId: banner.target.id,
  visible: banner.visible,
})

/**
 * 보내기 전에 막을 문제. 없으면 null. 서버도 같은 칸으로 400을 주지만, 사진이 올라가는
 * 중에 보내면 미리보기 주소(blob:)가 실려 거절되니 여기서 먼저 막는다.
 */
export function bannerFormProblem(value: AdminBannerFormValue): string | null {
  const blank = (Object.keys(BANNER_TEXT_MAX) as BannerTextField[]).some(
    (field) => !value[field].trim(),
  )
  if (blank) return '모든 문구 칸을 채워 주세요.'
  if (!value.icon) return '탭 아이콘을 골라 주세요.'
  const [image] = value.image
  if (!image) return '배너 사진을 올려 주세요.'
  if (image.status === 'uploading') {
    return '사진을 올리는 중입니다. 다 올라간 뒤에 다시 눌러 주세요.'
  }
  if (image.status === 'error')
    return '사진을 올리지 못했습니다. 다시 올려 주세요.'
  if (!value.targetId) return '연결할 대상을 골라 주세요.'
  return null
}

// 줄바꿈(\n)은 그대로 담는다 — 앞뒤 공백만 걷어 낸다.
export const toBannerRequest = (
  value: AdminBannerFormValue,
): AdminBannerRequest => ({
  badge: value.badge.trim(),
  title: value.title.trim(),
  description: value.description.trim(),
  tabLabel: value.tabLabel.trim(),
  imageAlt: value.imageAlt.trim(),
  // bannerFormProblem을 통과한 값만 온다.
  icon: value.icon ?? 'Smartphone',
  imageUrl: value.image[0]?.url ?? '',
  target: { type: value.targetType, id: value.targetId },
  visible: value.visible,
})
