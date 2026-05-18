# Persona Data Prompting Guide

이 문서는 Upstage API 기반 시뮬레이션에서 **페르소나 데이터(persona data)**를 어떻게 프롬프트에 넣고, actor의 행동 결정에 활용할지 정리한 초안이다.

## 1. 핵심 아이디어

페르소나 데이터는 단순한 캐릭터 설정이 아니라, 시뮬레이션 actor가 결정을 내릴 때 사용하는 **행동 prior**로 다루는 것이 좋다.

즉, 모델에게 “이 사람처럼 연기해라”라고 시키기보다 다음을 정해야 한다.

- 무엇을 중요하게 여기는가
- 어떤 상황을 위협/기회로 해석하는가
- 위험을 얼마나 감수하는가
- 협력/경쟁/회피 성향은 어떤가
- 말투와 행동 선택에 어떤 편향이 있는가

중요한 원칙은 다음 한 문장이다.

> Use persona data to bias decisions, not to perform exposition.

모델이 페르소나 정보를 줄줄 설명하거나 과장된 롤플레이를 하지 않도록, 페르소나는 **설명 대상**이 아니라 **결정에 영향을 주는 조건**으로 제공한다.

## 2. 권장 Persona Schema

초기에는 JSON으로 관리하는 것을 추천한다. 시뮬레이션 엔진에서 actor별로 이 데이터를 읽어 프롬프트에 주입하기 쉽고, 나중에 평가/분석도 편하다.

```json
{
  "id": "actor_a",
  "name": "Actor A",
  "role": "student / researcher / customer / agent / etc.",
  "background": "Brief background information relevant to the simulation.",
  "goals": [
    "Primary objective",
    "Secondary objective"
  ],
  "values": [
    "accuracy",
    "efficiency",
    "social harmony"
  ],
  "knowledge": [
    "What this actor knows at the start"
  ],
  "personality": {
    "risk_tolerance": "low | medium | high",
    "cooperativeness": "low | medium | high",
    "patience": "low | medium | high",
    "assertiveness": "low | medium | high",
    "curiosity": "low | medium | high"
  },
  "communication_style": "Concise, cautious, direct, emotional, formal, etc.",
  "constraints": [
    "Things this actor cannot or should not do"
  ],
  "hidden_preferences": [
    "Private preference that may influence decisions"
  ]
}
```

## 3. Actor Decision Prompt Template

아래 템플릿은 시뮬레이션 step마다 actor에게 action을 선택하게 할 때 사용한다.

```text
You are an actor inside a simulation.

Your job is not to roleplay dramatically, but to make realistic decisions based on:
1. your persona,
2. the current situation,
3. your goals,
4. available actions,
5. social/contextual constraints.

Use the persona as a behavioral prior:
- It should influence your preferences, tone, risk tolerance, priorities, and interpretation of events.
- Do not repeat persona facts unless they matter to the decision.
- Do not act randomly just to show personality.
- If the situation conflicts with the persona, explain the tension briefly and choose the most plausible action.
- Stay within the available action space.

[PERSONA]
{{persona_data}}

[CURRENT STATE]
{{current_state}}

[RECENT EVENTS]
{{recent_events}}

[AVAILABLE ACTIONS]
{{available_actions}}

[GOAL]
{{actor_goal}}

Return your answer as JSON only.

Schema:
{
  "observation": "What the actor notices in the current state",
  "internal_reasoning_summary": "Short summary of the actor's motivation, without long chain-of-thought",
  "persona_influence": {
    "relevant_traits": ["trait1", "trait2"],
    "how_they_affect_decision": "Brief explanation"
  },
  "chosen_action": {
    "type": "one of the available action types",
    "target": "target if applicable",
    "content": "message or action details"
  },
  "confidence": 0.0,
  "expected_consequence": "What the actor expects will happen next"
}
```

## 4. 왜 JSON 출력이 좋은가

시뮬레이션에서는 모델 답변을 사람이 읽는 것보다, 엔진이 안정적으로 파싱하고 다음 상태로 넘기는 것이 중요하다.

JSON 출력의 장점:

- action validation 가능
- trace 저장이 쉬움
- actor별 decision pattern 분석 가능
- evaluator가 persona influence와 action을 비교 가능
- 나중에 replay/debug가 쉬움

## 5. 좋은 페르소나 사용 방식

### 좋은 방식

```text
This actor is risk-averse and values group harmony.
Given a conflict, they are likely to propose a compromise before escalating.
```

이런 정보는 실제 action 선택에 영향을 준다.

### 피해야 할 방식

```text
This actor is a very emotional person with a dramatic past.
Always speak in a poetic and intense way.
```

이런 정보는 시뮬레이션 행동보다 롤플레이 스타일을 과하게 만든다.

## 6. 페르소나와 상태 정보의 분리

페르소나에는 **상대적으로 안정적인 성향**을 넣고, 현재 감정/피로/자원/위치는 state에 넣는 것이 좋다.

예시:

- Persona: 위험 회피 성향이 높다.
- State: 현재 예산이 부족하고 deadline이 2일 남았다.
- Decision: 새로운 시도보다 검증된 방법을 선택할 가능성이 높다.

이렇게 분리하면 같은 사람도 상황에 따라 다르게 행동할 수 있다.

## 7. Trace에 남길 항목

각 step에서 최소한 다음 항목을 저장한다.

```json
{
  "step": 3,
  "actor_id": "actor_a",
  "observation": "...",
  "chosen_action": {
    "type": "send_message",
    "target": "actor_b",
    "content": "..."
  },
  "persona_influence": {
    "relevant_traits": ["risk_tolerance", "cooperativeness"],
    "how_they_affect_decision": "..."
  },
  "confidence": 0.73,
  "expected_consequence": "...",
  "model": "upstage-model-name",
  "timestamp": "..."
}
```

단, API key나 민감 정보는 절대 trace에 저장하지 않는다.

## 8. 평가 아이디어

페르소나 기반 시뮬레이션이 잘 작동하는지 보려면 다음을 평가할 수 있다.

1. **Consistency**: 같은 persona가 유사 상황에서 일관된 선택을 하는가?
2. **Context sensitivity**: 같은 persona라도 state가 바뀌면 합리적으로 행동이 바뀌는가?
3. **Trait-action alignment**: 선택한 action이 persona trait와 설명 가능하게 연결되는가?
4. **Diversity**: 서로 다른 persona가 같은 상황에서 다른 전략을 선택하는가?
5. **Non-exposition**: actor가 페르소나 설명을 반복하지 않고 실제 행동을 선택하는가?

## 9. MVP 적용안

초기 구현에서는 다음 정도만 넣어도 충분하다.

1. `personas/*.json`에 actor별 persona 저장
2. scenario에서 actor가 사용할 persona id 지정
3. step마다 persona + state + recent events + available actions를 prompt에 주입
4. JSON response를 validate
5. `trace.jsonl`에 action과 persona influence 저장

추천 디렉토리 구조:

```text
personas/
  actor_a.json
  actor_b.json
examples/
  simple_scenario.yaml
runs/
  {run_id}/
    trace.jsonl
```

## 10. 다음 단계

- 실제 시뮬레이션 도메인 결정
- persona schema를 도메인에 맞게 축소/확장
- action schema 정의
- Upstage API wrapper 구현
- simple two-actor scenario로 end-to-end 테스트
