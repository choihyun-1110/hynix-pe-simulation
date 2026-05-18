# Upstage API Simulation — Design Draft

## 1. 문제 정의

Upstage API를 단순 질의응답이 아니라 **시뮬레이션 구성요소**로 사용한다. 핵심은 “모델 호출”이 아니라, 시나리오 상태가 시간에 따라 변하고 그 변화가 기록·재현·평가되는 구조다.

## 2. 설계 원칙

1. **Scenario-first**: 코드는 시나리오 정의를 실행하는 엔진이어야 한다.
2. **Reproducible**: 같은 입력/설정/모델이면 결과를 비교 가능하게 저장한다.
3. **Observable**: 모든 모델 호출, 상태 변화, 평가 결과를 로그로 남긴다.
4. **Pluggable**: Upstage API 외 다른 LLM/룰 기반 모듈도 나중에 교체 가능해야 한다.
5. **Secret-safe**: API 키는 `.env`에만 두고 GitHub에 올리지 않는다.

## 3. 핵심 개념

### Scenario

시뮬레이션의 문제/환경 정의.

예시 필드:

- `name`
- `description`
- `initial_state`
- `actors`
- `rules`
- `max_steps`
- `success_criteria`

### State

현재 세계 상태. JSON으로 저장 가능한 형태를 기본으로 한다.

### Actor

상태를 보고 액션을 선택하는 주체.

- LLM actor: Upstage API 호출
- Rule actor: deterministic rule
- Human actor: 수동 입력 또는 annotation

### Action

Actor가 선택한 변화 제안.

### Transition

Action을 받아 State를 갱신하는 로직.

### Evaluator

시뮬레이션 결과를 점수화하거나 성공/실패를 판정한다.

## 4. 제안 아키텍처

```text
Scenario YAML/JSON
      ↓
Simulation Runner
      ↓
+-----------------------+
| State Store           |
| Actor Orchestrator    |
| Upstage Client        |
| Transition Engine     |
| Evaluator             |
| Trace Logger          |
+-----------------------+
      ↓
Run Artifacts
```

## 5. 실행 흐름

1. scenario 파일 로드
2. initial state 생성
3. step loop 시작
4. actor별 observation 생성
5. Upstage API 또는 rule actor 호출
6. action validate
7. transition 적용
8. trace 저장
9. 종료 조건 확인
10. summary/evaluation 저장

## 6. 산출물 형식

각 run은 다음을 저장한다.

```text
runs/{run_id}/
  scenario.json
  config.json
  trace.jsonl
  final_state.json
  evaluation.json
  summary.md
```

## 7. API 사용 정책

- `UPSTAGE_API_KEY`는 `.env`에서만 읽는다.
- request/response 로그에는 키를 절대 저장하지 않는다.
- 모델명, temperature, max tokens 등은 config에 명시한다.
- 실패/timeout/retry를 trace에 기록한다.

## 8. 다음 결정 사항

- 시뮬레이션 도메인: 교육? 연구실 운영? 경제/사회? 게임? 멀티에이전트?
- 구현 언어: Python 우선 추천
- 시나리오 포맷: YAML vs JSON
- UI 필요 여부: CLI only / Web dashboard
- 평가 방식: 자동 점수 / 사람이 검토 / 혼합

## 9. 추천 MVP

1. Python package scaffold
2. `examples/simple_scenario.yaml`
3. Upstage chat client wrapper
4. deterministic transition engine
5. `trace.jsonl` 저장
6. CLI: `python -m sim run examples/simple_scenario.yaml`
