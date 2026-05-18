# Upkinsey

Self-hostable synthetic market research framework powered by Upstage Solar and Korean persona panels.

## 목표

- Upstage API를 시뮬레이션 엔진/에이전트 판단 모듈로 사용
- 시나리오, 상태, 액션, 관찰 로그를 분리해 재현 가능한 실험 구조 만들기
- API 키와 실행 로그를 안전하게 관리
- 합성 페르소나 반응을 objection/segment recommendation으로 요약해 다음 검증 액션 제안
- 제품 brief의 구체성/누락 항목을 사전 점검해 시뮬레이션 전 질문 품질 개선
- Go/Refine/Segment Pivot/Hold decision board로 synthetic pre-research 이후의 실제 검증 다음 단계 제안
- synthetic persona 신호를 실제 인터뷰 screener/question/success criteria로 바꾸는 real-user validation plan 제공
- validation/screener 신호를 바로 진행 가능한 25-30분 interview discussion guide로 변환
- validation/message/pricing 신호를 Google Forms/Typeform에 옮길 수 있는 5-7분 quantitative survey instrument로 변환
- synthetic baseline을 실제 인터뷰/설문 결과와 비교하는 field validation calibration tracker 제공
- decision/objection/switching 신호를 우선순위·가설·통과 기준이 있는 experiment backlog로 변환
- persona driver/objection/switching trigger를 랜딩·설문에 바로 쓰는 message angle A/B test로 변환
- 현재 대체 행동/경쟁 대안 대비 switching trigger와 검증 테스트를 도출
- 현재 대체 행동별로 왜 머무르는지, Upkinsey가 증명해야 할 차이, 인터뷰 probe를 정리하는 competitive benchmark matrix 제공
- 고의향/조건부/저의향 persona를 섞어 실제 포커스그룹 전 토론 쟁점을 좁히는 bounded focus group simulation plan 제공
- 가격 옵션별 persona price friction을 deterministic pricing sensitivity lab으로 변환해 실제 WTP 검증 질문 제안
- 생성된 market insight를 Notion/GitHub/문서에 바로 붙여 넣을 수 있는 Markdown report export 제공
- 합성 결과의 과신을 막기 위해 panel size/targeting/brief quality/score dispersion 기반 evidence quality guardrail 제공
- 저장된 simulation version을 이전 동일 제품/리서치 타입 실행과 비교해 adoption/need-fit/price/decision 변화 추적
- Solar Pro 3 persona 호출 수, 병렬 batch, 실제 panel 크기 mismatch를 드러내는 run budget guardrail 제공
- 선택된 persona panel의 지역/직업/연령 coverage와 target filter match를 보여주는 panel coverage guardrail 제공
- 저장된 simulation version 목록에서 evidence quality, 호출 예산, panel targeting 상태를 바로 보여줘 재실행 결과를 열기 전에 신뢰도/비용 리스크를 triage
- 평균 점수 뒤의 대표 supporter/barrier/follow-up persona signal을 인터뷰 probe로 바꾸는 persona evidence pack 제공
- 고의향/조건부/저의향 persona cohort의 driver·objection 차이를 비교하는 intent cohort contrast 제공
- 합성 신호를 과신하지 않도록 value/pricing/trust/usability/switching 가정을 falsification test로 바꾸는 assumption stress test 제공
- objection/segment/switching 신호를 다음 Solar 재실험에 바로 넣을 수 있는 next-run brief variants로 변환
- 합성 신호를 실제 응답자 모집 기준/스크리너/쿼터로 바꾸는 recruiting screener pack 제공
- 평균 adoption/need-fit이 Go/Hold 기준을 넘나드는지 보여주는 decision sensitivity guardrail 제공
- 긴 synthetic report를 의사결정용 한 페이지로 압축하는 founder decision memo 제공

## 초기 구조

```text
Design.md                          # OpenAI.com 기반 visual style reference
docs/design.md                     # 시스템 디자인 초안
docs/persona-prompting.md          # 일반 페르소나 데이터 활용/프롬프트 설계
docs/nemotron-personas-korea.md    # nvidia/Nemotron-Personas-Korea 전용 설계
src/                               # 구현 코드
examples/                          # 예시 시나리오/설정
tests/                             # 테스트
.env.example                       # 환경변수 예시
```

## 시작하기

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[persona]'
cp .env.example .env
# .env에 UPSTAGE_API_KEY와 운영용 Basic Auth 값을 입력
PYTHONPATH=src python3 -m unittest discover -s tests -p 'test*.py' -v
```

Upstage Solar Pro 3 API까지 연결해서 prototype을 실행하려면:

```bash
python scripts/run_upkinsey_server.py --port 5173
```

접속: `http://localhost:5173`

공개 배포에서는 서버의 `UPSTAGE_API_KEY`로 유료 API 호출이 발생하므로 기본적으로 Basic Auth와 작업 제한을 켜는 구성을 권장합니다.

```text
UPKINSEY_REQUIRE_BASIC_AUTH=1
UPKINSEY_BASIC_AUTH_USER=<operator>
UPKINSEY_BASIC_AUTH_PASSWORD=<strong password>
UPKINSEY_MAX_ACTIVE_JOBS=2
UPKINSEY_RATE_LIMIT_PER_MINUTE=30
UPKINSEY_ALLOW_DESTRUCTIVE_API=0
```

저장된 run artifact는 기본적으로 `data/simulation_runs/`의 로컬 JSON 파일입니다. Render/Railway 같은 ephemeral filesystem에서는 재배포나 재시작 시 사라질 수 있으므로, self-hosting 운영에서는 persistent disk를 붙이거나 외부 DB/object store로 교체하세요. 자세한 운영 체크리스트는 [`PUBLIC_DEPLOYMENT.md`](PUBLIC_DEPLOYMENT.md)를 참고하세요.

Nemotron persona를 랜덤 샘플링해 이름까지 파싱한 compact JSONL로 저장하려면:

```bash
pip install -e '.[persona]'
python scripts/sample_nemotron_personas.py \
  --seed 42 \
  --n 10 \
  --output data/personas/sample.jsonl
```

샘플링한 Nemotron persona panel로 더미 제품 suite를 실행하려면:

```bash
python scripts/run_dummy_market_suite.py \
  --personas data/personas/sample.jsonl \
  --persona-limit 50 \
  --repeats 2
```

`--persona-limit` 기본값은 50이며, 실수로 과도한 Solar Pro 3 요청을 보내지 않도록 suite는 시뮬레이션당 200명 초과 panel을 거부합니다. 반복 실행 review는 제품별 adoption 범위, decision count, `stable`/`directional`/`volatile` stability label을 함께 저장해 Solar 결과가 재현 가능한 신호인지 빠르게 확인합니다.
제품 brief에 `current_alternatives`를 넣으면 현재 대체 행동/경쟁 대안을 시뮬레이션 prompt와 brief_quality preflight에 포함해 switching trigger를 더 명확히 평가합니다.

제품 brief에 선택적으로 `persona_filters`를 넣으면 로드된 panel을 제품별 target segment에 맞게 결정적으로 랭킹하고 `panel_limit`까지 줄입니다. 지원 필드: `occupations`, `provinces`, `keywords`, `exclude_keywords`, `age_min`, `age_max`, `panel_limit`.
웹 UI처럼 `target_market`만 입력한 경우에도 카페·음식점·소상공인·직장인·병원·시니어 등 보수적인 키워드/연령 힌트를 로컬 규칙으로 추론해 panel을 먼저 target-aware하게 정렬합니다. 명시적으로 넘긴 `persona_filters`가 있으면 항상 그 값을 우선합니다.

시뮬레이션 결과에는 `brief_quality`가 포함됩니다. 이 preflight는 제품 설명, 기능, 가격, 타깃, 가설, 현재 대체 행동을 로컬 규칙으로 점검해 `score`, `missing_fields`, `recommended_questions`를 반환합니다. API 호출을 막지는 않지만, 다음 Solar Pro 3 실행이나 실제 인터뷰 전에 브리프를 더 뾰족하게 만드는 용도입니다.

또한 결과의 `report.validation_plan`은 synthetic 결과를 실제 검증 루프로 연결하기 위해 추천 모집 대상, screener 질문, 인터뷰 질문, 성공 기준을 함께 제공합니다.
`report.experiment_backlog`는 핵심 가치 smoke test, objection A/B test, 현재 대체 행동 인터뷰를 우선순위·가설·통과 기준과 함께 제안해 바로 실행 가능한 learning sprint로 이어줍니다.
`report.research_sprint`는 decision board, validation plan, experiment backlog, assumption stress test를 5일 실행계획으로 묶어 오늘 무엇을 모집·제작·측정해야 하는지 바로 보여줍니다.
`report.message_angle_tests`는 persona driver, objection, switching trigger를 landing headline/subcopy/evidence/pass signal로 바꿔 실제 메시지 A/B test에 바로 붙일 수 있게 합니다.
`report.switching_analysis`는 현재 대체 행동이 유지되는 이유, 전환 트리거, 실제 인터뷰/랜딩 테스트에서 확인할 비교 검증안을 제공합니다.
`report.competitive_benchmark`는 현재 대체 행동/경쟁 대안을 행 단위로 쪼개 왜 사용자가 머무르는지, 제품이 증명해야 할 이점, 남은 장벽, 나란히 비교할 인터뷰 probe를 제공합니다.
`report.pricing_sensitivity`는 brief의 가격 옵션을 파싱해 friction-adjusted adoption, price-sensitive persona, 추천 가격 probe, 실제 결제 의향 검증 질문을 제공합니다.
`evidence_quality` / `report.evidence_quality`는 persona 수, target filter 적용 여부, brief 품질, persona 간 adoption 분산을 바탕으로 이번 synthetic 결과를 `exploratory`, `directional`, `decision_support` 중 어디로 봐야 하는지 표시합니다.
`request_budget` / `report.request_budget`은 이번 run의 Solar persona call 수, local aggregation call 수(0), 병렬 batch 수, 요청 sample_size 대비 실제 panel 수 차이를 표시해 비용/속도/과신 리스크를 확인하게 합니다.
`panel_profile` / `report.panel_profile`은 selected panel의 source/selected 수, target filter match, 주요 지역·직업·연령 bucket, coverage warning을 표시해 제품 점수를 해석하기 전에 panel이 타깃을 제대로 대표하는지 확인하게 합니다.
Prototype의 `Simulation Versions` 목록은 각 저장 run의 evidence quality, 실제 Solar persona call 수, planned batch, panel selection/match warning을 함께 표시해 반복 실행 간 신뢰도와 비용 리스크를 빠르게 비교합니다.
`persona_evidence_pack` / `report.persona_evidence_pack`은 supporter, barrier, follow-up persona signal card를 골라 평균 점수 뒤의 근거와 다음 인터뷰 probe를 보여줍니다. 이 카드는 실제 고객 인용문이 아니라 synthetic signal임을 명시합니다.
`report.intent_cohort_contrast`는 high/conditional/low-intent cohort의 평균 adoption, 반복 driver, 반복 objection, 검증 초점을 비교해 평균 점수 뒤에 숨은 세그먼트 차이를 보여줍니다.
`report.focus_group_simulation_plan`은 supporter/conditional/skeptic persona mix, 20-25분 discussion protocol, action-label 규칙, capture template을 제공해 실제 포커스그룹 전에 토론 쟁점을 안전하게 좁힙니다.
`report.assumption_stress_test`는 합성 결과에서 가장 취약한 제품 가정과 synthetic signal, 빠른 falsification test, pass signal을 함께 제안해 실제 검증 전에 위험한 가정을 먼저 깨볼 수 있게 합니다.
`report.next_run_brief_variants`는 상위 objection 해소안, beachhead segment 집중안, 현재 대안 대비 switching trigger안을 copy-paste 가능한 다음 시뮬레이션 brief로 제안합니다.
`report.recruiting_screener`는 synthetic signal을 실제 인터뷰 모집에 바로 쓰도록 must-have criteria, disqualifier, screener question, quota cell, cohort routing rule로 변환합니다.
`report.interview_discussion_guide`는 모집된 응답자와 바로 대화할 수 있도록 moderator intro, concept read, warm-up, concept reaction task, objection/pricing probe, note-taking rubric, success signal을 묶은 25-30분 인터뷰 가이드입니다.
`report.validation_survey`는 interview 이전/이후에 빠르게 정량 확인할 수 있도록 qualification, randomized concept card, need-fit, next action, objection, pricing 문항과 primary metrics/pass signals를 묶은 5-7분 설문 초안입니다.
`report.field_validation_tracker`는 synthetic adoption/need-fit/objection baseline을 실제 field survey/interview sheet 컬럼, 비교 metric, calibration rule로 바꿔 실제 응답이 들어온 뒤 decision을 보정하게 합니다.
`report.decision_sensitivity`는 adoption/need-fit 평균에 small-panel/dispersion 기반 보수적 band를 붙여 Go/Hold 임계값을 넘나드는 borderline run인지 표시합니다. 이 band는 통계적 신뢰구간이 아니라 synthetic 결과 과신을 줄이기 위한 guardrail입니다.
`report.founder_memo`는 adoption/need-fit, decision board, evidence caveat, kill-risk, next 48h action을 한 페이지 의사결정 메모로 압축해 회의·이슈·문서에 바로 붙여 넣을 수 있게 합니다.
API 응답의 `report_markdown`과 `report.markdown`에는 같은 내용을 휴대 가능한 Markdown 리포트로 렌더링한 결과가 들어가며, prototype UI에서는 `Markdown 복사` 버튼으로 바로 복사할 수 있습니다.
각 `/api/simulate` 실행은 로컬 `data/simulation_runs/`에 immutable version JSON으로 저장되며, prototype UI의 `Simulation Versions`에서 과거 실행 결과를 다시 불러와 점수·페르소나·리포트를 비교 확인할 수 있습니다. 저장된 run artifact는 로컬 실험 기록이므로 git에는 포함하지 않습니다.
저장된 version을 선택하면 서버의 `/api/runs/compare/{version_id}`가 이전 동일 제품/리서치 타입 실행을 자동 baseline으로 잡아 adoption/need-fit delta, price risk 변화, decision label 변화를 함께 보여줍니다.

자세한 설계는 [`docs/design.md`](docs/design.md)를 참고하세요.

## Persona Dataset

이 프로젝트의 persona sampling은 우선 [`nvidia/Nemotron-Personas-Korea`](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea)를 기준으로 설계합니다.

- Service concept: [`docs/service-concept.md`](docs/service-concept.md)
- Service idea elements: [`docs/service-idea-elements.md`](docs/service-idea-elements.md)
- Product/interface spec: [`docs/product-interface-spec.md`](docs/product-interface-spec.md)
- Dummy product examples: [`examples/dummy_products.json`](examples/dummy_products.json)
- Dummy simulation review: [`docs/dummy-product-simulation-review.md`](docs/dummy-product-simulation-review.md)
- Static prototype: [`prototype/index.html`](prototype/index.html)
- Visual style reference: [`Design.md`](Design.md)
- Overview figure: [`assets/upkinsey-service-overview.png`](assets/upkinsey-service-overview.png)
- Interface preview: [`assets/upkinsey-interface-preview.png`](assets/upkinsey-interface-preview.png)
- Dataset guide: [`docs/nemotron-personas-korea.md`](docs/nemotron-personas-korea.md)
- Prompting guide: [`docs/persona-prompting.md`](docs/persona-prompting.md)

Attribution:

```text
Persona data is based on nvidia/Nemotron-Personas-Korea, licensed under CC-BY-4.0.
Dataset: https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea
```
