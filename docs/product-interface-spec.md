# 업킨지 앤 컴퍼니 — 제품/인터페이스 기획

## 1. 제품 방향

업킨지 앤 컴퍼니는 제품을 실제 시장에 내놓기 전에, 한국형 synthetic persona 패널을 대상으로 **시장조사 시뮬레이션**을 돌려보는 서비스다.

핵심 UX는 “리서치 컨설턴트에게 브리프를 던지듯 입력하면, AI가 가상 시장 반응 리포트를 만들어주는 것”이다.

## 2. MVP 사용자 여정

1. **제품 브리프 작성**
   - 제품명
   - 한 줄 설명
   - 핵심 기능
   - 가격 옵션
   - 예상 타깃
   - 확인하고 싶은 가설
   - 현재 대체 행동/경쟁 대안

   이 필드는 `current_alternatives`로 API에 전달되어 persona가 “왜 지금 방식에서 바꿀지/안 바꿀지”를 판단하는 switching-context로 사용된다.

   입력 후 `brief_quality` preflight가 구체성, 누락 필드, 다음 질문을 먼저 점검한다.

2. **조사 설계 선택**
   - Concept test
   - Pricing test
   - Message test
   - Objection mining
   - Segment discovery

3. **페르소나 패널 구성**
   - Nemotron-Personas-Korea에서 N명 무작위 샘플링
   - 특정 제품군은 `persona_filters`로 target segment를 우선 랭킹/축소
   - seed 저장으로 재현 가능하게 구성
   - 이름 파싱 후 persona card에 표시

4. **시뮬레이션 실행**
   - persona별로 제품 이해도, 필요 적합도, 채택 가능성, 가격 반응, 거부 이유 생성
   - Upstage API는 서버 환경변수의 `UPSTAGE_API_KEY`로만 호출

5. **리포트 확인**
   - Executive summary
   - Adoption likelihood
   - Segment별 반응
   - Top objections
   - Pricing sensitivity
   - Recommended next questions

## 3. 인터페이스 구조

### 화면 1: Research Console

한 화면에서 입력 → 실행 → 결과 preview까지 보이게 한다.

구성:

- 좌측: Product brief form
- 중앙: Persona panel / simulation controls
- 우측: Market signal dashboard
- 하단: Generated report preview

### 화면 2: Persona Panel

샘플링된 persona를 카드로 보여준다.

카드 정보:

- name
- age / province / occupation
- short persona summary
- likely adoption stance
- key concern

### 화면 3: Report

시뮬레이션 결과를 리포트 형태로 정리한다.

필수 섹션:

- What will likely work
- What will likely block adoption
- Which segments respond first
- Pricing risk
- Copy/message recommendations
- Real-world validation plan

## 4. 보안 원칙

API 키는 절대 브라우저 localStorage나 프론트엔드 코드에 저장하지 않는다.

권장 구조:

```text
Browser UI
  ↓
Backend API
  ↓ reads .env
UPSTAGE_API_KEY
  ↓
Upstage API
```

따라서 MVP UI에는 API 키 입력칸을 두지 않는다. 재영이 API 키를 주면 `.env`에만 넣고, backend에서 읽게 한다.

## 5. 현재 프로토타입

현재는 `prototype/` 아래에 dependency 없는 static prototype을 둔다.

정적 mock 모드:

```bash
cd prototype
python3 -m http.server 5173
```

Solar Pro 3 API 연결 모드:

```bash
cp .env.example .env
# .env에 UPSTAGE_API_KEY 입력
python scripts/run_upkinsey_server.py --port 5173
```

접속:

```text
http://localhost:5173
```

현재 기능:

- 제품 브리프 입력 UI
- 타깃 고객 및 현재 대체 행동 입력
- 조사 유형 선택
- persona sample size / seed 설정
- product brief의 `target_market`과 선택적 `persona_filters`를 시뮬레이션 prompt/request plan에 포함
- product brief 품질 점검 (`brief_quality.score`, 누락 항목, recommended questions)을 결과와 report preview에 포함
- `persona_filters`는 occupation/province/keyword/age 조건으로 Nemotron panel을 결정적으로 랭킹하고 `panel_limit`까지 축소
- Upstage Solar Pro 3 기반 market signal 생성 (`/api/simulate`)
- persona별 독립 API 요청은 `max_parallel_requests`/`UPKINSEY_MAX_PARALLEL_REQUESTS` 기준으로 병렬 실행
- API 요청 전 brief/messages/temperature/max_tokens를 검증하고 429/5xx는 bounded retry
- backend가 없으면 mock signal로 fallback
- persona preview cards
- persona별 상세 결과 패널: understanding / need fit / adoption / price risk / drivers / risks / next question
- 선택한 persona와 후속 인터뷰형 대화 (`/api/persona-chat`)
- report preview
- founder decision memo와 run budget/panel coverage guardrail을 report preview에 노출
- current alternative & switching trigger 분석 카드
- `report_markdown` 기반 Markdown 리포트 복사
- Simulation Versions 목록에서 evidence quality, Solar call budget, target panel match를 함께 표시해 저장 run을 열기 전에 신뢰도/비용 리스크 triage

다음 기능:

- 실제 Nemotron sampler 연결
- persona chat transcript 저장
- JSONL trace 저장
- Markdown report download/PDF export polish
