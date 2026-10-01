import type { DefaultAddress as DefaultAddressDto } from '@/shared/api/types'

// 서버 DTO와 모양이 같아서 그대로 재노출한다(CLAUDE.md Data layer).
// 마이페이지에서 관리하는 여러 배송지가 아니라, 결제 화면에 자동으로 채워 넣을
// "기본 배송지" 하나다(11-frontend-guide.md §7).
export type DefaultAddress = DefaultAddressDto
