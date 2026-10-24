// 밖에서는 TanStack Query 훅으로만 들어온다.
export {
  useAdmissionRates,
  useChangeAdmissionRate,
  useWaitingroomStatus,
} from './api/useAdminWaitingroom'
export { useWaitingroomStatusHistory } from './api/useWaitingroomStatusHistory'
export type { AdmissionRateChange } from './api/useAdminWaitingroom'
export { waitEstimate } from './lib/waitEstimate'
export { admissionRateRefusal, admissionZone } from './lib/admissionCapacity'
export type {
  AdmissionRateRefusal,
  AdmissionZone,
} from './lib/admissionCapacity'
export {
  isBraking,
  settingSourceLabel,
  WAITINGROOM_DEFAULTS,
  waitingroomRuntimeLabel,
} from './model/types'
export type {
  AdmissionCapacity,
  AdmissionRates,
  WaitingroomProductRate,
  WaitingroomProductStatus,
  WaitingroomSetting,
  WaitingroomStatus,
} from './model/types'
