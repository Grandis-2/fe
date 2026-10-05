import { useNavigate } from 'react-router'

import { HOME_PATH } from '@shared/config/routes'
import { Onboarding } from '@widgets/onboarding'

export function OnboardingPage() {
  const navigate = useNavigate()
  return <Onboarding onFinish={() => navigate(HOME_PATH)} />
}
