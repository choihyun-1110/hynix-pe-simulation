/* 응답자(Personas) — 별자리/카드/회의실 + 1대1 인터뷰 */
/* global React, RESONANCE_DATA, PersonaPortrait */

const { useState: useStateP, useEffect: useEffectP, useRef: useRefP, useMemo: useMemoP } = React;

/* ====== Constellation viz ====== */

function Constellation({ personas, selectedId, onSelect }) {
  const ref = useRefP(null);
  const [size, setSize] = useStateP({ w: 1000, h: 540 });

  useEffectP(() => {
    function update() {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [tick, setTick] = useStateP(0);
  useEffectP(() => {
    let raf;
    function loop() {
      setTick(t => t + 1);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const draftPositions = useMemoP(() => {
    return personas.map((p, i) => {
      const drift = tick / 80;
      const dx = Math.sin(drift + i * 1.3) * 6;
      const dy = Math.cos(drift * 0.8 + i * 0.7) * 4;
      return {
        ...p,
        cx: (p.x / 100) * size.w + dx,
        cy: (p.y / 100) * size.h + dy
      };
    });
    // eslint-disable-next-line
  }, [personas, tick, size.w, size.h]);

  const lines = useMemoP(() => {
    const out = [];
    const sel = draftPositions.find(p => p.id === selectedId);
    if (sel) {
      draftPositions.forEach(p => {
        if (p.id !== sel.id) {
          out.push({ x1: sel.cx, y1: sel.cy, x2: p.cx, y2: p.cy, type: "sel" });
        }
      });
    } else {
      for (let i = 0; i < draftPositions.length; i++) {
        for (let j = i + 1; j < draftPositions.length; j++) {
          const a = draftPositions[i], b = draftPositions[j];
          if (a.stance === b.stance) {
            out.push({ x1: a.cx, y1: a.cy, x2: b.cx, y2: b.cy, type: a.stance });
          }
        }
      }
    }
    return out;
    // eslint-disable-next-line
  }, [draftPositions, selectedId]);

  return (
    <div className="constellation" ref={ref}>
      <div className="constellation-grid"></div>

      <div className="const-meta">
        가까이 있을수록 의견이 비슷해요 · 크기는 채택 의향
      </div>

      <svg>
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={l.type === "sel" ? "var(--accent-bright)" : `var(--${l.type === "pos" ? "pos" : l.type === "neg" ? "neg" : "neu"})`}
                strokeWidth={l.type === "sel" ? 1 : 0.5}
                strokeDasharray={l.type === "sel" ? "0" : "3 4"}
                opacity={l.type === "sel" ? 0.35 : 0.15} />
        ))}
      </svg>

      {draftPositions.map(p => {
        // Adoption arc — replaces stance pill, shows quantitative intent
        const arcPct = p.adoption / 100;
        const r = p.size / 2 + 3;
        const C = 2 * Math.PI * r;
        const dash = arcPct * C;
        const arcColor = p.stance === "pos" ? "var(--pos)" : p.stance === "neg" ? "var(--neg)" : "var(--neu)";

        return (
          <div key={p.id}
               className={"persona-node" + (selectedId === p.id ? " selected" : "")}
               style={{ left: p.cx + "px", top: p.cy + "px" }}
               onClick={() => onSelect(p.id)}>
            <div className="node-portrait" style={{ "--size": p.size + "px" }}>
              <PersonaPortrait id={p.id} size={p.size} />
              <svg className="adoption-arc" viewBox={`0 0 ${p.size + 6} ${p.size + 6}`}>
                <circle cx={(p.size + 6) / 2} cy={(p.size + 6) / 2} r={r}
                        fill="none" stroke={arcColor} strokeWidth="2"
                        strokeDasharray={`${dash} ${C}`}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${(p.size + 6) / 2} ${(p.size + 6) / 2})`} />
              </svg>
            </div>
            <div className="node-label">
              <div className="node-name">{p.name}</div>
              <div className="node-meta">{p.age}세 · 채택 {p.adoption}%</div>
            </div>
          </div>
        );
      })}

      <div className="const-legend">
        <span><span className="dist-dot pos"></span>채택 의향 높음</span>
        <span><span className="dist-dot neu"></span>고민 중</span>
        <span><span className="dist-dot neg"></span>채택 의향 낮음</span>
      </div>
    </div>
  );
}

/* ====== Cards mode ====== */

function PersonaCards({ personas, selectedId, onSelect }) {
  return (
    <div className="persona-cards">
      {personas.map(p => (
        <div key={p.id}
             className={"pcard" + (selectedId === p.id ? " selected" : "")}
             onClick={() => onSelect(p.id)}>
          <div className="pcard-head">
            <div>
              <PersonaPortrait id={p.id} size={44} />
              <div>
                <div className="pcard-name">{p.name}</div>
                <div className="pcard-bio">{p.age}세 · {p.region} · {p.role}</div>
              </div>
            </div>
          </div>
          <div className="pcard-quote">"{p.stanceLabel}"</div>
          <div className="pcard-meter">
            <span className="pcard-meter-label">채택 의향</span>
            <div className="pcard-meter-bar">
              <div className="pcard-meter-bar-fill" style={{ width: p.adoption + "%" }}></div>
            </div>
            <span className="pcard-meter-val">{p.adoption}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ====== Conference mode ====== */

function ConferenceRoom({ personas, selectedId, onSelect }) {
  const ref = useRefP(null);
  const [box, setBox] = useStateP({ w: 1000, h: 540 });

  useEffectP(() => {
    function update() {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setBox({ w: r.width, h: r.height });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const cx = box.w / 2, cy = box.h / 2;
  const rx = Math.min(box.w * 0.42, 340), ry = Math.min(box.h * 0.36, 200);

  return (
    <div className="conference" ref={ref}>
      <div className="conf-table">
        <div className="conf-table-label">
          오늘의 응답자<br /><span style={{ fontSize: 10 }}>{personas.length}명 출석</span>
        </div>
      </div>

      {personas.map((p, i) => {
        const a = (i / personas.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        const quoteSide = Math.cos(a) >= 0 ? "right" : "left";
        const quoteVert = Math.sin(a) >= 0 ? "below" : "above";
        const quoteStyle = {
          [quoteSide === "right" ? "left" : "right"]: "80px",
          [quoteVert === "below" ? "top" : "bottom"]: "10px"
        };

        return (
          <div key={p.id}
               className={"conf-seat" + (selectedId === p.id ? " selected" : "")}
               style={{ left: x + "px", top: y + "px" }}
               onClick={() => onSelect(p.id)}>
            <div className="node-portrait" style={{ width: 56, height: 56 }}>
              <PersonaPortrait id={p.id} size={56} />
            </div>
            <div className="node-label">
              <div className="node-name">{p.name}</div>
              <div className="node-meta">{p.age}세</div>
            </div>
            <div className="conf-quote" style={quoteStyle}>
              "{p.stanceLabel}"
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ====== Persona Detail ====== */

function PersonaDetail({ persona }) {
  if (!persona) return null;
  const p = persona;
  const priceCls = p.price === "높음" ? "high" : p.price === "보통" ? "med" : "low";

  return (
    <div className="persona-detail">
      <div className="pd-head">
        <PersonaPortrait id={p.id} size={64} />
        <div>
          <div className="pd-name">{p.name}</div>
          <div className="pd-bio">{p.age}세 · {p.region} · {p.role}</div>
        </div>
      </div>

      <div className="pd-summary">
        "{p.stanceLabel}" — {p.buyCondition}
      </div>

      <div className="pd-stats">
        <div className="pd-stat"><div className="lbl">제품 이해도</div><div className="val">{p.understanding}%</div></div>
        <div className="pd-stat"><div className="lbl">문제 적합도</div><div className="val">{p.need}%</div></div>
        <div className="pd-stat"><div className="lbl">채택 의향</div><div className="val">{p.adoption}%</div></div>
        <div className="pd-stat"><div className="lbl">가격 부담</div><div className={"val " + priceCls}>{p.price}</div></div>
      </div>

      <div className="pd-section">
        <div className="pd-shead">이 분이 한 줄로 말하자면</div>
        <div style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.6, letterSpacing: "-0.005em" }}>{p.core}</div>
      </div>

      <div className="pd-cols">
        <div className="pd-section">
          <div className="pd-shead">마음이 기우는 이유</div>
          <ul className="pd-list">
            {p.drivers.length > 0
              ? p.drivers.map((d, i) => <li key={i}>{d}</li>)
              : <li style={{ color: "var(--text-4)" }}>아직 없음</li>}
          </ul>
        </div>
        <div className="pd-section">
          <div className="pd-shead">망설이는 이유</div>
          <ul className="pd-list">
            {p.risks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      </div>

      <div className="pd-section" style={{ marginBottom: 0 }}>
        <div className="pd-shead">이 분에게 다음에 물어볼 것</div>
        <div className="pd-nextq">{p.nextQ}</div>
      </div>
    </div>
  );
}

/* ====== Chat ====== */

function PersonaChat({ persona, onPersonaChat = null }) {
  const [stream, setStream] = useStateP([]);
  const [input, setInput] = useStateP("");
  const streamRef = useRefP(null);
  const [thinking, setThinking] = useStateP(false);

  useEffectP(() => {
    setStream([]);
    setInput("");
    setThinking(false);
    const script = onPersonaChat ? [persona.core].filter(Boolean) : (RESONANCE_DATA.chatScript[persona.id] || [persona.core]);
    const out = [];
    let i = 0;
    let timer;
    function next() {
      if (i >= script.length) return;
      out.push({ role: "bot", text: script[i] });
      setStream([...out]);
      i++;
      timer = setTimeout(next, 800);
    }
    timer = setTimeout(next, 300);
    return () => clearTimeout(timer);
  }, [persona.id]);

  useEffectP(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [stream, thinking]);

  const send = async () => {
    if (!input.trim() || thinking) return;
    const q = input.trim();
    const nextStream = [...stream, { role: "user", text: q }];
    setStream(nextStream);
    setInput("");
    setThinking(true);
    try {
      const reply = onPersonaChat ? await onPersonaChat(persona, q, nextStream.map(m => ({ role: m.role === 'bot' ? 'persona' : 'user', content: m.text }))) : customReply(persona, q);
      setStream(s => [...s, { role: "bot", text: reply || customReply(persona, q) }]);
    } catch (err) {
      setStream(s => [...s, { role: "bot", text: `API 요청이 실패했습니다: ${err.message || err}` }]);
    } finally {
      setThinking(false);
    }
  };

  const suggestionFor = (p) => {
    if (p.stance === "neg") return ["왜 마음이 안 움직이세요?", "어떤 사례가 있으면 다시 보시겠어요?", "가족이 사주면 어떨까요?"];
    if (p.stance === "pos") return ["어떤 점이 가장 마음에 드세요?", "월 결제 vs 단발 결제, 어느 쪽이?", "친구분께도 추천하시겠어요?"];
    return ["어떻게 설명하면 마음이 갈 것 같으세요?", "하루에 몇 번 정도 쓸 것 같으세요?", "어떤 가격이면 망설임이 없으세요?"];
  };

  return (
    <div className="chat">
      <div className="chat-head">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <PersonaPortrait id={persona.id} size={40} />
          <div>
            <div className="chat-name">{persona.name}님과 대화</div>
            <div className="chat-sub">{persona.age}세 · {persona.region} · {persona.role}</div>
          </div>
        </div>
      </div>

      <div className="chat-stream" ref={streamRef}>
        {stream.length === 0 && (
          <div style={{ color: "var(--text-4)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
            이 분이 잠시 후 말을 걸어올 거예요.
          </div>
        )}
        {stream.map((m, i) => (
          <div key={i} className={"bubble " + m.role}>
            {m.text}
          </div>
        ))}
        {thinking && (
          <div className="bubble thinking">
            <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            <span style={{ marginLeft: 8 }}>{persona.name}님이 생각하는 중…</span>
          </div>
        )}
      </div>

      <div className="chat-prompts">
        {suggestionFor(persona).map((s, i) => (
          <button key={i} className="prompt-chip" onClick={() => setInput(s)}>{s}</button>
        ))}
      </div>

      <div className="chat-input-row">
        <textarea className="chat-input"
                  placeholder="이 분께 직접 물어보세요. 예: 이 가격이면 왜 망설이세요?"
                  value={input}
                  rows={2}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <button className="send-btn" onClick={send}>
          물어보기
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6, verticalAlign: -2 }}>
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function customReply(p, q) {
  const name = p.name;
  if (/가격|39|290|월|구독|돈|비싸/.test(q)) {
    if (p.stance === "neg") return `${name}: 솔직히 가격 자체보다, ‘월 39,000원이 어디에 쓰이는지'가 안 보여요. 한 달에 어떤 가치가 새로 들어오는지 명세화돼야 결제 버튼이 눌릴 것 같습니다.`;
    if (p.stance === "pos") return `${name}: 가격은 합리적이라고 봐요. 다만 본체 290,000원을 먼저 결제하는 건 부담이고, 월 39,000원이면 1년에 47만원이라 결국 큰돈입니다. 6개월 묶음이 있으면 좋겠어요.`;
    return `${name}: 가격이 비싸진 않은데, 안 쓰면 그대로 손해라는 느낌이 있어요. 안전장치가 있으면 결제하기 쉬울 것 같아요.`;
  }
  if (/가족|자녀|부모|어머/.test(q)) {
    return `${name}: 결제는 자녀가, 사용은 부모가. 이 구조가 명확히 보이면 훨씬 사기 쉽습니다. 부모님이 음성으로 "고마워"라고 했을 때 자녀 폰에 메시지가 가는 식이면 매월 결제할 이유가 생겨요.`;
  }
  if (/안전|개인정보|데이터|발열/.test(q)) {
    return `${name}: 어르신이 매일 만지는 물건이에요. 외장재 발열, 모서리 안전, 그리고 음성 데이터가 어디에 저장되는지. 이 세 가지는 소개에 한 줄로라도 있어야 합니다.`;
  }
  if (/추천|친구/.test(q)) {
    if (p.stance === "pos") return `${name}: 사양 정보만 확실하면 주변에 한 명 정도는 추천할 수 있을 것 같아요.`;
    if (p.stance === "neg") return `${name}: 지금 상태로는 추천 못 해요. 제가 안 살 거니까요.`;
    return `${name}: 일단 제가 좀 더 써본 다음에 생각해볼게요.`;
  }
  if (/사용|어떻게|쓸|켜/.test(q)) {
    return `${name}: 솔직히 ‘강아지처럼 반응한다'가 머릿속에 안 그려져요. 영상 한 편이면 바로 이해될 텐데, 글로만 들으면 추상적이에요.`;
  }
  return `${name}: 좋은 질문이에요. 솔직히 지금 정보만으로는 답하기 어렵고, 실제 시연 영상 30초만 보여주시면 의견이 달라질 수 있을 것 같아요.`;
}

/* ====== Screen wrapper ====== */

function PersonasScreen({ mode, setMode, goNext, goBack, personas: livePersonas = null, onPersonaChat = null }) {
  const personas = (livePersonas && livePersonas.length) ? livePersonas : RESONANCE_DATA.personas;
  const [selectedId, setSelectedId] = useStateP(personas[0]?.id || "p4");

  useEffectP(() => {
    if (!personas.find(p => p.id === selectedId)) setSelectedId(personas[0]?.id || "p4");
  }, [personas.length]);

  const selected = personas.find(p => p.id === selectedId) || personas[0];

  return (
    <div className="page" data-screen-label="04 Personas">
      <div className="page-head">
        <div className="page-eyebrow">4단계 · 응답자 한 명씩 들여다보기</div>
        <h1 className="page-title">응답자가<br /><em>당신의 제품 앞에 앉아있습니다</em></h1>
        <p className="page-sub">한 명을 클릭하면 그 사람의 점수, 핵심 반응, 그리고 직접 대화까지 할 수 있어요. 앞 단계의 평균값이 여기서 개별 목소리로 분해됩니다.</p>
      </div>

      <div className="persona-controls">
        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <span className="card-tag">4단계</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>한 명씩 들여다보기</span>
          <span className="dim" style={{ fontSize: 12 }}>오늘 12:50 결과 · {personas.length}명</span>
        </div>
        <div className="const-overlay-controls">
          {[
            { id: "constellation", label: "별자리" },
            { id: "cards", label: "카드" },
            { id: "conference", label: "회의실" }
          ].map(m => (
            <button key={m.id}
                    className={"seg" + (mode === m.id ? " active" : "")}
                    onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        {mode === "constellation" && <Constellation personas={personas} selectedId={selectedId} onSelect={setSelectedId} />}
        {mode === "cards" && <PersonaCards personas={personas} selectedId={selectedId} onSelect={setSelectedId} />}
        {mode === "conference" && <ConferenceRoom personas={personas} selectedId={selectedId} onSelect={setSelectedId} />}
      </div>

      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>선택한 응답자</span>
        <span className="dim" style={{ fontSize: 12 }}>왼쪽: 점수와 반응 요약 · 오른쪽: 직접 대화하기</span>
      </div>

      <div className="workspace">
        <PersonaDetail persona={selected} />
        <PersonaChat persona={selected} onPersonaChat={onPersonaChat} />
      </div>

      <div className="row between" style={{ marginTop: 36 }}>
        <button className="btn" onClick={goBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          결과 화면으로
        </button>
        <button className="btn btn-primary" onClick={goNext}>
          5단계: 분석가에게 질문하기
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

window.PersonasScreen = PersonasScreen;
