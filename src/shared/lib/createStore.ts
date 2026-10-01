import { useSyncExternalStore } from 'react'

// zustand의 create()와 같은 모양(훅 자체에 getState/setState가 붙는다)만 흉내낸
// 최소 구현이다 — 필드 몇 개짜리 상태(세션, 모달)에 라이브러리를 쓸 정도는
// 아니라서 useSyncExternalStore로 대체한다.
type Setter<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void

type Store<T> = (<Selected>(selector: (state: T) => Selected) => Selected) & {
  getState: () => T
  setState: Setter<T>
}

export function createStore<T>(
  init: (set: Setter<T>, get: () => T) => T,
): Store<T> {
  const listeners = new Set<() => void>()
  const getState = () => state

  const setState: Setter<T> = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial
    state = { ...state, ...next }
    listeners.forEach((listener) => listener())
  }

  let state = init(setState, getState)

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function useStore<Selected>(selector: (state: T) => Selected): Selected {
    return useSyncExternalStore(subscribe, () => selector(state))
  }

  useStore.getState = getState
  useStore.setState = setState

  return useStore
}
