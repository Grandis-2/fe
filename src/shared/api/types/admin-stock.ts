// 스펙에 LIMITED만 등장한다. 다른 값이 생기면 여기에 추가한다.
export type StockPolicyLimited = 'LIMITED'

export type AdminStockItem = {
  productId: string
  optionCode: string
  policy: StockPolicyLimited
  /** 운영자가 설정한 총 수량 */
  initialQuantity: number
  /** 아직 남은 수량 */
  availableQuantity: number
  /** 예약으로 잡혀 있는 수량 */
  reservedQuantity: number
  adjustmentsEnabled: boolean
  updatedAt: string
  updatedBy: string | null
}

export type AdminStockResponse = {
  productId: string
  items: AdminStockItem[]
}

export type AdminStockPutRequest = {
  optionCode: string
  initialQuantity: number
  policy?: StockPolicyLimited
  adjustmentsEnabled?: boolean
  reason?: string | null
}
