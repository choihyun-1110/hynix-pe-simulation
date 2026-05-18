# Nemotron-Personas-Korea 기반 시뮬레이션 설계

대상 데이터셋: [`nvidia/Nemotron-Personas-Korea`](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea)

이 문서는 Upstage API 시뮬레이션에서 `nvidia/Nemotron-Personas-Korea` 데이터를 랜덤 샘플링해 actor persona로 사용하는 방식을 정리한다.

## 1. 데이터셋을 어떻게 볼 것인가

이 데이터셋은 한국어 기반의 synthetic persona dataset이다. 각 row를 하나의 시뮬레이션 actor 후보로 볼 수 있다.

Hugging Face 기준 주요 특징:

- split: `train`
- 규모: 약 1M rows
- 언어: Korean
- 포맷: parquet
- 라이선스: CC-BY-4.0
- 주요 컬럼:
  - `uuid`
  - `persona`
  - `professional_persona`
  - `sports_persona`
  - `arts_persona`
  - `travel_persona`
  - `culinary_persona`
  - `family_persona`
  - `cultural_background`
  - `skills_and_expertise`
  - `skills_and_expertise_list`
  - `hobbies_and_interests`
  - `hobbies_and_interests_list`
  - `career_goals_and_ambitions`
  - `sex`, `age`, `marital_status`, `family_type`
  - `housing_type`, `education_level`, `bachelors_field`
  - `occupation`, `district`, `province`, `country`

## 2. 기본 사용 방향

각 row를 그대로 프롬프트에 길게 넣기보다, 먼저 simulation actor schema로 압축해서 쓰는 것을 추천한다.

권장 흐름:

```text
Nemotron row
  ↓
Persona adapter
  ↓
Simulation actor persona JSON
  ↓
Actor decision prompt
  ↓
JSON action output
```

핵심은 row의 모든 내용을 매번 넣는 것이 아니라, 현재 시뮬레이션에 필요한 정보만 선택하는 것이다.

## 3. Row → Actor Persona 매핑

권장 매핑:

```json
{
  "id": "uuid",
  "name": "parsed_name",
  "name_parse": {
    "name": "parsed_name",
    "confidence": 1.0,
    "candidates": [],
    "evidence": {}
  },
  "summary": "persona",
  "demographics": {
    "sex": "sex",
    "age": "age",
    "marital_status": "marital_status",
    "family_type": "family_type",
    "housing_type": "housing_type",
    "education_level": "education_level",
    "occupation": "occupation",
    "district": "district",
    "province": "province",
    "country": "country"
  },
  "life_domains": {
    "professional": "professional_persona",
    "family": "family_persona",
    "culture": "cultural_background",
    "sports": "sports_persona",
    "arts": "arts_persona",
    "travel": "travel_persona",
    "culinary": "culinary_persona"
  },
  "capabilities": {
    "skills_text": "skills_and_expertise",
    "skills_list": "skills_and_expertise_list"
  },
  "interests": {
    "hobbies_text": "hobbies_and_interests",
    "hobbies_list": "hobbies_and_interests_list"
  },
  "goals": "career_goals_and_ambitions"
}
```

## 4. 프롬프트 원칙

Nemotron persona는 풍부한 서술형 정보가 많기 때문에, 그대로 넣으면 모델이 “인물 소개문”을 반복하거나 지나치게 연기할 수 있다.

그래서 프롬프트에 반드시 다음 원칙을 넣는다.

> Use the Nemotron persona row as a behavioral prior, not as text to summarize or imitate.

즉:

- 페르소나 내용을 그대로 복붙해서 말하지 않는다.
- demographic field로 편견적 결론을 만들지 않는다.
- 직업/가족/취미/목표는 의사결정의 근거로만 사용한다.
- 현재 state와 available action이 persona보다 우선한다.
- action은 반드시 action schema 안에서 선택한다.

## 5. Nemotron 전용 Actor Decision Prompt

```text
You are an actor inside a Korean simulation environment.

You are given one sampled row from the Nemotron-Personas-Korea dataset.
Treat this row as your behavioral prior.
Do not summarize the persona. Do not quote the persona unless necessary.
Use it to infer realistic preferences, constraints, communication style, and likely decisions.

Important rules:
- The current simulation state is more important than generic persona flavor.
- Do not overfit to demographic attributes such as age, sex, region, or education.
- Avoid stereotypes. Use concrete fields such as occupation, skills, goals, family context, and hobbies when relevant.
- Stay within the available actions.
- If persona and situation conflict, choose the most plausible action and briefly state the tension.
- Output JSON only.

[NEMOTRON_PERSONA_ROW]
{{persona_row_compact_json}}

[SIMULATION ROLE]
{{simulation_role}}

[CURRENT STATE]
{{current_state}}

[RECENT EVENTS]
{{recent_events}}

[AVAILABLE ACTIONS]
{{available_actions}}

[STEP GOAL]
{{step_goal}}

Return JSON with this schema:
{
  "observation": "What this actor notices in the current state.",
  "persona_influence": {
    "used_fields": ["persona", "occupation", "skills_and_expertise", "career_goals_and_ambitions"],
    "summary": "Short explanation of how the persona affected the decision. Do not expose long reasoning."
  },
  "chosen_action": {
    "type": "one of the available action types",
    "target": "target actor/object if applicable",
    "content": "message or action details"
  },
  "confidence": 0.0,
  "expected_consequence": "What the actor expects to happen next."
}
```

## 6. Compact JSON 예시

프롬프트에는 원본 row 전체보다 compact version을 넣는 것이 좋다.

```json
{
  "uuid": "03b4f36a18e6469386d0286dddd513c8",
  "name": "전기태",
  "name_parse": {
    "name": "전기태",
    "confidence": 1.0,
    "candidates": [{"name": "전기태", "score": 18}],
    "evidence": {
      "전기태": [
        {"field": "professional_persona", "source": "honorific"},
        {"field": "family_persona", "source": "honorific"},
        {"field": "persona", "source": "honorific"}
      ]
    }
  },
  "persona": "광주 서구에서 평생 하역 일을 하며 살아온 70대 가장으로, 성실하고 사교적인 인물",
  "occupation": "하역 및 적재 관련 단순 종사원",
  "age": 74,
  "sex": "남자",
  "province": "광주",
  "district": "광주-서구",
  "family_type": "배우자와 거주",
  "education_level": "초등학교",
  "professional_persona": "하역 현장에서 무게 중심을 빠르게 파악하고 효율적으로 짐을 쌓는 베테랑",
  "family_persona": "무뚝뚝하지만 행동으로 가족을 챙기는 편",
  "cultural_background": "격식보다 의리와 눈치 빠른 태도를 중요하게 여김",
  "skills_and_expertise_list": [
    "적재물 무게 중심 파악 및 효율적 배치",
    "현장 자재 결속 및 고정 기술",
    "하역 작업 동선 최적화"
  ],
  "hobbies_and_interests_list": [
    "무등산 둘레길 산책",
    "전통시장 맛집 탐방",
    "트로트 프로그램 시청"
  ],
  "career_goals_and_ambitions": "무리하지 않는 선에서 일을 계속하며 배우자와 소박하게 생활하기"
}
```

## 7. 이름 파싱 및 데이터 저장

Nemotron row에는 별도 `name` 컬럼이 없지만, 대부분의 서술형 persona 필드에 `전기태 씨는 ...`처럼 이름이 들어 있다. 따라서 adapter 단계에서 이름을 파싱해 compact persona에 저장한다.

구현 위치:

```text
src/upstage_api_sim/personas/nemotron.py
```

파싱 전략:

1. `professional_persona`, `family_persona`, `persona` 등 서술형 필드에서 `이름 + 씨/님/선생님/군/양` 패턴을 우선 탐지한다.
2. honorific 패턴이 없으면 `persona`, `cultural_background` 같은 summary field에서 문장 첫머리의 `이름은/이름는/이름이/이름가` 패턴을 약한 fallback으로 사용한다.
3. 여러 후보가 나오면 등장 횟수와 source reliability로 score를 매긴다.
4. compact persona에는 `name`과 `name_parse` diagnostics를 함께 저장한다.

예시 출력:

```json
{
  "uuid": "03b4f36a18e6469386d0286dddd513c8",
  "name": "전기태",
  "name_parse": {
    "name": "전기태",
    "confidence": 1.0,
    "candidates": [{"name": "전기태", "score": 9}],
    "evidence": {
      "전기태": [
        {"field": "professional_persona", "source": "honorific"},
        {"field": "family_persona", "source": "honorific"},
        {"field": "persona", "source": "honorific"}
      ]
    }
  }
}
```

이렇게 하면 나중에 UI나 trace에서 actor를 `actor_001` 대신 `전기태`처럼 표시할 수 있고, 파싱 신뢰도가 낮은 경우에는 `uuid` fallback을 사용할 수 있다.

## 8. 랜덤 샘플링 전략

### 단순 랜덤 샘플링

MVP에서는 dataset에서 `N`명을 랜덤으로 뽑아 actor로 사용한다.

```python
from datasets import load_dataset

DATASET_ID = "nvidia/Nemotron-Personas-Korea"

# streaming=True를 쓰면 1M rows 전체를 로컬에 다 받지 않고 샘플링 가능
stream = load_dataset(DATASET_ID, split="train", streaming=True)

sampled = list(
    stream.shuffle(seed=42, buffer_size=10_000).take(10)
)
```

이 repo에서는 샘플링 결과를 바로 compact JSONL로 저장하는 스크립트를 둔다.

```bash
pip install -e '.[persona]'
python scripts/sample_nemotron_personas.py \
  --seed 42 \
  --n 10 \
  --output data/personas/sample.jsonl
```

출력 파일:

```text
data/personas/sample.jsonl
data/personas/sample.jsonl.manifest.json
```

`sample.jsonl`의 각 줄에는 `name`, `name_parse`, `uuid`, `persona`, `demographics`, `life_domains`, `capabilities`, `interests`, `goals`가 저장된다.

### 재현 가능한 샘플링

실험 재현성을 위해 run마다 다음을 저장한다.

```json
{
  "dataset_id": "nvidia/Nemotron-Personas-Korea",
  "split": "train",
  "sampling_seed": 42,
  "sample_size": 10,
  "sampled_uuids": ["..."],
  "sampling_method": "streaming_shuffle_take",
  "buffer_size": 10000
}
```

### 균형 샘플링

실험 목적에 따라 단순 랜덤보다 stratified sampling이 나을 수 있다.

추천 stratify 후보:

- `province`
- `age` bucket
- `sex`
- `occupation`
- `education_level`

단, 너무 많은 축을 동시에 맞추면 구현이 복잡해지므로 MVP에서는 다음 정도가 적절하다.

```text
province × age_bucket
```

## 9. Simulation에서의 역할 부여

Nemotron row는 “그 사람의 일반 배경”이고, simulation role은 “이번 시뮬레이션에서 맡은 역할”이다. 둘을 분리해야 한다.

예시:

```json
{
  "persona_uuid": "...",
  "simulation_role": "local resident participating in a policy discussion",
  "task_goal": "choose whether to support or oppose a new community program"
}
```

같은 persona라도 role이 다르면 행동이 달라질 수 있다.

예:

- 지역 주민
- 민원인
- 고객
- 팀원
- 보호자
- 학생
- 정책 수혜자
- 평가자

## 10. 좋은 활용 예시

### 정책/서비스 반응 시뮬레이션

랜덤으로 뽑은 persona들에게 새로운 정책이나 서비스를 보여주고, 수용/거부/우려/질문을 생성한다.

좋은 이유:

- 지역, 직업, 가족 구조, 관심사가 반응 차이를 만든다.
- 한국어 생활 맥락이 풍부하게 반영된다.

### 멀티에이전트 토론

서로 다른 persona들이 같은 이슈를 두고 토론하게 한다.

주의점:

- 토론이 과장된 캐릭터극이 되지 않도록 action schema를 제한한다.
- 각 발화마다 persona field 중 무엇이 영향을 줬는지 trace에 저장한다.

### 고객/사용자 시뮬레이션

서비스 기획안, 앱 기능, 안내문 등을 persona별로 평가하게 한다.

출력 예:

```json
{
  "reaction": "positive | neutral | negative",
  "main_concern": "...",
  "question": "...",
  "adoption_likelihood": 0.0
}
```

## 11. 피해야 할 것

- 나이/성별/지역만 보고 행동을 결정하게 하기
- persona 원문을 그대로 말하게 하기
- 모든 컬럼을 매 step마다 무조건 넣기
- prompt에 action schema 없이 자유 발화만 요구하기
- 랜덤 샘플 seed와 sampled uuid를 저장하지 않기
- CC-BY-4.0 attribution 없이 결과물을 공개하기

## 12. MVP 구현 체크리스트

- [x] Hugging Face dataset loader 스크립트 추가
- [x] `sample_personas(seed, n)`에 해당하는 CLI 구현
- [x] row를 compact persona JSON으로 변환하는 adapter 구현
- [x] 이름 파싱 후 `name`, `name_parse`로 저장
- [x] sampled uuid와 seed를 manifest에 저장
- [ ] Nemotron 전용 actor prompt를 코드 템플릿으로 추가
- [ ] actor response JSON validation 추가
- [ ] trace에 `persona_uuid`, `name`, `used_fields`, `chosen_action` 저장
- [x] README에 dataset attribution 추가

## 13. Attribution

이 프로젝트에서 해당 dataset을 사용한다면 README 또는 결과 보고서에 다음처럼 명시한다.

```text
Persona data is based on nvidia/Nemotron-Personas-Korea, licensed under CC-BY-4.0.
Dataset: https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea
```
