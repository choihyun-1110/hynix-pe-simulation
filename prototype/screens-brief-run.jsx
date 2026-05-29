/* 입력(Brief) + 실행(Run) screens */
/* global React, RESONANCE_DATA */

const { useState: useStateBR, useMemo: useMemoBR, useRef: useRefBR, useEffect: useEffectBR } = React;

/* ====================== BRIEF (1단계) ====================== */

function BriefScreen({ brief, setBrief, goNext, onParseDocument = null, parseStatus = null }) {
  const fileInputRef = useRefBR(null);
  const [uploadError, setUploadError] = useStateBR("");
  const [featuresText, setFeaturesText] = useStateBR(() => (brief.features || []).join("\n"));
  const [pricingText, setPricingText] = useStateBR(() => (brief.pricing || []).join("\n"));
  const localListEditRef = useRefBR({ features: null, pricing: null });
  const update = (k, v) => setBrief(prev => ({ ...prev, [k]: v }));
  const triggerUpload = () => fileInputRef.current?.click();
  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onParseDocument) return;
    setUploadError("");
    try {
      await onParseDocument(file);
    } catch (err) {
      setUploadError(String(err.message || err));
    }
  };
  const splitListInput = (raw, { keepNumericCommas = false } = {}) => {
    const text = String(raw || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[•●◦]/g, "\n")
      .replace(/\n\s*[-*]\s+/g, "\n");
    const parts = [];
    let current = "";
    const push = () => {
      const item = current.replace(/^\s*[-*]\s+/, "").trim();
      if (item) parts.push(item);
      current = "";
    };
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      const prev = text[i - 1] || "";
      const next = text[i + 1] || "";
      const commaInsideNumber = keepNumericCommas && ch === "," && /\d/.test(prev) && /\d/.test(next);
      if (ch === "\n" || ch === ";" || ch === "；" || ch === "|" || (ch === "," && !commaInsideNumber)) {
        push();
      } else {
        current += ch;
      }
    }
    push();
    return parts;
  };

  const updateList = (k, v) => {
    if (k === "features") setFeaturesText(v);
    if (k === "pricing") setPricingText(v);
    const arr = splitListInput(v, { keepNumericCommas: k === "pricing" });
    localListEditRef.current[k] = arr.join("\n");
    setBrief(prev => ({ ...prev, [k]: arr }));
  };

  const featuresKey = (brief.features || []).join("\n");
  const pricingKey = (brief.pricing || []).join("\n");
  useEffectBR(() => {
    if (localListEditRef.current.features === featuresKey) {
      localListEditRef.current.features = null;
      return;
    }
    setFeaturesText(featuresKey);
  }, [featuresKey]);
  useEffectBR(() => {
    if (localListEditRef.current.pricing === pricingKey) {
      localListEditRef.current.pricing = null;
      return;
    }
    setPricingText(pricingKey);
  }, [pricingKey]);

  const fields = [
    { key: "productName", label: "제품/이슈 이름", filled: !!brief.productName },
    { key: "description", label: "Fail pattern", filled: !!brief.description },
    { key: "features",    label: "Known data", filled: (brief.features || []).length > 0 },
    { key: "pricing",     label: "Test condition", filled: (brief.pricing || []).length > 0 },
    { key: "target",      label: "Customer/Application 조건", filled: !!brief.target },
    { key: "alternatives",label: "내부 재현/standard test", filled: !!brief.alternatives },
    { key: "hypothesis",  label: "확인하고 싶은 가설", filled: !!brief.hypothesis }
  ];
  const filledCount = fields.filter(f => f.filled).length;
  const completion = Math.round((filledCount / fields.length) * 100);
  const canRun = filledCount >= 3;

  // Brief quality preflight — mirrors the backend's brief_quality check
  const score = Math.round((filledCount / fields.length) * 100);
  const missing = fields.filter(f => !f.filled);

  return (
    <div className="page" data-screen-label="01 Brief">
      <div className="page-head">
        <div className="page-eyebrow">1단계 · PE 이슈 입력</div>
        <h1 className="page-title">반도체 제품 이슈를<br /><em>검증 가능한 형태로 적어주세요</em></h1>
        <p className="page-sub">Fail pattern, test condition, customer/application 조건을 입력하면 PE 관점에서 놓칠 수 있는 검증 질문을 정리합니다.</p>
      </div>

      <div className="brief-layout">
        <div className="card">
          <div className="card-head ai-card-head">
            <span className="card-tag">1단계</span>
            <div className="card-head-main">
              <div className="card-title">제품 이슈 정보</div>
              <div className="card-sub">최소 3개 항목만 채워도 시작할 수 있어요. 조건이 구체적일수록 stakeholder별 검토가 선명해집니다.</div>
            </div>
            <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={handlePdfUpload} />
            <button className="ai-import-btn" onClick={triggerUpload} disabled={!onParseDocument || parseStatus?.state === "uploading"} title="PDF를 업로드하면 Upstage Document Parse API가 제품 정보를 자동으로 채웁니다.">
              <span className="ai-spark">✦</span>
              {parseStatus?.state === "uploading" ? "AI 분석 중" : "AI로 PDF 채우기"}
            </button>
          </div>
          {(parseStatus || uploadError) && (
            <div className={"ai-import-status " + (parseStatus?.state || "error")}>
              <div>
                <strong>{parseStatus?.state === "done" ? "PDF 분석 완료" : parseStatus?.state === "uploading" ? "Document Parse 실행 중" : "PDF 분석 오류"}</strong>
                <p>{uploadError || parseStatus?.message}</p>
              </div>
              {parseStatus?.state === "done" && (
                <div className="ai-import-meta">
                  <span>신뢰도 {parseStatus.confidence || 0}%</span>
                  <span>{parseStatus.textLength || 0}자 추출</span>
                </div>
              )}
            </div>
          )}
          {parseStatus?.state === "done" && (parseStatus.evidence || []).length > 0 && (
            <div className="ai-evidence-strip">
              {(parseStatus.evidence || []).slice(0, 3).map((item, i) => <span key={i}>{item}</span>)}
            </div>
          )}
          <div className="card-body">
            <div className="field">
              <label className="field-label">
                제품/이슈 이름 <span className="req">*</span>
                <span className="field-help">제품군이나 이슈를 짧게 적어주세요.</span>
              </label>
              <input className="input" placeholder="예) DRAM high-temp low-V read fail"
                     value={brief.productName} onChange={e => update("productName", e.target.value)} />
            </div>

            <div className="field">
              <label className="field-label">
                Fail pattern / 제품 이슈 <span className="req">*</span>
                <span className="field-help">어떤 조건에서 어떤 fail이 증가하는지 적어주세요.</span>
              </label>
              <textarea className="textarea" rows="3"
                        placeholder="예) DRAM 제품에서 고온 조건과 낮은 voltage margin에서 read fail이 증가한다."
                        value={brief.description} onChange={e => update("description", e.target.value)} />
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="field-label">
                  확인된 데이터 / 관찰값
                  <span className="field-help">Wafer map, shmoo, lot 분포 등 한 줄에 하나씩 입력해주세요.</span>
                </label>
                <textarea className="textarea compact-textarea list-textarea" rows="5" placeholder={"예) 고온에서 fail 증가\n저전압 margin 축소\n특정 wafer edge die fail 집중"}
                          value={featuresText}
                          onChange={e => updateList("features", e.target.value)} />
              </div>

              <div className="field">
                <label className="field-label">
                  Test condition
                  <span className="field-help">전압, 온도, frequency, stress 조건을 입력해주세요.</span>
                </label>
                <textarea className="textarea compact-textarea list-textarea" rows="3" placeholder={"예) High temperature\nLow voltage margin\nFinal test 특정 frequency 이상"}
                          value={pricingText}
                          onChange={e => updateList("pricing", e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label className="field-label">
                Customer/Application 조건
                <span className="field-help">실제 고객사 이름 대신 workload 또는 application category로 적어주세요.</span>
              </label>
              <input className="input" placeholder="예) AI accelerator workload, high bandwidth burst access, high temperature operation"
                     value={brief.target} onChange={e => update("target", e.target.value)} />
            </div>

            <div className="field">
              <label className="field-label">
                내부 standard test / 재현 상황
                <span className="field-help">내부 test에서 재현되는지, 고객 workload에서만 보이는지 적어주세요.</span>
              </label>
              <textarea className="textarea" rows="2"
                        placeholder="예) 내부 standard test에서는 재현되지 않고, customer workload 조건에서 intermittent fail 보고"
                        value={brief.alternatives} onChange={e => update("alternatives", e.target.value)} />
            </div>

            <div className="field">
              <label className="field-label">
                이번 실행으로 확인하고 싶은 가설
                <span className="field-help">답을 얻고 싶은 한 가지 질문을 적어주세요. 비워둬도 괜찮습니다.</span>
              </label>
              <textarea className="textarea" rows="2"
                        placeholder="예) 월 구독 모델이 단발 결제보다 가입률이 높을 것이다"
                        value={brief.hypothesis} onChange={e => update("hypothesis", e.target.value)} />
            </div>

            <div className="row between" style={{ marginTop: 24 }}>
              <div className="dim" style={{ fontSize: 12.5 }}>
                자동 저장됨 · {filledCount}/{fields.length}개 항목 작성
              </div>
              <button className="btn btn-primary" onClick={goNext} disabled={!canRun}
                      style={{ opacity: canRun ? 1 : 0.5, cursor: canRun ? "pointer" : "not-allowed" }}>
                {canRun ? "다음: PE stakeholder simulation" : "최소 3개 항목을 채워주세요"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Blueprint side */}
        <div className="blueprint">
          <div className="bp-eyebrow">미리 보기</div>
          <div className="bp-title-help">PE stakeholder에게 전달될 이슈 brief입니다.</div>

          <div className="bp-section">
            <div className="bp-key">제품/이슈 이름</div>
            <div className={"bp-val" + (!brief.productName ? " empty" : "")}>
              {brief.productName || "아직 비어있어요"}
            </div>
          </div>

          <div className="bp-section">
            <div className="bp-key">Fail pattern</div>
            <div className={"bp-val" + (!brief.description ? " empty" : "")}
                 style={{ fontSize: 14, lineHeight: 1.6 }}>
              {brief.description || "여기에 한 줄 설명이 보여요"}
            </div>
          </div>

          <div className="bp-section">
            <div className="bp-key">확인된 데이터</div>
            <div className="bp-chips">
              {(brief.features || []).length > 0
                ? brief.features.map((f, i) => <span key={i} className="chip">{f}</span>)
                : <span className="bp-val empty" style={{ fontSize: 14 }}>기능을 더해주세요</span>}
            </div>
          </div>

          <div className="bp-section">
            <div className="bp-key">Test condition</div>
            <div className="bp-chips">
              {(brief.pricing || []).length > 0
                ? brief.pricing.map((p, i) => <span key={i} className="chip neutral">{p}</span>)
                : <span className="bp-val empty" style={{ fontSize: 14 }}>조건을 적어주세요</span>}
            </div>
          </div>

          <div className="bp-section">
            <div className="bp-key">Customer/Application</div>
            <div className={"bp-val" + (!brief.target ? " empty" : "")}
                 style={{ fontSize: 14 }}>
              {brief.target || "누구를 위한 제품인지 적어주세요"}
            </div>
          </div>

          {/* Brief Quality preflight (matches backend brief_quality check) */}
          <div className="preflight">
            <div className="preflight-head">
              <div className="preflight-title">입력 품질 점검</div>
              <div className="preflight-score">{score}점 / 100점</div>
            </div>
            <div className="preflight-bar">
              <div className="preflight-bar-fill" style={{ width: score + "%" }}></div>
            </div>
            <ul className="preflight-items">
              {fields.map(f => (
                <li key={f.key} className={f.filled ? "ok" : "missing"}>
                  {f.label} {f.filled ? "확인" : "미작성"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====================== RUN (2단계) ====================== */

function RunScreen({ brief, onRun, goBack, running = false, progress = null }) {
  return (
    <div className="page" data-screen-label="02 Run">
      <div className="page-head">
        <div className="page-eyebrow">2단계 · 시뮬레이션 실행</div>
        <h1 className="page-title">반도체 stakeholder가<br /><em>제품 이슈를 사전 검토합니다</em></h1>
        <p className="page-sub">Device, Design, Process, Test/Quality, Customer/Application 관점에서 가능한 원인 후보와 추가 검증 항목을 정리합니다.</p>
      </div>

      <div className="card">
          <div className="card-head">
            <span className="card-tag">2단계</span>
            <div>
              <div className="card-title">무엇을 확인할까요?</div>
              <div className="card-sub">PE 엔지니어가 관련 부서와 커뮤니케이션하기 전에 놓칠 수 있는 검증 관점을 점검합니다.</div>
            </div>
          </div>
        <div className="card-body">
          <div className="test-grid" style={{ marginBottom: 18 }}>
            {[
              { num: "01", name: "Device", desc: "Leakage, retention margin, sensing margin, device-level weak point를 검토합니다." },
              { num: "02", name: "Design", desc: "Sense amplifier, timing slack, refresh, operating corner sensitivity를 검토합니다." },
              { num: "03", name: "Process", desc: "Wafer 위치, lot 편차, CD/implant/oxide variation correlation을 검토합니다." },
              { num: "04", name: "Test / Quality", desc: "V-T-F condition, fail signature, shmoo, screening, reliability 조건을 검토합니다." },
              { num: "05", name: "Customer / Application", desc: "AI accelerator, data center, mobile 등 application category 기반 validation concern을 검토합니다." }
            ].map(t => (
              <div key={t.name} className="test-card active">
                <div className="test-name"><span className="test-num">{t.num}</span>{t.name}</div>
                <div className="test-desc">{t.desc}</div>
              </div>
            ))}
          </div>

          <div className="test-detail-card">
            <div className="test-detail-eyebrow">실행 모드 · Semiconductor PE stakeholder simulation</div>
            <div className="test-detail-body">AI가 정답을 확정하는 것이 아니라, PE 엔지니어가 원인 후보·확인 데이터·추가 test·부서별 질문을 빠르게 구조화하도록 돕습니다. 현재 프로토타입은 실제 사내 shmoo data, wafer map, FA report를 조회하지 않으며, 현업 적용 시에는 데이터 분석 결과 위에 LLM reasoning layer를 붙이는 구조가 필요합니다.</div>
          </div>

          <div className="dataset-card">
            <div className="dataset-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 7v10l8 5 8-5V7z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <div className="dataset-name">Cross-functional stakeholder preset</div>
              <div className="dataset-desc">
                향후 shmoo CSV, wafer map, lot/process history, binning result, reliability stress, FA report, customer qualification condition과 연결할 수 있는 PE reasoning assistant 구조입니다.
              </div>
            </div>
          </div>

          <div className="run-cta">
            <div className="cta-meta">
              <span><b>5개</b> stakeholder</span>
              <span>·</span>
              <span>예상 시간 <b>약 15초</b></span>
              <span>·</span>
              <span>고객사 모방 방지 guardrail</span>
            </div>
            <div className="row">
              <button className="btn" onClick={goBack}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M11 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                돌아가서 다시 적기
              </button>
              <button className="btn btn-primary" onClick={() => onRun({ mode: "pe" })} disabled={running}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
                {running ? (progress?.message || '시뮬레이션 실행 중…') : '시뮬레이션 실행'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BriefScreen, RunScreen });
