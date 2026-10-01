// 마이페이지의 "기본 배송지" 하나. entities/address의 여러 배송지(AddressCard)와는
// 다른 개념 — 여긴 결제 화면에 자동으로 채워 넣을 값 하나만 서버가 들고 있다.
export type DefaultAddress = {
  name: string
  phone: string
  postalCode: string
  line1: string
  /** 없으면 빈 문자열이 아니라 null로 온다. */
  line2: string | null
}

export type DefaultAddressResponse = {
  shippingAddress: DefaultAddress | null
}

// 다섯 칸을 항상 통째로 보낸다 — 부분 수정 없음(11-frontend-guide.md §7).
export type PutDefaultAddressRequest = DefaultAddress
