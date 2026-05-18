# 업킨지 앤 컴퍼니 — 넣으면 좋을 서비스 아이디어 요소

이 문서는 제품 출시 전 시장조사 시뮬레이션 서비스에 추가하면 좋은 기능/경험 요소를 정리한 것이다. 핵심 방향은 “그럴듯한 AI 의견”이 아니라 **실제 시장조사 전에 가설·질문·세그먼트를 더 뾰족하게 만드는 도구**다.

## 1. Product Brief 품질 점검

사용자가 제품 설명을 넣으면 바로 시뮬레이션하지 말고, 먼저 brief의 빈틈을 검토한다.

### 기능

- 제품 설명이 너무 추상적인지 확인
- 타깃 고객이 불명확한지 확인
- 가격 옵션이 빠졌는지 확인
- 경쟁 제품/대체 행동이 빠졌는지 확인
- 검증하고 싶은 가설이 측정 가능한 형태인지 확인

### 예시 출력

```json
{
  "brief_quality_score": 72,
  "missing_fields": ["경쟁 대안", "주요 사용 상황"],
  "recommended_questions": [
    "사용자가 현재 이 문제를 어떻게 해결하고 있는가?",
    "무료 체험 후 어떤 순간에 결제할 이유가 생기는가?"
  ]
}
```

## 2. Persona Panel Builder

Nemotron persona를 단순 랜덤으로 뽑는 것뿐 아니라, 제품에 맞는 패널을 구성하게 한다.

### 패널 모드

1. **Random Korea Panel**
   - 전체 한국형 persona에서 무작위 샘플링

2. **Targeted Panel**
   - 연령, 지역, 직업, 가족구성, 관심사 조건으로 샘플링

3. **Contrast Panel**
   - 일부러 상반된 집단을 섞음
   - 예: 고령층 vs 20대, 수도권 vs 지방, 유료 구독 친화 vs 가격 민감층

4. **Early Adopter Panel**
   - 제품에 가장 반응할 가능성이 높은 persona를 먼저 찾음

5. **Skeptic Panel**
   - 반대/불신/거부 이유를 잘 뽑아내는 persona 중심

## 3. Segment Discovery

시뮬레이션 결과에서 “누가 좋아하는가?”를 자동으로 찾아준다.

### 산출물

- high-intent segment
- low-intent segment
- price-sensitive segment
- trust-sensitive segment
- usability-sensitive segment

### 예시

```text
High-intent segment:
- 가족 건강 의사결정자
- 복약/식단/정책 알림처럼 생활 관리 부담이 있는 사용자
- 무료 체험 후 가족과 함께 검토하려는 사용자

Low-intent segment:
- 월 구독에 민감한 고정소득층
- 앱 설치/사용에 부담을 느끼는 사용자
```

## 4. Objection Mining

긍정 반응보다 중요한 것은 “왜 안 쓰는가”다. persona별 반응에서 거부 이유를 구조화한다.

### objection category

- 가격 부담
- 신뢰 부족
- 개인정보/데이터 우려
- 사용법 복잡성
- 기존 습관과 충돌
- 필요성 낮음
- 가족/조직 내 의사결정 문제
- 대체재가 이미 충분함

### 좋은 출력

```json
{
  "objection": "사진 기반 식단 추천의 정확도를 믿기 어렵다",
  "category": "trust",
  "affected_segments": ["건강관리 관심층", "고령 사용자"],
  "suggested_fix": "추천 근거와 영양사 검수 여부를 화면에 표시"
}
```

## 5. Pricing Lab

가격 옵션을 여러 개 넣으면 persona별 지불 의향과 저항 지점을 비교한다.

### 기능

- 무료/유료/구독/건별 결제 비교
- 가격별 adoption curve 생성
- persona별 willingness-to-pay 근거 저장
- 가격 저항 문구 자동 추출

### 추천 UI

- 가격 슬라이더
- 가격별 예상 전환율 카드
- “이 가격이면 왜 안 사는가?” objection list

## 6. Message Test

제품 설명 문구를 여러 버전 넣고 어떤 메시지가 더 잘 먹히는지 비교한다.

### 메시지 유형

- 기능 중심: “AI가 냉장고 사진을 분석합니다”
- 효용 중심: “오늘 뭐 먹을지 고민을 줄입니다”
- 신뢰 중심: “추천 근거와 건강 목표를 함께 보여줍니다”
- 가격 중심: “무료로 시작하고 필요할 때만 업그레이드”
- 가족 중심: “부모님 식단과 복약을 가족이 함께 확인”

### 산출물

- best-performing message
- segment별 선호 메시지
- 헷갈리는 표현
- 불신을 키우는 표현

## 7. Simulated Interview

단순 설문형 점수만 받지 말고, 선택한 persona와 3~5턴 인터뷰를 진행한다.

### 흐름

1. 제품 설명 제시
2. 첫 반응 질문
3. 가장 걱정되는 점 질문
4. 가격 제시 후 반응 질문
5. 어떤 조건이면 써볼지 질문

### 장점

- 실제 인터뷰 전에 질문지를 다듬기 좋다.
- 예상 밖의 표현/불만/오해를 찾을 수 있다.

## 8. Focus Group Simulation

여러 persona가 서로의 의견을 보고 반응하게 한다.

### 사용처

- 가족 단위 의사결정 제품
- 지역 커뮤니티 서비스
- 정책/복지 서비스
- B2B 구매 의사결정

### 주의

- 드라마틱한 롤플레이가 되지 않도록 발화 길이와 action schema를 제한한다.
- “동의/반박/질문/조건부 수용” 같은 action type을 고정한다.

## 9. Competitor / Alternative Comparison

제품을 경쟁 제품이 아니라 **현재 대체 행동**과 비교하게 한다.

예:

- 식단 앱 vs 그냥 네이버 검색
- 수리 매칭 앱 vs 동네 지인 추천
- 정책 알림 앱 vs 주민센터 문의
- 리뷰 관리 SaaS vs 직접 답글 작성

### 출력

```json
{
  "current_alternative": "동네 지인에게 수리 기사를 물어봄",
  "why_current_alternative_persists": "신뢰가 이미 형성되어 있음",
  "switching_trigger": "견적 투명성과 후기 검증이 충분히 보일 때"
}
```

## 10. Go / No-Go Decision Board

결과를 보고 바로 다음 결정을 할 수 있게 만든다.

### decision labels

- **Go**: 다음 단계 실제 사용자 조사 진행
- **Refine**: 메시지/가격/타깃 수정 후 재시뮬레이션
- **Segment Pivot**: 다른 타깃으로 전환
- **Kill / Hold**: 현재 형태로는 우선순위 낮음

### 판단 기준 예시

```text
Go:
- adoption_score >= 70
- top risk가 해결 가능한 수준
- 특정 segment에서 강한 반응

Refine:
- adoption_score 50-69
- need_fit은 높지만 가격/신뢰 문제가 큼

Segment Pivot:
- 전체 평균은 낮지만 특정 persona cluster가 강하게 반응

Hold:
- need_fit과 adoption 모두 낮고 반복 run에서도 개선 신호 없음
```

## 11. Real Research Plan Generator

시뮬레이션은 끝이 아니라 실제 조사 설계로 이어져야 한다.

### 자동 생성할 것

- 실제 설문 문항
- 인터뷰 질문지
- 모집해야 할 사용자 조건
- 검증할 핵심 가설 3개
- 랜딩페이지 A/B 테스트 문구
- MVP에서 반드시 넣을 기능/빼도 되는 기능

## 12. Trace & Reproducibility

서비스 신뢰를 위해 모든 결과는 추적 가능해야 한다.

### 저장할 것

- product brief hash
- persona dataset id/version
- sampled persona uuid/name
- sampling seed
- prompt version
- model name
- API response raw JSON
- parsed result
- aggregation config

## 13. UX 디테일 아이디어

### 좋은 UI 요소

- “시장에 물어보기” 버튼
- persona card hover 시 사용된 데이터 필드 표시
- adoption distribution chart
- objection heatmap
- segment radar chart
- 가격별 conversion curve
- report export: Markdown / PDF / PPT
- “이 결과로 실제 설문 만들기” 버튼
- “타깃 바꿔서 다시 돌리기” 버튼

### 톤

- 컨설팅 리포트처럼 명확하게
- 하지만 과장 없이 “가설”이라고 표시
- synthetic 결과와 실제 시장조사를 명확히 구분

## 14. 우선순위 추천

### MVP 바로 다음

1. 실제 Nemotron N=50+ persona sampling
2. Product Brief 품질 점검
3. Objection Mining
4. Pricing Lab
5. Real Research Plan Generator

### 그 다음

1. Segment Discovery
2. Message Test
3. Simulated Interview
4. Focus Group Simulation
5. PDF/PPT export

## 15. 핵심 차별점

업킨지 앤 컴퍼니가 단순 “AI에게 제품 평가 물어보기”와 달라지려면 다음이 중요하다.

1. 한 명의 LLM 의견이 아니라 persona panel 반응을 본다.
2. 평균 점수보다 segment와 objection을 찾는다.
3. 결과가 실제 사용자 조사 설계로 이어진다.
4. 모든 결과가 seed/prompt/persona 기준으로 재현 가능하다.
5. “정답”이 아니라 “다음 검증 가설”을 만든다.
