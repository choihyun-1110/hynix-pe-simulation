/* 업킨지 앤 컴퍼니 — Drive zip UI wired to live backend */
/* global React, RESONANCE_DATA, useTweaks, TweaksPanel, TweakSection, TweakRadio */

const { useState, useEffect, useRef } = React;

const LAYERS = [
  { id: "brief",    num: "1", name: "입력",     sub: "제품 정보를 적어요" },
  { id: "run",      num: "2", name: "실행",     sub: "응답자에게 보여줘요" },
  { id: "signals",  num: "3", name: "결과",     sub: "시장 반응을 봐요" },
  { id: "personas", num: "4", name: "응답자",   sub: "한 명씩 들여다봐요" },
  { id: "analyst",  num: "5", name: "분석가",   sub: "질문을 다시 설계해요" },
  { id: "report",   num: "6", name: "리포트",   sub: "다음 액션을 정해요" }
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "personaMode": "constellation"
}/*EDITMODE-END*/;

const SESSION_KEY = "upkinsey.resonance.session.v2";
const SESSION_SCHEMA_VERSION = 3;
const RESULT_LAYERS = new Set(["signals", "personas", "analyst", "report"]);

function loadSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    return {};
  }
}

function saveSessionPatch(patch) {
  try {
    const current = loadSession();
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...patch, schemaVersion: SESSION_SCHEMA_VERSION, savedAt: new Date().toISOString() }));
  } catch (err) {
    // No-account persistence is best-effort; never block the simulation UI.
  }
}

function clearSession() {
  try { window.localStorage.removeItem(SESSION_KEY); } catch (err) {}
}

const RESEARCH_TYPE_BY_MODE = {
  concept: "Concept test",
  pricing: "Pricing test",
  message: "Message test",
  objection: "Objection mining",
  segment: "Segment discovery"
};

function asList(value) { return Array.isArray(value) ? value : (value ? [value] : []); }
function clamp(n, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, Number(n) || 0)); }
function shortId(value) { return String(value || "live").replace(/[^a-zA-Z0-9]/g, "").slice(-6) || "live"; }
function apiPath(path) {
  return new URL(path, window.location.origin).toString();
}
function priceKo(value) {
  const v = String(value || "보통").toLowerCase();
  if (v.includes("high") || v.includes("높")) return "높음";
  if (v.includes("low") || v.includes("낮")) return "낮음";
  return "보통";
}
function parseMeta(meta = "", idx = 0) {
  const age = Number((String(meta).match(/(\d{2})\s*세/) || [])[1]) || [58,55,42,66,39,52,63,47][idx % 8];
  const bits = String(meta).split(/[·,/]/).map(s => s.trim()).filter(Boolean);
  return { age, region: bits.find(b => !/세/.test(b)) || "대한민국", role: bits[bits.length - 1] || "소비자" };
}
function toBackendBrief(brief, config = {}) {
  return {
    product_name: brief.productName || "제품",
    description: brief.description || "",
    features: asList(brief.features),
    pricing: asList(brief.pricing),
    target_market: brief.target || "",
    current_alternatives: brief.alternatives || "",
    hypothesis: brief.hypothesis || "",
    research_type: RESEARCH_TYPE_BY_MODE[config.test] || config.research_type || "Concept test",
    sample_size: Number(config.sampleSize || 8),
    seed: Number(config.seed || 42)
  };
}
function fromBackendBrief(brief) {
  return {
    productName: brief.product_name || brief.productName || "제품",
    description: brief.description || "",
    features: asList(brief.features),
    pricing: asList(brief.pricing),
    target: brief.target_market || brief.target || "",
    alternatives: brief.current_alternatives || brief.alternatives || "",
    hypothesis: brief.hypothesis || ""
  };
}
function canonicalBriefForHash(brief) {
  return {
    productName: String(brief?.productName || ""),
    description: String(brief?.description || ""),
    features: asList(brief?.features).map(String),
    pricing: asList(brief?.pricing).map(String),
    target: String(brief?.target || ""),
    alternatives: String(brief?.alternatives || ""),
    hypothesis: String(brief?.hypothesis || ""),
  };
}
function briefFingerprint(brief) {
  const text = JSON.stringify(canonicalBriefForHash(brief));
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  return (hash >>> 0).toString(36);
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("aborted", "AbortError"));
      }, { once: true });
    }
  });
}
function mapPersona(raw = {}, idx = 0) {
  const meta = parseMeta(raw.meta, idx);
  const adoption = clamp(raw.adoption_likelihood ?? raw.adoption ?? 30);
  const need = clamp(raw.need_fit_score ?? raw.need ?? 30);
  const understanding = clamp(raw.understanding_score ?? raw.understanding ?? 30);
  const stance = adoption >= 50 ? "pos" : adoption >= 34 ? "neu" : "neg";
  return {
    id: `p${idx + 1}`,
    name: raw.name || `Persona ${idx + 1}`,
    age: meta.age,
    region: raw.region || meta.region,
    role: raw.role || meta.role,
    stance,
    stanceLabel: raw.stance || (stance === "pos" ? "긍정적으로 검토" : stance === "neu" ? "정보가 더 필요" : "회의적"),
    buyCondition: raw.buy_condition || raw.buyCondition || raw.next_validation_question || "추가 근거 확인 후 판단",
    adoption, need, understanding,
    price: priceKo(raw.price_resistance || raw.price),
    core: raw.concern || raw.core || raw.reply || "아직 핵심 반응이 없습니다.",
    drivers: asList(raw.positive_drivers || raw.drivers),
    risks: asList(raw.top_risks || raw.risks),
    nextQ: raw.next_validation_question || raw.nextQ || "어떤 근거가 있으면 다음 행동으로 넘어갈 수 있나요?",
    x: 12 + ((idx * 37) % 76),
    y: 18 + ((idx * 29) % 64),
    size: Math.max(42, Math.min(72, 42 + adoption * 0.42)),
    __raw: raw
  };
}
function mapResultToResonance(result, brief, versions = []) {
  const dist = result?.reaction_distribution || {};
  const personas = asList(result?.persona_reactions || result?.personas).map(mapPersona);
  const adoption = clamp(result?.adoption_score ?? 0);
  const need = clamp(result?.need_fit_score ?? 0);
  const evidence = result?.evidence_quality || result?.report?.evidence_quality || {};
  const requestBudget = result?.request_budget || result?.report?.request_budget || {};
  const version = result?.version || {};
  const currentVersion = {
    id: version.version_id || "live",
    shortId: shortId(version.version_id),
    name: brief.productName || version.product_name || "제품",
    type: version.research_type || result?.research_type || "Concept test",
    time: "방금 저장됨",
    adoption,
    need,
    price: priceKo(result?.price_risk),
    decision: result?.report?.decision_board?.recommendation || version.decision || "다듬기",
    evidence: `${evidence.score ?? version.evidence_quality_score ?? "-"}점`,
    calls: `${requestBudget.actual_persona_count ?? personas.length}명 / ${requestBudget.requested_sample_size ?? personas.length}명`,
    panel: result?.panel_profile?.selection_mode || "필터 없음",
    warnings: (evidence.warnings || []).length || version.evidence_warning_count || 0,
    current: true
  };
  const mappedVersions = versions.length ? versions : [currentVersion];
  return {
    brief,
    signals: {
      adoption: { value: adoption, delta: version.adoption_delta ?? 0, prev: Math.max(0, adoption - 5) },
      needFit: { value: need, delta: version.need_fit_delta ?? 0, prev: Math.max(0, need - 3) },
      priceRisk: { value: priceKo(result?.price_risk), changed: false, prev: "보통" },
      evidenceQuality: { value: evidence.score ?? 50, delta: 0 },
      distribution: { positive: Number(dist.positive ?? 0), neutral: Number(dist.neutral ?? 0), negative: Number(dist.negative ?? 0) },
      calls: { done: personas.length, total: personas.length, batches: requestBudget.planned_batches ?? "-" },
      warnings: (evidence.warnings || []).length,
      decision: { current: currentVersion.decision, prev: currentVersion.decision }
    },
    versions: mappedVersions,
    personas: personas.length ? personas : RESONANCE_DATA.personas,
    result
  };
}

function NoResultScreen({ goRun, message = "먼저 제품 정보를 입력하고 시뮬레이션을 실행해주세요." }) {
  return (
    <div className="page" data-screen-label="No Result">
      <div className="page-head">
        <div className="page-eyebrow">실행 결과 필요</div>
        <h1 className="page-title">아직 보여줄<br /><em>실제 시뮬레이션 결과가 없어요</em></h1>
        <p className="page-sub">{message} 데모 데이터와 실제 결과가 섞이지 않도록 이 화면은 실행 후에만 열립니다.</p>
      </div>
      <div className="action-card">
        <div className="action-eyebrow">다음 단계</div>
        <div className="action-headline">제품 brief를 확인한 뒤 Solar/Nemotron 패널을 실행하세요.</div>
        <div className="action-cta"><button className="btn btn-primary" onClick={goRun}>실행 단계로 이동</button></div>
      </div>
    </div>
  );
}

function Nav({ current, setCurrent, savedTime, apiState, onReset }) {
  return (
    <nav className="nav" data-screen-label="Nav">
      <div className="shell nav-inner">
        <a className="brand" href="index.html" title="업킨지 앤 컴퍼니 홈으로">
          <div className="brand-mark">
            <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" /><circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.2" opacity="0.6" /><circle cx="16" cy="16" r="2.2" fill="currentColor" /></svg>
          </div>
          <span>업킨지 앤 컴퍼니</span>
          <span className="brand-sub">출시 전 시장 반응 시뮬레이션</span>
        </a>
        <div className="nav-layers">
          {LAYERS.map((L, i) => {
            const curIdx = LAYERS.findIndex(l => l.id === current);
            const done = i < curIdx;
            return <button key={L.id} className={"layer-pill" + (L.id === current ? " active" : "") + (done ? " done" : "")} onClick={() => setCurrent(L.id)} title={L.sub}><span className="num">{L.num}</span><span>{L.name}</span></button>;
          })}
        </div>
        <div className="nav-right">
          <div className="live-pill" title={apiState.detail || "실시간 API 상태"}>
            <div className="live-dot"></div><span>{apiState.label || "Live API"}</span><span className="ver">· 세션 자동 저장</span>
          </div>
          <button className="reset-pill" onClick={onReset} title="현재 브라우저에 저장된 세션을 지우고 새로 시작">새 세션</button>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const restoredSession = React.useMemo(loadSession, []);
  const activeRunRef = useRef(null);
  const activeAbortRef = useRef(null);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [current, setCurrent] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get("start");
    if (start && LAYERS.find(l => l.id === start)) return start;
    if (restoredSession.current && LAYERS.find(l => l.id === restoredSession.current)) return restoredSession.current;
    return "brief";
  });
  const [brief, setBrief] = useState(() => restoredSession.brief || { ...RESONANCE_DATA.brief });
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(() => restoredSession.result || null);
  const [analystResult, setAnalystResult] = useState(() => restoredSession.analystResult || null);
  const [parseStatus, setParseStatus] = useState(null);
  const [apiState, setApiState] = useState({ label: "API 확인 중", detail: "Solar backend 상태 확인 중" });
  const [error, setError] = useState("");

  const currentBriefHash = briefFingerprint(brief);
  const resultStale = Boolean(result && result.__briefHash !== currentBriefHash);
  const liveResult = result && !resultStale ? result : null;
  const liveData = liveResult ? mapResultToResonance(liveResult, brief) : RESONANCE_DATA;
  const personas = liveData.personas || RESONANCE_DATA.personas;
  const goTo = (id) => {
    if (RESULT_LAYERS.has(id) && !liveResult) {
      setCurrent("run");
      setError(resultStale ? "제품 정보가 바뀌어 이전 결과를 숨겼어요. 다시 실행해주세요." : "먼저 시뮬레이션을 실행해주세요.");
      return;
    }
    setCurrent(id);
  };
  const cancelActiveRun = () => {
    activeRunRef.current = null;
    if (activeAbortRef.current) activeAbortRef.current.abort();
    activeAbortRef.current = null;
  };
  const updateBrief = (next) => {
    setBrief(prev => (typeof next === "function" ? next(prev) : next));
    setResult(null);
    setAnalystResult(null);
    setParseStatus(null);
    setError("");
  };
  const resetSession = () => {
    cancelActiveRun();
    clearSession();
    setCurrent("brief");
    setBrief({ ...RESONANCE_DATA.brief });
    setResult(null);
    setAnalystResult(null);
    setParseStatus(null);
    setRunning(false);
    setProgress(null);
    setError("");
  };

  useEffect(() => { document.documentElement.dataset.theme = tweaks.theme; }, [tweaks.theme]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [current]);
  useEffect(() => { checkApiHealth(); }, []);
  useEffect(() => {
    if (RESULT_LAYERS.has(current) && !liveResult) setCurrent("run");
  }, [current, liveResult]);
  useEffect(() => {
    saveSessionPatch({ current, brief, result: liveResult, analystResult, briefHash: currentBriefHash });
  }, [current, brief, liveResult, analystResult, currentBriefHash]);

  async function checkApiHealth() {
    try {
      const response = await fetch(apiPath("/api/health"));
      if (!response.ok) throw new Error(`API ${response.status}`);
      const health = await response.json();
      if (!health.ok) throw new Error("API key missing");
      setApiState({ label: "Live API Ready", detail: `${health.model || "solar-pro3"} · ${health.runs ?? 0} saved runs` });
    } catch (err) {
      setApiState({ label: "API Not Ready", detail: String(err.message || err) });
    }
  }

  async function pollJob(jobId, runToken, signal) {
    const started = Date.now();
    while (true) {
      if (activeRunRef.current !== runToken) throw new DOMException("stale run ignored", "AbortError");
      if (Date.now() - started > 20 * 60 * 1000) throw new Error("시뮬레이션 시간이 너무 오래 걸려 중단했어요. 패널 크기를 줄이거나 잠시 후 다시 시도해주세요.");
      const response = await fetch(apiPath(`/api/simulate/jobs/${encodeURIComponent(jobId)}`), { signal });
      if (!response.ok) throw new Error(`Job API ${response.status}`);
      const job = await response.json();
      if (activeRunRef.current === runToken) setProgress(job);
      if (job.status === "done") return job.result;
      if (job.status === "error") throw new Error(job.message || job.error || "simulation failed");
      await sleep(850, signal);
    }
  }

  async function parseDocumentBrief(file) {
    if (!file) return null;
    setParseStatus(null);
    if (!/\.pdf$/i.test(file.name || "") && file.type !== "application/pdf") {
      throw new Error("PDF 파일만 업로드할 수 있어요.");
    }
    setParseStatus({ state: "uploading", message: "PDF를 Document Parse API로 읽는 중…", sourceFileName: file.name || "document.pdf" });
    setError("");
    setResult(null);
    setAnalystResult(null);
    try {
      const form = new FormData();
      form.append("file", file, file.name || "document.pdf");
      const response = await fetch(apiPath("/api/document-brief"), { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) throw new Error(data.message || data.error || `Document Parse API ${response.status}`);
      const extracted = data.brief || {};
      setBrief(prev => ({
        ...prev,
        productName: extracted.productName || "",
        description: extracted.description || "",
        features: Array.isArray(extracted.features) ? extracted.features : [],
        pricing: Array.isArray(extracted.pricing) ? extracted.pricing : [],
        target: extracted.target || "",
        alternatives: extracted.alternatives || "",
        hypothesis: extracted.hypothesis || "",
      }));
      setParseStatus({
        state: "done",
        message: "AI가 PDF에서 제품 정보를 채웠어요.",
        sourceFileName: file.name || "document.pdf",
        confidence: extracted.confidence || 0,
        evidence: extracted.evidence || [],
        textLength: data.document_parse?.text_length || 0,
      });
      setApiState({ label: "Live API Ready", detail: "Document Parse 완료" });
      return data;
    } catch (err) {
      setParseStatus({ state: "error", message: String(err.message || err) });
      throw err;
    }
  }

  async function runSimulation(config = {}) {
    cancelActiveRun();
    const runToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const controller = new AbortController();
    activeRunRef.current = runToken;
    activeAbortRef.current = controller;
    setRunning(true);
    setError("");
    setAnalystResult(null);
    setResult(null);
    setApiState({ label: "API 실행 중", detail: "Solar Pro 3 persona 응답 생성 중" });
    try {
      const backendBrief = toBackendBrief(brief, config);
      const runBriefHash = briefFingerprint(brief);
      const response = await fetch(apiPath("/api/simulate/start"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(backendBrief), signal: controller.signal });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const job = await response.json();
      if (job.error) throw new Error(job.message || job.error);
      const payload = await pollJob(job.job_id, runToken, controller.signal);
      if (activeRunRef.current !== runToken) return;
      const ownedPayload = { ...payload, __briefHash: runBriefHash };
      setResult(ownedPayload);
      setApiState({ label: "방금 저장됨", detail: ownedPayload?.version?.version_id || "simulation complete" });
      setCurrent("signals");
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(String(err.message || err));
      setApiState({ label: "API 실패", detail: String(err.message || err) });
    } finally {
      if (activeRunRef.current === runToken) {
        activeRunRef.current = null;
        activeAbortRef.current = null;
        setRunning(false);
        setProgress(null);
      }
    }
  }

  async function askAnalyst(question) {
    if (!liveResult) return null;
    const response = await fetch(apiPath("/api/analyst-question"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: toBackendBrief(brief, {}), question, persona_reactions: liveResult.persona_reactions || liveResult.personas || [], target_limit: 4, max_rounds: 5 })
    });
    if (!response.ok) throw new Error(`Analyst API ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.message || data.error);
    setAnalystResult(data);
    return data;
  }

  async function personaChat(persona, message, history) {
    const response = await fetch(apiPath("/api/persona-chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: toBackendBrief(brief, {}), persona: persona.__raw || persona, message, history: history.slice(-8) })
    });
    if (!response.ok) throw new Error(`Chat API ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.message || data.error);
    return data.reply;
  }

  return (
    <>
      <Nav current={current} setCurrent={setCurrent} savedTime={apiState.label} apiState={apiState} onReset={resetSession} />
      <main className="shell">
        {error && <div className="callout" style={{ marginTop: 24 }}><div className="callout-eyebrow">API 오류</div><div className="callout-text">{error}</div></div>}
        {resultStale && <div className="callout" style={{ marginTop: 24 }}><div className="callout-eyebrow">결과 숨김</div><div className="callout-text">제품 정보가 바뀌어 이전 시뮬레이션 결과를 표시하지 않습니다. 새로 실행해주세요.</div></div>}
        {current === "brief"    && <BriefScreen brief={brief} setBrief={updateBrief} goNext={() => goTo("run")} onParseDocument={parseDocumentBrief} parseStatus={parseStatus} />}
        {current === "run"      && <RunScreen brief={brief} onRun={runSimulation} goBack={() => goTo("brief")} running={running} progress={progress} />}
        {current === "signals"  && (liveResult ? <SignalsScreen data={liveData.signals} versions={liveData.versions} result={liveResult} goNext={() => goTo("personas")} goBack={() => goTo("run")} /> : <NoResultScreen goRun={() => goTo("run")} />)}
        {current === "personas" && (liveResult ? <PersonasScreen personas={personas} mode={tweaks.personaMode} setMode={(m)=>setTweak("personaMode", m)} goNext={() => goTo("analyst")} goBack={() => goTo("signals")} onPersonaChat={personaChat} /> : <NoResultScreen goRun={() => goTo("run")} />)}
        {current === "analyst"  && (liveResult ? <AnalystScreen result={liveResult} analystResult={analystResult} onAsk={askAnalyst} goBack={() => goTo("personas")} goNext={() => goTo("report")} /> : <NoResultScreen goRun={() => goTo("run")} />)}
        {current === "report"   && (liveResult ? <ReportScreen result={liveResult} data={liveData} goBack={() => goTo("analyst")} goRestart={resetSession} /> : <NoResultScreen goRun={() => goTo("run")} />)}
      </main>
      {running && <SimulationOverlay progress={progress} onDone={() => {}} />}
      <TweaksPanel title="Tweaks">
        <TweakSection label="화면 테마"><TweakRadio label="테마" value={tweaks.theme} options={[{ value: "dark", label: "어둡게" }, { value: "light", label: "밝게" }]} onChange={(v) => setTweak("theme", v)} /></TweakSection>
        <TweakSection label="응답자 보는 방식">
          <div className="tw-mode-swatches">
            {[{ id: "constellation", label: "별자리" }, { id: "cards", label: "카드" }, { id: "conference", label: "회의실" }].map(s => <div key={s.id} className={"tw-swatch" + (tweaks.personaMode === s.id ? " active" : "")} onClick={() => setTweak("personaMode", s.id)}><span>{s.label}</span></div>)}
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

function SimulationOverlay({ progress }) {
  const canvasRef = useRef(null);
  const percent = Math.max(0, Math.min(100, Number(progress?.percent ?? 12)));
  const thought = progress?.message || "합성 응답자가 제품을 처음 듣고 있어요…";
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = 280, H = 280;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf, t = 0;
    function tick() {
      t += 0.016;
      ctx.clearRect(0,0,W,H);
      ctx.strokeStyle = "rgba(132,120,232,.18)"; ctx.lineWidth = 1;
      for (let i=0;i<10;i++) { const a=(i/10)*Math.PI*2+t; const x=W/2+Math.cos(a)*90; const y=H/2+Math.sin(a)*70; ctx.beginPath(); ctx.arc(x,y,5+(i%3),0,Math.PI*2); ctx.stroke(); }
      ctx.fillStyle = "rgba(132,120,232,.9)"; ctx.beginPath(); ctx.arc(W/2,H/2,8,0,Math.PI*2); ctx.fill();
      raf=requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div className="sim-overlay"><div className="sim-stage"><canvas ref={canvasRef}></canvas><div className="sim-headline">시장에 제품을 던지고 있어요</div><div className="sim-thought">{thought}</div><div className="sim-progress"><div className="sim-progress-bar" style={{ width: percent + "%" }}></div></div></div></div>;
}

window.__RESONANCE_APP__ = App;
