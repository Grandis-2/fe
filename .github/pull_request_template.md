<!--
PR 제목은 commitlint·CodeRabbit과 같은 형식이어야 한다: <type>: <요약> 또는 <type>(<이슈 키>): <요약>
ex) feat(NF-18): 장바구니에 결제 정보 요약(리모컨) 추가
-->

## 📌 관련 이슈

- close #이슈번호

## ✨ 작업 내용

<!-- 어떤 변경 사항이 있었는지 주요 내용을 적어주세요. -->

- `entities/order`에 결제 정보 요약 카드(`OrderSummary`) 추가
- `entities/cart`의 `CartItem` 타입에서 합계 계산을 위해 `priceLabel`(문자열)을 `price`(숫자)로 변경
- `MypageCart` 위젯에 리모컨을 연결해 선택한 상품의 합계를 표시

## 📸 스크린샷 / 확인 결과

<!-- 화면 변경이면 스크린샷을, 컴포넌트 변경이면 Storybook 캡처나 play 함수 통과 결과를 첨부해주세요. -->

- 데스크톱/모바일 캡처 (`npm run dev`)
- `MypageCart.stories.tsx`의 `SelectAll` play 함수 통과 확인 (`npm run storybook`)

## 🔍 리뷰 포인트

<!-- 리뷰어가 집중해서 봐주었으면 하는 부분이 있다면 적어주세요. -->

- FSD 레이어 경계(`entities` → `widgets` → `pages`)를 벗어난 import가 없는지
- `shared/config/theme`의 색상·spacing·typography 토큰 대신 값을 직접 적은 곳은 없는지
- 이미 있는 컴포넌트(`shared/ui`, 관련 `entities/*`)와 겹치는 걸 새로 만들지 않았는지

## ✅ 체크리스트

- [ ] 커밋 메시지 컨벤션(`type: 요약` 또는 `type(이슈 키): 요약`)을 준수했는가? (`commit-msg` 훅이 자동으로 막는다)
- [ ] `npm run build`(`tsc -b` + `vite build`)와 `npm run lint`가 통과했는가?
- [ ] 변경한 컴포넌트의 Storybook 스토리를 추가/갱신했는가? (이 프로젝트엔 별도 테스트 러너가 없어 스토리가 사실상의 회귀 테스트다)
- [ ] 불필요한 주석이나 `console.log`를 제거했는가?

<!--
CodeRabbit이 지적을 남기면 리뷰 상태가 "Changes requested"로 바뀐다. 오탐이면:
- `skip-review` 라벨을 달면 이후 커밋에 대한 재검토만 멈춘다 — 이미 남은 리뷰는 사라지지 않는다.
- main·develop엔 branch protection이 없어서 "Changes requested" 상태 자체는 머지를 막지 않는다.
  그대로 머지하거나, 남은 리뷰를 관리자가 dismiss하면 된다.
- 지적이 틀렸다고 판단되면 리뷰 코멘트에 이유를 남겨 반박한다.
-->
