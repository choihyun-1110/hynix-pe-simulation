/* 분석가(Analyst) — persona 인터뷰 질문을 원질문에서 재설계 */
/* global React */

const { useState: useStateA } = React;

function aText(value) {
  return value == null ? "" : String(value).trim();
}

function aList(value) {
  if (Array.isArray(value)) return value.map(aText).filter(Boolean);
  const text = aText(value);
  return text ? [text] : [];
}

function AnalystTargetCard({ target, index }) {
  const context = target?.persona_context && typeof target.persona_context === "object" ? target.persona_context : {};
  const metaBits = [target?.meta, context.age ? `${context.age}세` : "", context.province, context.occupation].map(aText).filter(Boolean);
  const contextRows = [
    ["생활 맥락", context.family_context || context.persona],
    ["업무 맥락", context.professional_context],
    ["목표", context.goals],
  ].map(([label, value]) => [label, aText(value)]).filter(([, value]) => value);
  const drivers = aList(target?.positive_drivers);
  const risks = aList(target?.top_risks);
  const interests = aList(context.interests);
  const capabilities = aList(context.capabilities);

  return (
    <div className="analyst-target-card">
      <div className="analyst-target-head">
        <div>
          <div className="pcard-name">{target?.name || `Persona ${index + 1}`}</div>
          <div className="pcard-bio">{metaBits.slice(0, 4).join(" · ") || "선택된 응답자"}</div>
        </div>
        <span className="chip">{target?.stance || "분석 대상"}</span>
      </div>
      <div className="analyst-target-reason">{target?.reason || target?.signal || "분석 질문에 맞춰 선택"}</div>
      <div className="analyst-target-kpis">
        <div><span>채택 의향</span><strong>{target?.adoption_likelihood ?? "-"}%</strong></div>
        <div><span>문제 적합도</span><strong>{target?.need_fit_score ?? "-"}%</strong></div>
        <div><span>가격 부담</span><strong>{target?.price_resistance || "-"}</strong></div>
      </div>
      {target?.concern && <p className="analyst-target-concern">“{target.concern}”</p>}
      {contextRows.length > 0 && (
        <div className="analyst-target-context">
          {contextRows.map(([label, value]) => <div key={label}><b>{label}</b><span>{value}</span></div>)}
        </div>
      )}
      {(drivers.length || risks.length || interests.length || capabilities.length) ? (
        <div className="analyst-target-chips">
          {drivers.map(v => <em key={`d-${v}`}>동기: {v}</em>)}
          {risks.map(v => <em key={`r-${v}`}>우려: {v}</em>)}
          {interests.map(v => <em key={`i-${v}`}>관심: {v}</em>)}
          {capabilities.map(v => <em key={`c-${v}`}>역량: {v}</em>)}
        </div>
      ) : null}
    </div>
  );
}

function AnalystChatTranscript({ conversation, index }) {
  const messages = Array.isArray(conversation?.messages) ? conversation.messages : [];
  return (
    <div className="analyst-chat-card">
      <div className="analyst-chat-head">
        <div>
          <strong>{conversation?.persona_name || `Persona ${index + 1}`}</strong>
          {conversation?.question_plan?.objective && <p>{conversation.question_plan.objective}</p>}
        </div>
        <span className="chip">{conversation?.round_count || 1} rounds</span>
      </div>
      <div className="analyst-chat-stream">
        {messages.map((m, j) => {
          const isAnalyst = m.role === "analyst";
          return (
            <div className={"analyst-chat-row " + (isAnalyst ? "analyst" : "persona")} key={j}>
              <div className="analyst-chat-speaker">{isAnalyst ? "Analyst" : (conversation?.persona_name || "Persona")}</div>
              <div className="analyst-chat-bubble">{m.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalystScreen({ result, analystResult, onAsk, goBack, goNext }) {
  const [question, setQuestion] = useStateA("가격보다 신뢰가 더 큰 장벽인지, 페르소나들에게 직접 물어보고 근거를 수합해줘.");
  const [loading, setLoading] = useStateA(false);
  const [error, setError] = useStateA("");
  const conversations = analystResult?.conversations || [];
  const targets = analystResult?.target_personas || [];
  const synthesis = analystResult?.synthesis || {};

  async function submit() {
    if (!question.trim() || loading || !result) return;
    setLoading(true);
    setError("");
    try {
      await onAsk(question.trim());
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" data-screen-label="05 Analyst">
      <div className="page-head">
        <div className="page-eyebrow">5단계 · 분석가 질문 설계</div>
        <h1 className="page-title">원질문을 그대로 묻지 않고<br /><em>답을 얻는 질문으로 바꿉니다</em></h1>
        <p className="page-sub">분석 에이전트가 질문에 맞는 페르소나를 먼저 고르고, 각 페르소나에게 최적화된 질문과 후속 질문을 던진 뒤 의견을 수합합니다.</p>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-tag">5단계</span>
          <div>
            <div className="card-title">분석가에게 물어볼 원질문</div>
            <div className="card-sub">이 문장은 페르소나에게 그대로 전달되지 않습니다. 분석가가 목적을 해석하고 질문 계획으로 변환합니다.</div>
          </div>
        </div>
        <div className="card-body">
          <textarea className="textarea" rows="3" value={question} onChange={e => setQuestion(e.target.value)} placeholder="예: 가격이 제일 큰 장벽인지, 아니면 신뢰/사용성이 더 큰 장벽인지 확인해줘." />
          {!result && <div className="callout" style={{ marginTop: 14 }}><div className="callout-eyebrow">먼저 실행 필요</div><div className="callout-text">Layer 2에서 시뮬레이션을 실행한 뒤 분석가 인터뷰를 보낼 수 있습니다.</div></div>}
          {error && <div className="callout" style={{ marginTop: 14 }}><div className="callout-eyebrow">Analyst API 오류</div><div className="callout-text">{error}</div></div>}
          <div className="row between" style={{ marginTop: 18 }}>
            <button className="btn" onClick={goBack}>응답자 화면으로</button>
            <button className="btn btn-primary" onClick={submit} disabled={!result || loading}>{loading ? "인터뷰 중…" : "분석가 인터뷰 실행"}</button>
          </div>
        </div>
      </div>

      {analystResult && (
        <div className="report-layout" style={{ marginTop: 28 }}>
          <aside className="report-toc">
            <div className="toc-label">수합 결과</div>
            <button className="toc-item active"><span className="toc-num">1</span>요약</button>
            <button className="toc-item"><span className="toc-num">2</span>타깃</button>
            <button className="toc-item"><span className="toc-num">3</span>대화 기록</button>
          </aside>
          <div className="report-main">
            <section className="story-section in">
              <div className="story-num">1. 수합된 의견</div>
              <h2 className="story-h">{synthesis.summary || "분석가 인터뷰 결과"}</h2>
              {Array.isArray(synthesis.opinion_groups) && synthesis.opinion_groups.length ? (
                <div className="kpi-grid">{synthesis.opinion_groups.slice(0, 4).map((g, i) => <div className="kpi" key={i}><div className="l">의견 그룹</div><div className="v accent" style={{ fontSize: 22 }}>{g.label || g.theme || `그룹 ${i+1}`}</div><p className="dim">{g.summary || g.description || ""}</p></div>)}</div>
              ) : null}
            </section>

            <section className="story-section in">
              <div className="story-num">2. 먼저 선택한 타깃 페르소나</div>
              <div className="analyst-target-grid">
                {targets.map((t, i) => <AnalystTargetCard target={t} index={i} key={i} />)}
              </div>
            </section>

            <section className="story-section in">
              <div className="story-num">3. 실제 대화 기록</div>
              <div className="analyst-chat-list">
                {conversations.map((c, i) => <AnalystChatTranscript conversation={c} index={i} key={i} />)}
              </div>
            </section>

            <div className="row between" style={{ marginTop: 32 }}>
              <button className="btn" onClick={goBack}>응답자 다시 보기</button>
              <button className="btn btn-primary" onClick={goNext}>6단계: 리포트 보기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AnalystScreen = AnalystScreen;
