import { apiClient } from '@shared/api/client'
import type { DefaultAddressResponse } from '@shared/api/types'

import type { DefaultAddress } from '../model/defaultAddress'

const PATH = '/api/v1/me/default-address'

// 서버는 { shippingAddress } 봉투로 내려준다 — 화면은 주소 하나(없으면 null)만 본다.
export const getDefaultAddress = async (): Promise<DefaultAddress | null> => {
  const { shippingAddress } =
    await apiClient.request<DefaultAddressResponse>(PATH)
  return shippingAddress
}

// 다섯 칸을 항상 통째로 보낸다 — 부분 수정 없음.
export const putDefaultAddress = async (
  body: DefaultAddress,
): Promise<DefaultAddress | null> => {
  const { shippingAddress } = await apiClient.request<DefaultAddressResponse>(
    PATH,
    { method: 'PUT', body },
  )
  return shippingAddress
}
