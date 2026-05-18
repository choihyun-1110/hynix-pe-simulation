/* 결과(Signals) — 한눈에 보는 시장 반응 */
/* global React, RESONANCE_DATA */

const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

function useCount(target, duration = 1400) {
  const [v, setV] = useStateS(0);
  useEffectS(() => {
    let raf;
    const init = v;
    const startTs = performance.now();
    function tick(ts) {
      const t = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(init + (target - init) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [target]);
  return v;
}

function GaugeCard({ labelKo, labelEn, value, unit, sub, delta, prev, sparkData, deltaUnit = "p" }) {
  const isNum = typeof value === "number";
  const animated = useCount(isNum ? value : 0);
  const display = isNum ? animated : value;

  const trendCls = delta > 0 ? "" : delta < 0 ? " neg" : " neu";
  const trendIcon = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";

  const w = 280, h = 64;
  const max = Math.max(...sparkData);
  const min = Math.min(...sparkData);
  const span = max - min || 1;
  const path = sparkData.map((v, i) => {
    const x = (i / (sparkData.length - 1)) * w;
    const y = h - ((v - min) / span) * h * 0.7 - h * 0.2;
    return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");

  const [filled, setFilled] = useStateS(0);
  useEffectS(() => {
    setFilled(0);
    const t = setTimeout(() => setFilled(isNum ? value : 60), 120);
    return () => clearTimeout(t);
  }, [value, isNum]);

  return (
    <div className="gauge-card">
      <div className="gauge-label">
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-bright)", boxShadow: "0 0 8px var(--accent-bright)" }}></span>
        {labelKo}
        <span className="gauge-label-en">{labelEn}</span>
      </div>
      <div className="gauge-bigval">
        {display}{unit && <span className="unit">{unit}</span>}
      </div>
      <div className="gauge-sub">{sub}</div>
      <div className="gauge-ring">
        <div className="gauge-ring-fill"
             style={{ width: filled + "%", transition: "width 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)" }}></div>
      </div>

      {delta !== undefined && delta !== null && (
        <div className={"gauge-trend" + trendCls}>
          <span>{trendIcon}</span>
          <span>{delta > 0 ? "+" : ""}{delta}{isNum ? deltaUnit : ""}</span>
          <span style={{ opacity: 0.6, marginLeft: 4 }}>지난 실행 {prev}</span>
        </div>
      )}

      <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={"sg" + labelEn} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-bright)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent-bright)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={path + ` L${w},${h} L0,${h} Z`} fill={"url(#sg" + labelEn + ")"} />
        <path d={path} stroke="var(--accent-bright)" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

function SignalsScreen({ goNext, goBack, data = null, versions = null, result = null }) {
  const D = data || RESONANCE_DATA.signals;
  const V = versions || RESONANCE_DATA.versions;
  const report = result?.report || {};
  const decision = report.decision_board?.recommendation || report.decision_board?.decision || D.decision?.current || "다음 검증 필요";
  const executiveSummary = report.executive_summary || `${D.calls?.done || 0}명 synthetic panel 기준 adoption ${D.adoption.value}%, need-fit ${D.needFit.value}%입니다.`;

  const [animKey, setAnimKey] = useStateS(0);
  useEffectS(() => { setAnimKey(k => k + 1); }, []);

  return (
    <div className="page" data-screen-label="03 Signals">
      <div className="page-head">
        <div className="page-eyebrow">3단계 · 결과 확인</div>
        <h1 className="page-title">시장은<br /><em>제품을 어떻게 받았나요?</em></h1>
        <p className="page-sub">{D.calls?.done || 0}명의 반응을 점수, 분위기, 근거 신뢰도로 정리했어요. 권장 액션은 {decision}입니다.</p>
      </div>

      <div className="action-card">
        <div className="action-eyebrow">한 줄 결론</div>
        <div className="action-headline">
          긍정 반응 {D.distribution.positive}, 회의적인 반응 {D.distribution.negative}. <span className="hi">{D.distribution.negative >= D.distribution.positive ? '컨셉이 자기 자신을 충분히 설명하지 못하고 있어요.' : '초기 신호가 살아있습니다.'}</span>
        </div>
        <div className="action-body">
          {executiveSummary}
        </div>
        <div className="action-cta">
          <button className="btn btn-primary" onClick={goNext}>
            응답자 한 명씩 들어가보기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="btn">
            메시지 다시 짜기
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 28 }}>
        <div className="card-head">
          <span className="card-tag">3단계</span>
          <div>
            <div className="card-title">핵심 지표 3가지</div>
            <div className="card-sub">{D.calls?.done || 8}명의 응답을 100점 척도로 환산했어요. 점수가 절대값으로 정답은 아니지만, 이전 실행과 비교하면서 방향을 잡을 수 있어요.</div>
          </div>
        </div>
        <div className="card-body">

          <div className="signals-grid">
            <GaugeCard
              labelKo="채택 의향" labelEn="Adoption"
              value={D.adoption.value} unit="%"
              sub="실제로 살 가능성이 얼마나 되나"
              delta={D.adoption.delta} prev={D.adoption.prev + "%"}
              sparkData={[18, 22, 28, 25, 28, 33]} />
            <GaugeCard
              labelKo="문제 적합도" labelEn="Need fit"
              value={D.needFit.value} unit="%"
              sub="이 제품이 진짜 문제를 풀고 있나"
              delta={D.needFit.delta} prev={D.needFit.prev + "%"}
              sparkData={[20, 26, 30, 34, 34, 37]} />
            <GaugeCard
              labelKo="가격 부담" labelEn="Price risk"
              value={D.priceRisk.value}
              sub="가격 때문에 멈칫하는 정도"
              delta={null} prev={D.priceRisk.prev}
              sparkData={[3, 3, 2, 2, 2, 2]} />
          </div>

          <div className="dist-block" key={animKey}>
            <div className="dist-head">
              <div>
                <div className="dist-title">{D.calls?.done || 8}명이 어떻게 받아들였나요?</div>
                <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>각 응답자의 반응 강도를 100점 척도로 환산한 값입니다.</div>
              </div>
              <div className="dist-meta">총합 100</div>
            </div>
            <div className="dist-row">
              <div className="dist-label">
                <span className="dist-dot pos"></span>
                <div>
                  <div>마음에 들어 함</div>
                  <div className="dist-sub">{D.distribution.positive}명 · 적극 구매 의향</div>
                </div>
              </div>
              <div className="dist-bar"><div className="dist-bar-fill pos" style={{ "--w": D.distribution.positive + "%" }}></div></div>
              <div className="dist-val">{D.distribution.positive}</div>
            </div>
            <div className="dist-row">
              <div className="dist-label">
                <span className="dist-dot neu"></span>
                <div>
                  <div>지켜보는 중</div>
                  <div className="dist-sub">{D.distribution.neutral}명 · 정보 더 필요</div>
                </div>
              </div>
              <div className="dist-bar"><div className="dist-bar-fill neu" style={{ "--w": D.distribution.neutral + "%" }}></div></div>
              <div className="dist-val">{D.distribution.neutral}</div>
            </div>
            <div className="dist-row">
              <div className="dist-label">
                <span className="dist-dot neg"></span>
                <div>
                  <div>회의적</div>
                  <div className="dist-sub">{D.distribution.negative}명 · 이대로면 안 살 듯</div>
                </div>
              </div>
              <div className="dist-bar"><div className="dist-bar-fill neg" style={{ "--w": D.distribution.negative + "%" }}></div></div>
              <div className="dist-val">{D.distribution.negative}</div>
            </div>
          </div>

          <div style={{ height: 12 }}></div>

          <div className="row between" style={{ marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>이전 실행 기록</div>
              <div className="dim" style={{ fontSize: 13, marginTop: 4 }}>이번 결과는 ‘방금 저장됨'으로 표시돼 있어요. 누르면 그 실행의 상세 결과로 갈 수 있어요.</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13, border: "1px solid var(--border-strong)", borderRadius: 999 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6, verticalAlign: -2 }}>
                  <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                새로고침
              </button>
            </div>
          </div>

          <div className="timeline">
            {V.map(v => (
              <div key={v.id} className={"timeline-item" + (v.current ? " current" : "")}>
                <div className="version-card">
                  <div className="vc-head">
                    <div>
                      <div className="vc-name">{v.name}</div>
                      <div className="vc-time">{v.type} · {v.time}{v.current ? " · 방금 저장됨" : ""}</div>
                    </div>
                    <div className="vc-id" title="실행 ID">#{v.shortId}</div>
                  </div>
                  <div className="vc-tags">
                    <span className={"vc-tag" + (v.current ? " accent" : "")}>채택 의향 {v.adoption}%</span>
                    <span className={"vc-tag" + (v.current ? " accent" : "")}>문제 적합도 {v.need}%</span>
                    <span className="vc-tag">가격 부담 {v.price}</span>
                    <span className="vc-tag">→ {v.decision}</span>
                  </div>
                  <div className="vc-meta">
                    <span>근거 {v.evidence}</span>
                    <span>·</span>
                    <span>{v.calls}</span>
                    <span>·</span>
                    <span>패널 {v.panel}</span>
                    <span>·</span>
                    <span>검증 경고 {v.warnings}개</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.005em" }}>이번 실행의 해석 가드레일</div>
                <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>데모 비교값이 아니라 현재 backend 결과에서 계산된 품질 신호만 표시합니다.</div>
              </div>
              <div className="mono" style={{ fontSize: 13, color: "var(--accent-bright)" }}>근거 신뢰도 {D.evidenceQuality.value}점</div>
            </div>
            <div className="diff-grid">
              <div className="diff-cell">
                <div className="diff-label">실제 응답 수</div>
                <div className="diff-change">{D.calls?.done || 0} / {D.calls?.total || 0}</div>
                <div className="diff-delta same">{D.calls?.batches || "-"} batches</div>
              </div>
              <div className="diff-cell">
                <div className="diff-label">근거 신뢰도</div>
                <div className="diff-change">{D.evidenceQuality.value}점</div>
                <div className="diff-delta same">경고 {D.warnings || 0}개</div>
              </div>
              <div className="diff-cell">
                <div className="diff-label">추천 액션</div>
                <div className="diff-change">{decision}</div>
                <div className="diff-delta same">field 검증 전제</div>
              </div>
              <div className="diff-cell">
                <div className="diff-label">부분 실패</div>
                <div className="diff-change">{result?.request_budget?.failed_persona_calls || 0}건</div>
                <div className="diff-delta same">성공 응답 기준 집계</div>
              </div>
            </div>
          </div>

          <div className="row between" style={{ marginTop: 36 }}>
            <button className="btn" onClick={goBack}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              실행 단계로
            </button>
            <button className="btn btn-primary" onClick={goNext}>
              4단계: 응답자 한 명씩 들여다보기
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

window.SignalsScreen = SignalsScreen;
