# Backend Changes

## 변경 목적

백엔드에 이미 핵심 기능이 많이 구현되어 있어서 새 도메인 기능을 늘리기보다, 시연/협업 중 문제가 생기기 쉬운 운영 안정성 부분만 좁게 개선했다.

## 건드린 파일

- `scripts/run_upkinsey_server.py`
- `tests/test_upkinsey_server_safety.py`
- `Dockerfile`
- `.dockerignore`
- `render.yaml`
- `PUBLIC_DEPLOYMENT.md`
- `.env.example`

## 변경 내용

1. 요청 바디 검증 추가
   - `Content-Length` 누락, 빈 요청, 잘못된 JSON, JSON object가 아닌 요청을 `400`으로 응답하게 했다.
   - 기본 요청 크기 제한을 `1MB`로 두고, `UPKINSEY_MAX_BODY_BYTES` 환경변수로 조절할 수 있게 했다.

2. 에러 응답 분리
   - 기존에는 POST 처리 중 생긴 예외가 거의 전부 `500 simulation_failed`로 내려갔다.
   - 이제 잘못된 클라이언트 입력은 `400`, Upstage/API/런타임 계열 실패는 `502`, 예상 밖 서버 오류는 `500`으로 나뉜다.

3. 시뮬레이션 job 메모리 정리
   - `SIMULATION_JOBS`에 완료/실패 job이 계속 쌓이지 않도록 TTL cleanup을 추가했다.
   - 기본 TTL은 1시간이고, `UPKINSEY_JOB_TTL_SECONDS` 환경변수로 조절할 수 있다.

4. persona cache 파일 쓰기 안정화
   - 같은 seed/sample size 요청이 동시에 들어올 때 cache JSONL 파일을 동시에 쓰는 상황을 줄이기 위해 process-level lock을 추가했다.
   - cache 파일은 임시 파일에 먼저 쓴 뒤 atomic replace로 최종 경로에 반영하게 했다.

5. 응답 캐시 방지
   - API JSON 응답에 `Cache-Control: no-store` 헤더를 붙였다.

6. 서버 안전성 단위 테스트 추가
   - JSON body parser가 정상 object를 읽는지, invalid JSON과 array body를 거부하는지 확인한다.
   - 완료/실패 job cleanup이 running job은 지우지 않는지 확인한다.

7. 공개 배포 준비
   - 서버가 `PORT`, `UPKINSEY_PORT`, `UPKINSEY_HOST` 환경변수를 읽도록 했다.
   - Dockerfile, Render Blueprint, 공개 배포 가이드를 추가했다.

## 의도적으로 안 한 것

- 새로운 리포트/시뮬레이션 기능 추가는 하지 않았다.
- 프론트엔드 UI는 건드리지 않았다.
- Upstage 호출 로직 자체와 market research aggregation 로직은 유지했다.

## 확인

다음 확인을 완료했다.

- `python3 -m compileall scripts/run_upkinsey_server.py tests/test_upkinsey_server_safety.py`
- `python3 -m unittest tests.test_upkinsey_server_safety -v`
- `python3 -m unittest discover -s tests -p 'test*.py' -v`
- `UPKINSEY_HOST=127.0.0.1 PORT=5202 python3 scripts/run_upkinsey_server.py`
- `curl -s -i http://127.0.0.1:5202/api/health`

전체 `unittest` 발견 실행 기준 67개 테스트가 통과했다.

Dockerfile은 추가했지만, 현재 로컬 Docker daemon이 떠 있지 않아 `docker build`는 실행 환경 문제로 확인하지 못했다.

---

## 2026-05-18 production hardening 추가

공개 self-hosting을 전제로 paid API abuse와 stale result 오해를 줄이는 P0/P1 보강을 추가했다.

- Basic Auth를 명시적으로 켤 수 있으며, 켰는데 credential이 없으면 paid endpoint를 열지 않고 `auth_not_configured`로 거부한다.
- `DELETE /api/runs*`는 `UPKINSEY_ALLOW_DESTRUCTIVE_API=1`일 때만 허용한다.
- `/api/simulate/start`에 process-wide active job limit(`UPKINSEY_MAX_ACTIVE_JOBS`, 기본 2)을 추가했다.
- mutating API에 client 단위 minute rate limit(`UPKINSEY_RATE_LIMIT_PER_MINUTE`, 기본 30)을 추가했다.
- PDF 업로드 기본 제한을 8MB로 낮추고 `%PDF-` magic check를 추가했다.
- 서버 에러 메시지에서 bearer/API key/password/token 패턴을 redact한다.
- persona API 일부 실패 시 전체 run을 즉시 실패시키지 않고 성공 응답으로 aggregate하며, `partial_failures`와 evidence warning을 결과에 남긴다. 전부 실패하면 명확히 실패한다.
- `.env.example`, `render.yaml`, `PUBLIC_DEPLOYMENT.md`, `README.md`에 auth/rate/job/document-parse/persistence 운영 설정을 문서화했다.

확인:

- `PYTHONPATH=src python3 -m unittest discover -s tests -p 'test*.py' -v` → 82개 통과
