---
paths:
  - "src/entities/**"
  - "src/shared/api/**"
---

# Data layer

FSD 위에 얹는 규칙이다 — `domain/`, `data/`, `usecases/` 같은 별도 최상위 폴더는 만들지 않는다.
목적은 하나: **서버 응답 모양(DTO)이 UI까지 새지 않게 해서, API가 바뀌어도 고칠 곳이 `entities/*/api` 하나로 끝나게 한다.**

흐름: 서버 JSON → `shared/api`(DTO 타입, fetch) → `entities/*/api`(DTO → 모델) → `entities/*/model`(도메인 타입) → ui/features/widgets/pages

| 코드                                                                     | 위치                     |
| ------------------------------------------------------------------------ | ------------------------ |
| 공통 fetch 래퍼, `ApiResponse`/`Paged`/`ApiError`, 서버 DTO 타입, MSW 목 | `shared/api/`            |
| 엔티티별 조회 함수(`getProduct(id)`) + DTO→모델 매퍼                     | `entities/<name>/api/`   |
| 화면이 쓰는 도메인 타입(`Product`)                                       | `entities/<name>/model/` |
| 사용자 행동 단위 로직(옵션 선택, 장바구니 담기)                          | `features/<name>/lib/`   |

- `@shared/api/types`(DTO)는 `entities/*/api`, `entities/*/model`에서만 import한다. 나머지는 엔티티 배럴(`@entities/product`)이 내보내는 모델 타입만 쓴다 — `import-x/no-restricted-paths`로 강제된다.
- DTO는 `shared/api`에 둔다(MSW 목이 DTO를 쓰는데 shared는 entities를 import할 수 없어서).
- 매퍼는 모양이 실제로 다를 때만 만든다(ISO 문자열 → `Date`, `null` 기본값, 필드명 변경). 같으면 `entities/*/model`에서 `export type Product = ProductDetail`로 재노출하고 끝낸다.
- `ApiResponse` 봉투는 fetch 래퍼에서 벗겨 `data`만 돌려주고, 실패는 throw한다 — 호출부에서 `success`를 매번 검사하지 않는다.
- Repository 인터페이스/구현체, DI 컨테이너, `UseCase` 클래스는 만들지 않는다(구현이 하나뿐인 추상화).
- `entities/product/api/`가 기준 구현이다 — 새 엔티티는 이 구조를 복사해서 시작한다.

## TanStack Query 정책

- `useQuery`에 `staleTime`/`retry`를 직접 쓰지 않고 `@shared/api/queryPolicy`의 프리셋(`catalog`/`account`/`live`)을 펼친다. 새 유형이 필요하면 프리셋을 추가한다.
- `queryFn`은 `({ signal })`을 API 함수까지 넘겨 키가 바뀌면 이전 요청이 취소되게 한다.
- 폴링은 `pollingInterval()`로 실패 시 간격을 늘린다.

## MSW로 실패 재현

- 실패 화면은 MSW 핸들러에서 `fail(status, { code, message })`(`@shared/api/mock/response`)로 재현해 확인한다 — 5xx(재시도 후 실패), 4xx(즉시 실패), 지연(타임아웃)을 각각 본다.
