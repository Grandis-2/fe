// 밖에서는 TanStack Query 훅으로만 들어온다.
export {
  useAdmissionRates,
  useChangeAdmissionRate,
  useWaitingroomStatus,
} from './api/useAdminWaitingroom'
export type { AdmissionRateChange } from './api/useAdminWaitingroom'
export { waitEstimate } from './lib/waitEstimate'
export {
  isBraking,
  settingSourceLabel,
  WAITINGROOM_DEFAULTS,
  waitingroomRuntimeLabel,
} from './model/types'
export type {
  AdmissionRates,
  WaitingroomProductRate,
  WaitingroomProductStatus,
  WaitingroomSetting,
  WaitingroomStatus,
} from './model/types'
