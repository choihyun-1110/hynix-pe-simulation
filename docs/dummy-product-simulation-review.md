# Dummy Product Simulation Review — 2026-05-08

이 문서는 `examples/dummy_products.json`의 테스트 제품 6개를 대상으로 Upstage Solar Pro 3 기반 market simulation을 반복 실행한 결과 리뷰다.

## 실행 설정

- Products: 6개
- Repeats: 2회/제품
- Product/repeat workers: 3
- Persona workers per simulation: 4
- 최대 동시 persona API 요청: 대략 12개
- Model: Upstage Solar Pro 3
- Raw run artifact: `runs/dummy-market-suite/20260508-174035/`

참고: 첫 번째 3회 반복 run에서는 모든 제품/persona가 지나치게 `조건부 긍정`으로 몰리는 경향이 있었다. 그래서 prompt에 score/stance/price-risk calibration rubric을 추가한 뒤 2회 반복 run을 다시 실행했다.

## 더미 테스트 제품

더미 제품은 제품군이 겹치지 않도록 일부러 다양하게 만들었다.

1. `냉장고핏 AI 식단 코치` — 건강/식단 앱
2. `동네수리 매칭` — 로컬 수리 매칭 서비스
3. `실버톡 복약 알림` — 고령자/보호자 복약 관리
4. `사장님 리뷰비서` — 소상공인 리뷰 관리 SaaS
5. `출퇴근 날씨보험` — 날씨 기반 미니 보험
6. `우리동네 정책 알림` — 지자체 정책/지원금 알림

## Ranked Summary

| Rank | Product | Verdict | Adoption mean ± sd | Need fit | Price risk | Successes |
|---:|---|---|---:|---:|---|---:|
| 1 | 실버톡 복약 알림 | 조건부 후보 | 60.0 ± 2.8 | 60.0 | Medium | 2/2 |
| 2 | 우리동네 정책 알림 | 조건부 후보 | 58.5 ± 0.7 | 61.0 | Low-Medium | 2/2 |
| 3 | 냉장고핏 AI 식단 코치 | 조건부 후보 | 56.0 ± 0.0 | 56.5 | Medium | 2/2 |
| 4 | 출퇴근 날씨보험 | 재포지셔닝 필요 | 53.0 ± 7.1 | 48.5 | Medium | 2/2 |
| 5 | 동네수리 매칭 | 재포지셔닝 필요 | 48.0 ± 0.0 | 49.0 | Medium | 2/2 |
| 6 | 사장님 리뷰비서 | 재포지셔닝 필요 | 47.0 ± 1.4 | 46.0 | Medium | 2/2 |

## 해석

### 1. 가장 좋은 후보: 실버톡 복약 알림

- adoption 평균은 60.0으로 가장 높지만 압도적인 수준은 아니다.
- 카카오톡 기반 접근성이 반복적으로 긍정 driver로 등장했다.
- 다만 유료 보호자 플랜, 음성 안내 품질, 실제 복약 확인 가능성이 핵심 리스크다.
- 다음 테스트는 `보호자 플랜 월 3,900원` vs `가족 무료 초대 + 프리미엄 기능 유료` 메시지 비교가 좋다.

### 2. 정책/지원금 알림은 need fit이 안정적

- `우리동네 정책 알림`은 adoption 58.5, need fit 61.0으로 상위권이다.
- 가족 대리 관리, 신청 마감 알림, 무료 기본 서비스가 장점으로 나온다.
- 리스크는 신청 대행 수수료 신뢰와 개인정보/서류 처리 부담이다.
- 실제 서비스로는 “신청 대행”보다 “체크리스트 + 마감 알림”을 먼저 MVP로 잡는 편이 안전하다.

### 3. 식단 코치는 기능 신뢰와 사용 장벽이 병목

- `냉장고핏 AI 식단 코치`는 건강/가족 맥락은 좋지만 adoption 56.0으로 중간이다.
- 혈당 친화 메뉴와 장보기 리스트는 긍정적이지만, 사진 인식 정확도와 월 구독 저항이 반복적으로 나온다.
- 실제 검증 질문은 “사진 한 장으로 얼마나 정확한 추천이 되는가?”와 “무료 체험 후 결제 전환 조건”이다.

### 4. 날씨보험/수리매칭/리뷰비서는 재포지셔닝 필요

- `출퇴근 날씨보험`: 보상 기준 투명성과 실제 쿠폰 효용이 약하다.
- `동네수리 매칭`: 견적 정확도와 기사 신뢰가 핵심인데, 디지털 장벽도 크다.
- `사장님 리뷰비서`: 소상공인 persona가 아니라 일반 생활 persona로 평가해서 fit이 낮게 나왔다. 이 제품은 persona panel을 소상공인 중심으로 stratify해야 한다.

## 시스템 검토

### 잘 된 점

- 병렬 요청이 정상 동작했다.
- 반복 run 간 점수 variance가 작아 대체로 안정적인 결과를 냈다.
- calibration rubric 추가 후, 첫 run보다 adoption/stance가 더 보수적으로 나왔다.
- top risks와 validation questions는 실제 후속 설문 문항으로 바꾸기 쉽다.

### 발견한 문제

1. **Persona panel이 아직 너무 작다**
   - 현재 sample persona 4명으로는 제품별 segment 차이가 충분히 안 나온다.
   - 다음 단계에서는 `nvidia/Nemotron-Personas-Korea`에서 50-200명을 실제 샘플링해야 한다.

2. **Stance가 여전히 `조건부 긍정`에 몰린다**
   - calibration 후 `회의형`이 생기긴 했지만 아직 중립 편향이 있다.
   - 별도 critic/evaluator pass 또는 deterministic score calibration이 필요하다.

3. **제품-category fit이 persona panel에 좌우된다**
   - `사장님 리뷰비서`처럼 특정 사업자 대상 제품은 일반 인구 persona로 평가하면 낮게 나온다.
   - panel sampling 단계에서 `occupation`, `family_type`, `age_bucket`, `province` 조건을 지원해야 한다.

4. **risk 문구 중복이 많다**
   - 같은 의미의 질문/리스크가 다른 표현으로 반복된다.
   - report generator에 semantic dedup 또는 LLM summary pass를 추가하는 것이 좋다.

## 다음 구현 제안

1. 실제 Nemotron sampler를 batch suite에 연결
2. product별 target segment 조건 지정
3. persona N=50 이상으로 확장
4. risks/questions dedup pass 추가
5. product category별 prompt template 분기
6. raw JSONL trace + markdown/PDF report export

완료됨: repeated run stability report는 suite review에 `stable`/`directional`/`volatile` label, adoption range, decision count로 자동 생성된다.
