/* 분석가(Analyst) — persona 인터뷰 질문을 원질문에서 재설계 */
/* global React */

const { useState: useStateA } = React;

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
              <div className="persona-cards">{targets.map((t, i) => <div className="pcard" key={i}><div className="pcard-head"><div><div className="pcard-name">{t.name || `Persona ${i+1}`}</div><div className="pcard-bio">{t.reason || t.signal || "분석 질문에 맞춰 선택"}</div></div></div><div className="pcard-quote">{t.expected_signal || t.signal || "interview target"}</div></div>)}</div>
            </section>

            <section className="story-section in">
              <div className="story-num">3. 실제 대화 기록</div>
              {conversations.map((c, i) => <div className="story-block" key={i} style={{ marginBottom: 16 }}><div className="row between"><strong>{c.persona_name || `Persona ${i+1}`}</strong><span className="chip">{c.round_count || 1} rounds</span></div>{c.question_plan?.objective && <p className="story-lead" style={{ marginTop: 10 }}>{c.question_plan.objective}</p>}<ul className="story-list">{(c.messages || []).map((m, j) => <li key={j}><strong>{m.role === 'analyst' ? 'Analyst' : 'Persona'}:</strong> {m.content}</li>)}</ul></div>)}
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
