<div align="center">

# Hynix PE Simulation

**Semiconductor PE(Product Engineering) 직무 관점의 AI stakeholder simulation**

반도체 제품 이슈, fail pattern, test condition, customer/application 조건을 입력하면  
Device, Design, Process, Test/Quality, Customer/Application 관점에서 원인 후보와 추가 검증 항목을 구조화합니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)
[![Upstage Solar](https://img.shields.io/badge/Powered%20by-Upstage%20Solar-6B5CFF)](https://console.upstage.ai/docs/capabilities/generate/chat)
![Status](https://img.shields.io/badge/status-prototype-black)

</div>

---

## 프로젝트 개요

이 프로젝트는 기존 AI persona simulation 구조를 **SK hynix PE 직무 관점의 cross-functional stakeholder simulation**으로 재해석한 개인 프로젝트입니다.

PE는 단순히 test만 수행하는 직무가 아니라, 제품을 중심으로 소자(Device), 설계(Design), 공정(Process), Test/Quality, 고객(Application/Customer) 관점을 연결하면서 제품의 weak point를 검증하고 불량 원인을 좁히는 역할이라고 이해했습니다.

그래서 이 서비스는 AI가 불량 원인을 확정하는 도구가 아니라, PE 엔지니어가 문제를 처음 구조화할 때 다음을 빠르게 점검하도록 돕는 **reasoning assistant**를 목표로 합니다.

- 가능한 원인 후보를 stakeholder별로 분해
- 추가로 확인해야 할 데이터 정리
- 우선 검증 action item 제안
- 관련 부서와 커뮤니케이션할 질문 정리
- 고객 application 조건을 내부 test condition과 연결

현재 프로토타입은 실제 사내 데이터를 학습하거나 연결한 root cause analysis tool이 아닙니다. LLM의 일반 반도체 지식과 stakeholder prompt를 바탕으로 검토 질문을 생성하는 **PE issue structuring assistant**에 가깝습니다.

## 한 줄 정의

**Semiconductor PE mode is a cross-functional stakeholder simulation tool that helps PE engineers structure product issues from device, design, process, test, and customer application perspectives before deeper validation and inter-team communication.**

## Simulation Stakeholders

| Stakeholder | 검토 관점 |
| --- | --- |
| Device | Cell leakage, retention margin, sensing margin, device-level weak point |
| Design | Sense amplifier timing, wordline/bitline timing, refresh policy, operating corner |
| Process | Wafer edge/center distribution, lot variation, CD/implant/oxide variation |
| Test / Quality / PE | Voltage-temperature-frequency condition, fail signature, shmoo, screening, reliability |
| Customer / Application | AI accelerator workload, high bandwidth access, high temperature operation, system-level condition |

## 입력 예시

```text
DRAM 제품에서 고온 조건과 낮은 voltage margin에서 read fail이 증가한다.
```

```text
특정 wafer edge die에서만 fail rate가 높고, final test에서 특정 frequency 이상일 때 fail이 증가한다.
```

```text
AI accelerator customer workload에서만 intermittent fail이 보고되었고, 내부 standard test에서는 재현되지 않는다.
```

## 출력 구조

각 stakeholder는 다음 형식으로 응답합니다.

- 관점 요약
- 가능한 원인 후보
- 확인해야 할 데이터
- 추가 test 또는 검증 제안
- 관련 부서와 커뮤니케이션할 질문

마지막에는 `PE Engineer Summary`를 생성합니다.

- 가장 가능성 높은 원인 후보 Top 3
- 추가로 확인해야 할 데이터
- 우선순위가 높은 검증 action item
- 관련 부서별 커뮤니케이션 포인트
- 고객 대응 관점에서 정리해야 할 메시지

모든 결과에는 다음 disclaimer를 전제로 둡니다.

```text
AI-generated hypothesis, not confirmed root cause.
```

## 현업 적용 시 확장 방향

현업형 솔루션은 LLM에게 바로 원인을 묻는 구조가 아니라, 데이터 분석과 검색 layer 뒤에 LLM을 붙이는 구조가 되어야 합니다.

```text
Raw test data
→ deterministic/statistical analysis
→ fail pattern extraction
→ 관련 문서/과거 case retrieval
→ LLM stakeholder simulation
→ PE engineer summary
```

예를 들어 DRAM shmoo test에서 특정 온도 이상 fail rate가 급증한다면, 먼저 데이터 분석 모듈이 다음과 같은 pattern을 추출해야 합니다.

- 특정 온도 이상에서 fail rate 급증
- 특정 frequency 이상에서 margin 감소
- wafer edge die에서 fail 집중
- 특정 lot에서만 재현

그 다음 LLM은 이 분석 결과를 바탕으로 Device, Design, Process, Test/Quality, Customer/Application 관점의 질문과 action item을 정리하는 역할을 맡습니다.

향후 연결 가능한 데이터 타입:

- Shmoo test CSV
- Wafer map
- Lot/process history
- Binning result
- Reliability stress result
- FA report
- Customer qualification condition

## 중요한 Guardrail

이 프로젝트는 다음을 하지 않습니다.

- 실제 NVIDIA, AMD 등 특정 기업의 내부 요구사항을 예측하지 않습니다.
- AI가 불량 원인을 확정한다고 표현하지 않습니다.
- PE 엔지니어의 판단을 대체한다고 표현하지 않습니다.
- 실제 shmoo data, wafer map, FA report, 공정 이력, 고객 qualification data를 조회한 것처럼 표현하지 않습니다.

대신 다음을 목표로 합니다.

- GPU/AI accelerator customer 같은 application category 기반 validation concern 시뮬레이션
- PE 엔지니어의 원인 후보 구조화 보조
- 부서 간 커뮤니케이션 전 놓칠 수 있는 검증 관점 점검
- 추가 검증 방향 제안
- 데이터 분석 결과를 stakeholder별 커뮤니케이션 질문으로 변환

## Tech Stack

- Frontend: React/Babel prototype served as static files
- Backend: Python `http.server` based local API server
- LLM: Upstage Solar chat completion API
- Storage: local JSON run history
- Tests: Python `unittest`

## Quick Start

### 1. Clone

```bash
git clone https://github.com/choihyun-1110/hynix-pe-simulation.git
cd hynix-pe-simulation
```

### 2. Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

### 3. Configure `.env`

```bash
cp .env.example .env
```

```env
UPSTAGE_API_KEY=your_upstage_api_key
UPKINSEY_REQUIRE_BASIC_AUTH=1
UPKINSEY_BASIC_AUTH_USER=operator
UPKINSEY_BASIC_AUTH_PASSWORD=change-this-password
```

### 4. Run

```bash
python scripts/run_upkinsey_server.py --port 5173
```

Open:

```text
http://127.0.0.1:5173/Resonance.html?pe=1
```

## Test

```bash
python -m unittest discover -s tests
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Server and API-key health check |
| `POST` | `/api/pe-simulate` | Run semiconductor PE stakeholder simulation |
| `GET` | `/api/runs` | List saved simulation runs |
| `GET` | `/api/runs/{version_id}` | Load a saved simulation run |

The original market-research endpoints may still exist in the codebase, but the current product experience is focused on the PE stakeholder simulation flow.

## Project Structure

```text
prototype/                 # React/Babel browser prototype
scripts/run_upkinsey_server.py
                           # Static server + API endpoints
src/upstage_api_sim/       # Simulation logic, Upstage client, run store
tests/                     # Unit tests
docs/                      # Earlier design notes and references
```

## Interview Framing

면접에서는 이 프로젝트를 다음처럼 설명할 수 있습니다.

> 기존 Resonance는 제품 아이디어를 여러 AI persona에게 보여주고 반응을 시뮬레이션하는 구조였습니다. 저는 이 구조를 PE 직무 관점으로 재해석해, 소비자 persona 대신 Device, Design, Process, Test/Quality, Customer/Application stakeholder persona가 특정 fail pattern을 각자의 관점에서 검토하도록 만들었습니다.

> 다만 현재 프로토타입은 실제 사내 데이터를 기반으로 root cause를 판정하는 도구는 아닙니다. LLM의 일반 반도체 지식과 stakeholder prompt를 바탕으로, 특정 fail pattern이 들어왔을 때 각 관점에서 어떤 가능성을 볼 수 있고 어떤 데이터를 추가 확인해야 하는지 정리하는 issue structuring assistant에 가깝습니다.

핵심 메시지:

> PE에서 AI는 정답을 대신 내리는 도구가 아니라, 소자·설계·공정·고객 관점에서 제품 이슈를 빠르게 구조화하고 놓친 검증 조건을 찾는 cross-functional reasoning assistant로 활용될 수 있다고 생각합니다.

## License

MIT
