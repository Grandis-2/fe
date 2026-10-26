// 밖에서는 TanStack Query 훅으로만 들어온다.
export {
  useAdmissionRates,
  useChangeAdmissionRate,
  useSettingChanges,
  useWaitingroomStatus,
} from './api/useAdminWaitingroom'
export { useWaitingroomStatusHistory } from './api/useWaitingroomStatusHistory'
export type { AdmissionRateChange } from './api/useAdminWaitingroom'
export {
  productWaitEstimate,
  productWaitSeconds,
  waitEstimate,
} from './lib/waitEstimate'
export { admissionRateRefusal, admissionZone } from './lib/admissionCapacity'
export type {
  AdmissionRateRefusal,
  AdmissionZone,
} from './lib/admissionCapacity'
export {
  isBraking,
  settingChangeKindLabel,
  settingChangeUnit,
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
  WaitingroomSettingChange,
  WaitingroomStatus,
} from './model/types'
