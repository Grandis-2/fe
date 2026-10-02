import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getProfile, putProfile } from './profile'

const queryKey = ['profile'] as const

// 비로그인이면 401로 실패한다 — 정책이 4xx는 재시도하지 않으므로 data는 비어 있다.
export const useProfile = () =>
  useQuery({
    queryKey,
    queryFn: ({ signal }) => getProfile(signal),
    ...queryPolicy.account,
  })

// 저장 응답으로 캐시를 바로 갱신한다 — 가입 직후 결제 화면이 옛 값(null)을 잠깐 보지 않게 한다.
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: putProfile,
    onSuccess: (saved) => queryClient.setQueryData(queryKey, saved),
  })
}
