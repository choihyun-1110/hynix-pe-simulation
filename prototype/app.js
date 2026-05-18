const chips = document.querySelectorAll('.chip');
const layerButtons = document.querySelectorAll('.nav-layer, .layer-card');
const researchTypeDetails = {
  'Concept test': {
    title: 'Concept test',
    question: '이 제품 컨셉 자체가 타깃에게 이해되고 매력적인가?',
    focuses: ['문제 공감도', '핵심 기능 이해도', '초기 사용 의향'],
    output: 'Adoption / Need fit 중심으로 컨셉을 계속 밀지, 설명을 바꿀지 판단합니다.'
  },
  'Pricing test': {
    title: 'Pricing test',
    question: '제시한 가격이 지불 의향 대비 부담스러운가?',
    focuses: ['가격 저항', '대체재 대비 가치', '무료/유료 전환 조건'],
    output: 'Price risk와 결제 장벽을 중심으로 가격표, 무료 체험, 패키징을 조정합니다.'
  },
  'Message test': {
    title: 'Message test',
    question: '어떤 가치/장벽/전환 계기 메시지가 먼저 클릭·인터뷰 신청을 만들까?',
    focuses: ['헤드라인 선호', 'objection 해소 문구', '전환 계기 카피'],
    output: 'Message angle tests와 pass signal을 중심으로 랜딩페이지 첫 문구와 A/B 테스트를 정합니다.'
  },
  'Objection mining': {
    title: 'Objection mining',
    question: '사용자가 구매·도입 전에 가장 먼저 의심하는 지점은 무엇인가?',
    focuses: ['불신 이유', '개인정보/정확도 우려', '사용 전환을 막는 문장'],
    output: 'Top risks와 objection list를 중심으로 랜딩페이지 문구와 FAQ를 만듭니다.'
  },
  'Segment discovery': {
    title: 'Segment discovery',
    question: '어떤 persona 세그먼트가 가장 먼저 반응하고, 누구는 안 맞는가?',
    focuses: ['세그먼트별 adoption 차이', 'beachhead customer', '우선 인터뷰 대상'],
    output: 'Segment recommendations를 중심으로 첫 타깃 고객군과 제외할 고객군을 나눕니다.'
  }
};
const layerHeroCopy = {
  brief: {
    eyebrow: '1단계 · 제품 정보 입력',
    title: '시장에 보여줄<br /><em>제품을 한 줄로 소개해주세요</em>',
    subtitle: '여기 적어주시는 내용을 다음 단계에서 합성 응답자가 처음 보게 됩니다. 광고 카피처럼 짧고 분명하게 적어주세요.'
  },
  run: {
    eyebrow: '2단계 · 시뮬레이션 실행',
    title: '합성 응답자가<br /><em>당신의 제품을 처음 듣습니다</em>',
    subtitle: '전국 분포에서 샘플링된 가상 응답자가 제품 소개를 읽고, 자기 입장에서 솔직한 반응을 돌려줘요.'
  },
  signals: {
    eyebrow: '3단계 · 결과 확인',
    title: '시장은<br /><em>제품을 어떻게 받았나요?</em>',
    subtitle: '응답을 점수, 분위기, 이전 실행과의 차이로 한 화면에 정리했어요. 평균값을 보고 다음 화면에서 개별 목소리로 분해합니다.'
  },
  personas: {
    eyebrow: '4단계 · 응답자 한 명씩 들여다보기',
    title: '응답자가<br /><em>당신의 제품 앞에 앉아있습니다</em>',
    subtitle: '한 명을 클릭하면 그 사람의 점수, 핵심 반응, 그리고 직접 대화까지 할 수 있어요.'
  },
  analyst: {
    eyebrow: '5단계 · 분석가 인터뷰',
    title: '분석가가 질문을 재구성하고<br /><em>필요한 답을 직접 캐묻습니다</em>',
    subtitle: '원질문을 그대로 던지지 않고, 답을 얻기 위한 최적 질문과 후속 질문을 만든 뒤 타깃 페르소나와 대화합니다.'
  },
  report: {
    eyebrow: '6단계 · 그래서 어떻게 할까요',
    title: '시뮬레이션이 끝났어요<br /><em>이제 한 가지를 결정할 시간</em>',
    subtitle: '결과를 한 페이지에 농축하고, 다음 한 수와 실제 검증 계획으로 이어지게 정리합니다.'
  }
};

let activeType = 'Concept test';
let activeLayer = 'brief';
let lastResult = null;
let activePersonaIndex = 0;
let personaChatHistories = {};
let lastReportMarkdown = '';
let lastAnalystResult = null;
let simulationVersions = [];
let activeVersionId = null;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeType = chip.dataset.type;
    renderResearchTypeGuide();
    updateRequestPreview();
  });
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function asList(value) { return Array.isArray(value) ? value : (value ? [value] : []); }
function activePersonas() {
  if (lastResult && Array.isArray(lastResult.persona_reactions) && lastResult.persona_reactions.length) return lastResult.persona_reactions;
  if (lastResult && Array.isArray(lastResult.personas) && lastResult.personas.length) return lastResult.personas;
  return [];
}
function personaKey(persona, index = activePersonaIndex) { return `${persona?.name || 'persona'}-${index}`; }

function updateHeroCopy(layer) {
  const copy = layerHeroCopy[layer] || layerHeroCopy.brief;
  const eyebrow = document.getElementById('heroEyebrow');
  const title = document.getElementById('heroTitle');
  const subtitle = document.getElementById('heroSubtitle');
  if (eyebrow) eyebrow.textContent = copy.eyebrow;
  if (title) title.innerHTML = copy.title;
  if (subtitle) subtitle.textContent = copy.subtitle;
}

function showLayer(layer) {
  activeLayer = layer || 'brief';
  document.querySelectorAll('.layer-view').forEach(view => {
    view.classList.toggle('active', view.dataset.layer === activeLayer);
  });
  layerButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.layer === activeLayer);
  });
  updateHeroCopy(activeLayer);
}

function openModal(title, html) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalBackdrop').hidden = false;
}

function closeModal() {
  document.getElementById('modalBackdrop').hidden = true;
}

function openRequestModal() {
  openModal('POST /api/simulate 요청 확인', `<pre class="modal-pre">${escapeHtml(document.getElementById('requestPreview').textContent)}</pre>`);
}

function renderProgressModal(job = {}) {
  const percent = Math.max(0, Math.min(100, Number(job.percent ?? 0)));
  const completed = Number(job.completed ?? 0);
  const total = Number(job.total ?? 0);
  const status = job.status || 'queued';
  const message = job.message || '시뮬레이션 준비 중';
  document.getElementById('modalTitle').textContent = '실시간 진행상황';
  document.getElementById('modalBody').innerHTML = `
    <div class="progress-panel">
      <div class="progress-topline">
        <strong>${escapeHtml(message)}</strong>
        <span>${escapeHtml(status)}</span>
      </div>
      <div class="progress-bar"><i style="width:${percent}%"></i></div>
      <div class="progress-meta">
        <span>${percent}%</span>
        <span>${total ? `${completed} / ${total} personas` : '대기 중'}</span>
      </div>
      <ol class="progress-steps">
        <li class="${percent >= 3 ? 'active' : ''}">Persona panel 준비</li>
        <li class="${percent >= 8 ? 'active' : ''}">Solar Pro 3 persona 응답 생성</li>
        <li class="${percent >= 96 ? 'active' : ''}">100명 응답 집계 / 리포트 구성</li>
        <li class="${percent >= 100 ? 'active' : ''}">버전 저장 및 화면 반영</li>
      </ol>
      ${job.version_id ? `<small>Version: ${escapeHtml(job.version_id)}</small>` : ''}
    </div>
  `;
  document.getElementById('modalBackdrop').hidden = false;
}

async function pollSimulationJob(jobId, brief) {
  while (true) {
    const response = await fetch(`/api/simulate/jobs/${encodeURIComponent(jobId)}`);
    if (!response.ok) throw new Error(`Job API ${response.status}`);
    const job = await response.json();
    renderProgressModal({ ...job, version_id: job.result?.version?.version_id });
    if (job.status === 'done') {
      const result = job.result;
      if (!result) throw new Error('Job completed without result');
      applyApiResult(result, brief.product_name, activeType);
      setApiStatus('ready', 'Live API Result', `version ${result.version?.version_id || 'saved'} 생성`);
      showLayer('signals');
      await refreshVersionHistory();
      renderProgressModal({ ...job, percent: 100, message: '완료되었습니다. Layer 3과 Layer 4에 결과를 반영했습니다.', version_id: result.version?.version_id });
      return result;
    }
    if (job.status === 'error') {
      throw new Error(job.message || job.error || 'simulation failed');
    }
    await sleep(850);
  }
}

function renderResearchTypeGuide() {
  const wrap = document.getElementById('researchTypeGuide');
  if (!wrap) return;
  const active = researchTypeDetails[activeType] || researchTypeDetails['Concept test'];
  wrap.innerHTML = `
    <div class="research-active-card">
      <span>Selected criteria</span>
      <h3>${escapeHtml(active.title)}</h3>
      <p>${escapeHtml(active.question)}</p>
      <small>${escapeHtml(active.output)}</small>
    </div>
    <div class="research-compare-grid">
      ${Object.entries(researchTypeDetails).map(([key, item]) => `
        <button class="research-compare-card ${key === activeType ? 'active' : ''}" type="button" data-type="${escapeHtml(key)}">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${item.focuses.map(escapeHtml).join(' · ')}</span>
        </button>
      `).join('')}
    </div>
  `;
  wrap.querySelectorAll('.research-compare-card').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.dataset.type;
      const chip = Array.from(chips).find(item => item.dataset.type === target);
      if (chip) chip.click();
    });
  });
}

function setApiStatus(state, label, detail) {
  const card = document.querySelector('.status-card');
  const statusLabel = document.getElementById('apiStatusLabel');
  const statusText = document.getElementById('apiStatusText');
  if (card) card.dataset.state = state;
  if (statusLabel) statusLabel.textContent = label;
  if (statusText) statusText.textContent = detail;
}

function renderBriefBlueprint() {
  const wrap = document.getElementById('briefBlueprint');
  if (!wrap) return;
  const brief = collectBrief();
  const features = asList(brief.features);
  const pricing = asList(brief.pricing);
  wrap.innerHTML = `
    <div class="bp-eyebrow">미리 보기</div>
    <div class="bp-title-help">응답자가 받게 될 제품 소개입니다.</div>
    <div class="bp-section"><div class="bp-key">제품 이름</div><div class="bp-val ${brief.product_name ? '' : 'empty'}">${escapeHtml(brief.product_name || '제품 이름을 입력해주세요')}</div></div>
    <div class="bp-section"><div class="bp-key">한 줄 설명</div><div class="bp-val ${brief.description ? '' : 'empty'}">${escapeHtml(brief.description || '제품 설명이 아직 비어 있어요')}</div></div>
    <div class="bp-section"><div class="bp-key">핵심 기능</div><div class="bp-chips">${features.length ? features.map(v => `<span class="chip">${escapeHtml(v)}</span>`).join('') : '<span class="bp-val empty">기능을 더해주세요</span>'}</div></div>
    <div class="bp-section"><div class="bp-key">가격</div><div class="bp-chips">${pricing.length ? pricing.map(v => `<span class="chip neutral">${escapeHtml(v)}</span>`).join('') : '<span class="bp-val empty">가격을 적어주세요</span>'}</div></div>
    <div class="bp-section"><div class="bp-key">타깃 고객</div><div class="bp-val ${brief.target_market ? '' : 'empty'}">${escapeHtml(brief.target_market || '누구에게 보여줄지 적어주세요')}</div></div>
  `;
}

function updateRequestPreview() {
  const preview = document.getElementById('requestPreview');
  const brief = collectBrief();
  if (preview) preview.textContent = JSON.stringify({ endpoint: 'POST /api/simulate', body: brief }, null, 2);
  renderBriefBlueprint();
}

async function checkApiHealth() {
  setApiStatus('checking', 'Checking API', 'Solar backend 상태 확인 중');
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error(`API ${response.status}`);
    const health = await response.json();
    if (!health.ok) throw new Error('UPSTAGE_API_KEY is not configured');
    setApiStatus('ready', 'Live API Ready', `${health.model || 'solar-pro3'} · ${health.runs ?? 0} saved runs`);
  } catch (error) {
    setApiStatus('error', 'API Not Ready', '서버 .env 또는 /api/health 확인 필요');
  }
}

function renderRunError(error) {
  const reportEl = document.getElementById('reportPreview');
  reportEl.innerHTML = `
    <div class="report-block error">
      <h3>API request failed</h3>
      <p>웹 입력은 서버의 <strong>POST /api/simulate</strong>로 전송됐지만, 실제 API 응답을 받지 못했습니다.</p>
      <p>${escapeHtml(error?.message || String(error || 'Unknown error'))}</p>
      <small>임시 결과로 대체하지 않았습니다. 서버 로그와 UPSTAGE_API_KEY 설정을 확인하세요.</small>
    </div>
  `;
}

function personaResultCount(result = lastResult) {
  if (result && Array.isArray(result.persona_reactions) && result.persona_reactions.length) return result.persona_reactions.length;
  if (result && Array.isArray(result.personas) && result.personas.length) return result.personas.length;
  return 0;
}

function setResultHandoff(result = null) {
  const handoff = document.getElementById('resultHandoff');
  const handoffText = document.getElementById('resultHandoffText');
  const personaSourceNote = document.getElementById('personaSourceNote');
  const count = personaResultCount(result);
  const versionId = result?.version?.version_id || activeVersionId || '';
  const productName = collectBrief().product_name || '제품';
  if (!handoff || !handoffText || !personaSourceNote) return;

  if (!result || !count) {
    handoff.hidden = true;
    handoffText.textContent = '아직 실행된 결과가 없습니다.';
    personaSourceNote.textContent = 'Layer 3에서 실행한 같은 결과를 persona별로 나눠 보여줍니다.';
    return;
  }

  handoff.hidden = false;
  handoffText.textContent = `${productName} · ${activeType} · ${count}명 persona 결과${versionId ? ` · ${versionId}` : ''}`;
  personaSourceNote.textContent = `Layer 3의 최신 집계 결과를 ${count}명 persona별 반응으로 분해한 화면입니다${versionId ? ` · ${versionId}` : ''}.`;
}

function renderEmptyState() {
  lastResult = null;
  lastAnalystResult = null;
  personaChatHistories = {};
  activePersonaIndex = 0;
  renderVersionComparison(null);
  setMarkdownExport('');
  document.getElementById('adoptionScore').textContent = '—';
  document.getElementById('needFitScore').textContent = '—';
  document.getElementById('priceRiskScore').textContent = '—';
  const actionCard = document.getElementById('serviceActionCard');
  if (actionCard) actionCard.innerHTML = '<div class="action-eyebrow">한 줄 결론</div><div class="action-headline">아직 실행된 결과가 없습니다. <span class="hi">제품 정보를 입력하고 시뮬레이션을 실행해 주세요.</span></div><div class="action-body">실행 후 긍정/중립/회의 반응과 다음 액션이 여기에 요약됩니다.</div>';
  updateBars(0, 0, 0);
  const constellation = document.getElementById('personaConstellation');
  if (constellation) constellation.innerHTML = '<div class="const-meta">시뮬레이션 실행 후 응답자 의견 지형이 표시됩니다.</div>';
  document.getElementById('personaCards').innerHTML = '<div class="version-empty">Layer 2에서 실제 API 시뮬레이션을 실행하면 persona 결과가 표시됩니다.</div>';
  document.getElementById('personaDetail').innerHTML = '<div class="version-empty">아직 선택된 persona가 없습니다.</div>';
  document.getElementById('chatPersonaName').textContent = '페르소나와 대화';
  document.getElementById('chatMessages').innerHTML = '<div class="empty-chat">시뮬레이션 결과가 생성되면 후속 질문을 보낼 수 있습니다.</div>';
  renderAnalystState();
  setResultHandoff(null);
  document.getElementById('reportPreview').innerHTML = `
    <div class="report-block">
      <h3>Ready for live simulation</h3>
      <p>왼쪽 Layer 1의 입력값을 확인한 뒤 <strong>실제 API로 시뮬레이션 실행</strong>을 누르면 서버의 <strong>POST /api/simulate</strong>로 요청이 전송됩니다.</p>
      <small>초기 화면은 임시 결과를 표시하지 않습니다. 성공한 API 응답만 dashboard와 report에 반영됩니다.</small>
    </div>
  `;
}

function defaultAnalystQuestion() {
  const report = lastResult?.report || {};
  const questions = Array.isArray(report.next_validation_questions) ? report.next_validation_questions : [];
  if (questions.length) return questions[0];
  const type = activeType || collectBrief().research_type || 'Concept test';
  if (type === 'Pricing test') return '이 가격에서 결제를 망설이는 진짜 이유가 가격 자체인지, 신뢰/효용 증거 부족인지 물어봐줘.';
  if (type === 'Message test') return '어떤 설명 문구가 가장 설득력 있고, 어떤 표현은 과장처럼 느껴지는지 물어봐줘.';
  if (type === 'Objection mining') return '사용 또는 결제를 막는 가장 큰 의심 하나와, 그 의심을 낮추는 증거가 무엇인지 물어봐줘.';
  if (type === 'Segment discovery') return '누가 가장 먼저 써볼 가능성이 있고, 누가 명확히 타깃이 아닌지 이유를 물어봐줘.';
  return '이 제품을 실제로 써보려면 어떤 조건이 먼저 충족되어야 하는지 물어봐줘.';
}

function renderAnalystState() {
  const empty = document.getElementById('analystEmpty');
  const resultWrap = document.getElementById('analystResult');
  const button = document.getElementById('askAnalystButton');
  if (!empty || !resultWrap) return;
  const hasPersonas = activePersonas().length > 0;
  if (button) button.disabled = !hasPersonas;
  if (!hasPersonas) {
    empty.hidden = false;
    empty.textContent = 'Layer 2에서 시뮬레이션을 실행한 뒤 분석가 질문을 보낼 수 있습니다.';
    resultWrap.hidden = true;
    return;
  }
  if (!lastAnalystResult) {
    empty.hidden = false;
    empty.textContent = '질문을 입력하고 “분석가에게 질문하기”를 누르면 타깃 페르소나 선정 → 최대 5회 맞춤 후속 질문 → 충분한 정보 확보 시 중단 → 의견 수합 순서로 실행됩니다.';
    resultWrap.hidden = true;
    return;
  }
  empty.hidden = true;
  resultWrap.hidden = false;
  const synthesis = lastAnalystResult.synthesis || {};
  document.getElementById('analystSummaryTitle').textContent = lastAnalystResult.question || '수합된 의견';
  document.getElementById('analystSummaryText').textContent = synthesis.summary || '수합된 의견이 없습니다.';

  const targets = Array.isArray(lastAnalystResult.target_personas) ? lastAnalystResult.target_personas : [];
  document.getElementById('analystTargets').innerHTML = targets.map(target => `
    <article class="analyst-target-card">
      <div>
        <strong>${escapeHtml(target.name || 'Persona')}</strong>
        <small>${escapeHtml(target.meta || '')}</small>
      </div>
      <span class="badge ${String(target.stance || '').includes('회의') || String(target.stance || '').includes('관망') ? 'warn' : ''}">${escapeHtml(target.stance || '분석됨')}</span>
      <p>${escapeHtml(target.reason || '분석 질문에 대한 대표 반응 확인')}</p>
      <div class="persona-mini-scores">
        <span>Adoption <b>${escapeHtml(target.adoption_likelihood ?? '-')}%</b></span>
        <span>Need <b>${escapeHtml(target.need_fit_score ?? '-')}%</b></span>
        <span>Price <b>${escapeHtml(target.price_resistance || '-')}</b></span>
      </div>
    </article>
  `).join('');

  const groups = Array.isArray(synthesis.opinion_groups) ? synthesis.opinion_groups : [];
  const conversations = Array.isArray(lastAnalystResult.conversations) ? lastAnalystResult.conversations : [];
  document.getElementById('analystConversations').innerHTML = `
    ${groups.length ? `<div class="analyst-opinion-groups">${groups.map(group => `
      <div class="analyst-opinion-card">
        <strong>${escapeHtml(group.theme || '의견')}</strong>
        <p>${escapeHtml(group.opinion || '')}</p>
        <small>${escapeHtml(group.evidence || '')}</small>
      </div>
    `).join('')}</div>` : ''}
    ${conversations.map(item => `
      <article class="analyst-thread">
        <div class="analyst-thread-head">
          <div>
            <strong>${escapeHtml(item.persona_name || 'Persona')}</strong>
            <small>${escapeHtml(item.meta || '')} · ${escapeHtml(item.target_reason || '')}</small>
            ${item.question_plan?.objective ? `<small>Generated probe objective: ${escapeHtml(item.question_plan.objective)}</small>` : ''}
          </div>
          <span class="badge">${escapeHtml(item.signal || 'other')} · ${escapeHtml(item.round_count || 1)}/${escapeHtml(item.max_rounds || lastAnalystResult.max_rounds || 5)}</span>
        </div>
        ${Array.isArray(item.generated_questions) && item.generated_questions.length ? `
          <div class="generated-question-plan">
            <strong>분석가가 생성한 질문</strong>
            <ol>${item.generated_questions.map((question, index) => `<li><span>Q${index + 1}</span>${escapeHtml(question)}</li>`).join('')}</ol>
          </div>
        ` : ''}
        <div class="chat-messages analyst-chat-log">
          ${(item.messages || []).map(message => `
            <div class="chat-bubble ${message.role === 'analyst' ? 'user' : 'persona'}">
              <small>Q${escapeHtml(message.round || '')} · ${message.role === 'analyst' ? 'Analyst agent' : escapeHtml(item.persona_name || 'Persona')}</small>
              <p>${escapeHtml(message.content || '')}</p>
            </div>
          `).join('')}
        </div>
        <small class="analyst-followup">Stop: ${escapeHtml(item.stop_reason === 'enough_information' ? '충분한 정보 확보' : '최대 질문 수 도달')} · Coverage ${escapeHtml(item.information_coverage?.score ?? '-')}/4${item.suggested_followup ? ` · Follow-up: ${escapeHtml(item.suggested_followup)}` : ''}</small>
      </article>
    `).join('')}
  `;
}

function formatVersionTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function compactRunGuardrails(version = {}) {
  const items = [];
  const evidenceLabel = version.evidence_quality_level || version.evidence_confidence;
  if (evidenceLabel || version.evidence_quality_score !== undefined) {
    const score = version.evidence_quality_score !== undefined && version.evidence_quality_score !== null ? ` ${version.evidence_quality_score}/100` : '';
    items.push(`Evidence ${evidenceLabel || ''}${score}`.trim());
  }
  const calls = version.actual_persona_calls ?? version.estimated_model_calls;
  if (calls !== undefined && calls !== null) {
    const requested = version.sample_size ? `/${version.sample_size}` : '';
    const batches = version.planned_batches ? ` · ${version.planned_batches} batches` : '';
    items.push(`Calls ${calls}${requested}${batches}`);
  }
  if (version.panel_selection_mode) {
    const selected = version.selected_persona_count ?? version.persona_count;
    const match = version.target_filter_match_count !== undefined && version.target_filter_match_count !== null && selected
      ? ` · ${version.target_filter_match_count}/${selected} target match`
      : '';
    items.push(`Panel ${version.panel_selection_mode}${match}`);
  }
  const warningCount = Number(version.evidence_warning_count || 0)
    + Number(version.request_budget_warning_count || 0)
    + Number(version.panel_warning_count || 0);
  if (warningCount > 0) items.push(`${warningCount} guardrail warning${warningCount === 1 ? '' : 's'}`);
  return items;
}

function renderVersionHistory() {
  const list = document.getElementById('versionList');
  const clearButton = document.getElementById('clearVersions');
  if (!list) return;
  if (clearButton) clearButton.disabled = !simulationVersions.length;
  if (!simulationVersions.length) {
    list.innerHTML = '<div class="version-empty">아직 저장된 시뮬레이션이 없습니다.</div>';
    return;
  }
  list.innerHTML = simulationVersions.map(version => {
    const isActive = version.version_id === activeVersionId;
    const guardrails = compactRunGuardrails(version);
    return `
      <button class="version-item ${isActive ? 'active' : ''}" type="button" data-version-id="${escapeHtml(version.version_id)}">
        <div class="version-item-top">
          <div>
            <strong>${escapeHtml(version.product_name || '제품')}</strong>
            <small>${escapeHtml(version.research_type || 'Concept test')} · ${escapeHtml(formatVersionTime(version.created_at))}</small>
          </div>
          <small>${escapeHtml((version.version_id || '').slice(9, 15))}</small>
        </div>
        <div class="version-metrics">
          <span>Adoption ${escapeHtml(version.adoption_score ?? '-')}%</span>
          <span>Need ${escapeHtml(version.need_fit_score ?? '-')}%</span>
          <span>Price ${escapeHtml(version.price_risk || '-')}</span>
          ${version.decision ? `<span>${escapeHtml(version.decision)}</span>` : ''}
        </div>
        ${guardrails.length ? `<div class="version-metrics guardrails">${guardrails.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}
      </button>
    `;
  }).join('');
  list.querySelectorAll('.version-item').forEach(item => {
    item.addEventListener('click', () => loadVersion(item.dataset.versionId));
  });
}

function deltaText(metric) {
  if (metric?.delta === null || metric?.delta === undefined) return '—';
  const value = Number(metric.delta);
  if (Number.isNaN(value)) return '—';
  return `${value > 0 ? '+' : ''}${value}${metric.unit || ''}`;
}

function renderVersionComparison(comparison = null) {
  const wrap = document.getElementById('versionComparison');
  if (!wrap) return;
  if (!comparison || !comparison.baseline) {
    wrap.hidden = true;
    wrap.innerHTML = '';
    return;
  }
  const metrics = Array.isArray(comparison.metrics) ? comparison.metrics : [];
  wrap.hidden = false;
  wrap.innerHTML = `
    <div class="version-comparison-top">
      <strong>이전 실행 대비 변화</strong>
      <small>${escapeHtml((comparison.baseline_version_id || '').slice(9, 15))} → ${escapeHtml((comparison.current_version_id || '').slice(9, 15))}</small>
    </div>
    <p>${escapeHtml(comparison.summary || '이전 버전과 핵심 점수를 비교했습니다.')}</p>
    <div class="version-delta-grid">
      ${metrics.map(metric => `
        <span class="version-delta ${escapeHtml(metric.direction || 'flat')}">
          <b>${escapeHtml(metric.label)}</b>
          <em>${escapeHtml(metric.baseline ?? '-')} → ${escapeHtml(metric.current ?? '-')}</em>
          <strong>${escapeHtml(deltaText(metric))}</strong>
        </span>
      `).join('')}
      <span class="version-delta ${comparison.price_risk_changed ? 'changed' : 'flat'}">
        <b>Price risk</b>
        <em>${escapeHtml(comparison.baseline?.price_risk || '-')} → ${escapeHtml(comparison.current?.price_risk || '-')}</em>
        <strong>${comparison.price_risk_changed ? 'changed' : 'same'}</strong>
      </span>
      <span class="version-delta ${comparison.decision_changed ? 'changed' : 'flat'}">
        <b>Decision</b>
        <em>${escapeHtml(comparison.baseline?.decision || '-')} → ${escapeHtml(comparison.current?.decision || '-')}</em>
        <strong>${comparison.decision_changed ? 'changed' : 'same'}</strong>
      </span>
    </div>
  `;
}

async function loadVersionComparison(versionId) {
  try {
    const response = await fetch(`/api/runs/compare/${encodeURIComponent(versionId)}`);
    if (!response.ok) throw new Error(`API ${response.status}`);
    renderVersionComparison(await response.json());
  } catch (error) {
    renderVersionComparison(null);
  }
}

async function clearVersionHistory() {
  if (!simulationVersions.length) return;
  const button = document.getElementById('clearVersions');
  const confirmed = window.confirm('저장된 Simulation Versions를 모두 삭제할까요? 실행 결과 파일은 로컬 trash로 이동합니다.');
  if (!confirmed) return;
  if (button) {
    button.disabled = true;
    button.textContent = '삭제 중...';
  }
  try {
    const response = await fetch('/api/runs', { method: 'DELETE' });
    if (!response.ok) throw new Error(`API ${response.status}`);
    simulationVersions = [];
    activeVersionId = null;
    renderVersionHistory();
    renderVersionComparison(null);
    renderEmptyState();
    await checkApiHealth();
  } catch (error) {
    console.warn('Failed to clear versions', error);
  } finally {
    if (button) button.textContent = '전체 삭제';
  }
}

async function refreshVersionHistory() {
  try {
    const response = await fetch('/api/runs');
    if (!response.ok) throw new Error(`API ${response.status}`);
    const payload = await response.json();
    simulationVersions = Array.isArray(payload.runs) ? payload.runs : [];
    renderVersionHistory();
  } catch (error) {
    renderVersionHistory();
  }
}

function applyBriefToForm(brief = {}) {
  document.getElementById('productName').value = brief.product_name || '제품';
  document.getElementById('description').value = brief.description || '';
  document.getElementById('features').value = asList(brief.features || brief.core_features).join(', ');
  document.getElementById('pricing').value = asList(brief.pricing || brief.price_options).join(', ');
  document.getElementById('targetMarket').value = brief.target_market || brief.target_users || '';
  document.getElementById('currentAlternatives').value = brief.current_alternatives || '';
  document.getElementById('hypothesis').value = brief.hypothesis || '';
  document.getElementById('sampleSize').value = brief.sample_size || 100;
  document.getElementById('seed').value = brief.seed || 42;
  if (brief.research_type) {
    activeType = brief.research_type;
    chips.forEach(chip => chip.classList.toggle('active', chip.dataset.type === activeType));
    renderResearchTypeGuide();
  }
  updateRequestPreview();
}

async function loadVersion(versionId) {
  if (!versionId) return;
  const list = document.getElementById('versionList');
  if (list) list.classList.add('loading');
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(versionId)}`);
    if (!response.ok) throw new Error(`API ${response.status}`);
    const payload = await response.json();
    activeVersionId = payload.version?.version_id || versionId;
    applyBriefToForm(payload.brief || {});
    applyApiResult(payload.result || {}, (payload.brief || {}).product_name || '제품', (payload.brief || {}).research_type || activeType, { preserveVersion: true });
    renderVersionHistory();
    await loadVersionComparison(activeVersionId);
  } catch (error) {
    console.warn('Failed to load version', error);
  } finally {
    if (list) list.classList.remove('loading');
  }
}

function buildResultMarkdown(brief, result = {}) {
  const report = result.report || {};
  const reactions = Array.isArray(result.persona_reactions) ? result.persona_reactions : activePersonas();
  const analyst = lastAnalystResult || null;
  return [
    `# Upkinsey Market Insight Report — ${brief.product_name || '제품'}`,
    '',
    '## Executive summary',
    '',
    report.executive_summary || `${brief.product_name || '제품'}에 대한 ${activeType} 결과입니다.`,
    '',
    '## Signal board',
    '',
    `- Adoption likelihood: ${result.adoption_score ?? document.getElementById('adoptionScore')?.textContent ?? '-'}%`,
    `- Need fit: ${result.need_fit_score ?? document.getElementById('needFitScore')?.textContent ?? '-'}%`,
    `- Price risk: ${result.price_risk ?? document.getElementById('priceRiskScore')?.textContent ?? '-'}`,
    '',
    '## Persona reaction table',
    '',
    '| Persona | Stance | Adoption | Need fit | Main concern |',
    '|---|---|---:|---:|---|',
    ...reactions.map(p => `| ${(p.name || 'Persona').replaceAll('|', '\\|')} (${(p.meta || '').replaceAll('|', '\\|')}) | ${(p.stance || '').replaceAll('|', '\\|')} | ${p.adoption_likelihood ?? '-'}% | ${p.need_fit_score ?? '-'}% | ${(p.concern || '').replaceAll('|', '\\|')} |`),
    '',
    ...(analyst ? [
      '## Analyst persona interviews',
      '',
      `- Question: ${(analyst.question || '').replaceAll('|', '\\|')}`,
      `- Synthesis: ${(analyst.synthesis?.summary || '').replaceAll('|', '\\|')}`,
      '',
      '### Generated analyst probes',
      '',
      ...(analyst.conversations || []).flatMap(item => [
        `- ${(item.persona_name || 'Persona').replaceAll('|', '\\|')}: ${(item.question_plan?.objective || 'persona-specific probe').replaceAll('|', '\\|')}`,
        ...((item.generated_questions || []).map((question, index) => `  - Q${index + 1}: ${(question || '').replaceAll('|', '\\|')}`)),
      ]),
      '',
      '| Target persona | Signal | Reply |',
      '|---|---|---|',
      ...(analyst.conversations || []).map(item => `| ${(item.persona_name || 'Persona').replaceAll('|', '\\|')} | ${(item.signal || 'other').replaceAll('|', '\\|')} | ${(item.reply || '').replaceAll('|', '\\|')} |`),
      '',
    ] : []),
    '---',
    'Synthetic pre-research signal only; validate with real users before product or investment decisions.'
  ].join('\n');
}

function setMarkdownExport(markdown) {
  lastReportMarkdown = String(markdown || '').trim();
  const button = document.getElementById('copyMarkdown');
  button.disabled = !lastReportMarkdown;
  button.textContent = lastReportMarkdown ? 'Markdown 복사' : 'Markdown 없음';
}

function updateBars(pos, neu, neg) {
  document.getElementById('positiveValue').textContent = pos;
  document.getElementById('neutralValue').textContent = neu;
  document.getElementById('negativeValue').textContent = neg;
  document.getElementById('positiveBar').style.width = `${pos}%`;
  document.getElementById('neutralBar').style.width = `${neu}%`;
  document.getElementById('negativeBar').style.width = `${neg}%`;
}

function renderPersonaConstellation(list = activePersonas()) {
  const wrap = document.getElementById('personaConstellation');
  if (!wrap) return;
  if (!list.length) {
    wrap.innerHTML = '<div class="const-meta">시뮬레이션 실행 후 응답자 의견 지형이 표시됩니다.</div>';
    return;
  }
  const width = 1000;
  const height = 430;
  const centerX = width / 2;
  const centerY = height / 2;
  const points = list.slice(0, 18).map((p, idx) => {
    const score = Number(p.adoption_likelihood ?? p.need_fit_score ?? 50);
    const angle = (idx / Math.max(1, Math.min(list.length, 18))) * Math.PI * 2 - Math.PI / 2;
    const radius = 105 + ((100 - score) * 1.85) + ((idx % 3) * 18);
    const x = Math.max(70, Math.min(width - 70, centerX + Math.cos(angle) * radius));
    const y = Math.max(58, Math.min(height - 58, centerY + Math.sin(angle) * radius * 0.68));
    const stanceText = String(p.stance || '');
    const stance = stanceText.includes('회의') || stanceText.includes('부정') ? 'neg' : stanceText.includes('관망') || stanceText.includes('중립') ? 'neu' : 'pos';
    return { p, idx, x, y, score, stance };
  });
  const active = points.find(point => point.idx === activePersonaIndex) || points[0];
  const lines = points.filter(point => point.idx !== active.idx).map(point => `<line x1="${active.x.toFixed(1)}" y1="${active.y.toFixed(1)}" x2="${point.x.toFixed(1)}" y2="${point.y.toFixed(1)}" class="${point.stance}" />`).join('');
  wrap.innerHTML = `
    <div class="constellation-grid"></div>
    <div class="const-meta">가까이 있을수록 의견이 비슷해요 · 크기는 채택 의향</div>
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
    ${points.map(point => `
      <button class="const-node ${point.stance} ${point.idx === activePersonaIndex ? 'active' : ''}" type="button" data-persona-index="${point.idx}" style="left:${(point.x / width * 100).toFixed(2)}%; top:${(point.y / height * 100).toFixed(2)}%; --size:${Math.max(38, Math.min(74, 34 + point.score * .42)).toFixed(0)}px">
        <span>${escapeHtml(String(point.p.name || `P${point.idx + 1}`).slice(0, 3))}</span>
      </button>
    `).join('')}
  `;
  wrap.querySelectorAll('.const-node').forEach(node => {
    node.addEventListener('click', () => selectPersona(Number(node.dataset.personaIndex || 0)));
  });
}

function renderPersonas(list = activePersonas()) {
  const wrap = document.getElementById('personaCards');
  renderPersonaConstellation(list);
  if (!list.length) {
    wrap.innerHTML = '<div class="version-empty">실제 API 실행 후 persona 카드가 생성됩니다.</div>';
    return;
  }
  wrap.innerHTML = list.map((p, idx) => {
    const isWarn = String(p.stance || '').includes('관망') || String(p.stance || '').includes('회의');
    const isActive = idx === activePersonaIndex;
    return `
      <article class="persona-card ${isActive ? 'active' : ''}" data-persona-index="${idx}">
        <div class="persona-card-top">
          <div>
            <div class="name">${escapeHtml(p.name || `Persona ${idx + 1}`)}</div>
            <div class="meta">${escapeHtml(p.meta || '')}</div>
          </div>
          <span class="badge ${isWarn ? 'warn' : ''}">${escapeHtml(p.stance || '분석됨')}</span>
        </div>
        <p>${escapeHtml(p.concern || '')}</p>
        <div class="persona-mini-scores">
          <span>Adoption <b>${escapeHtml(p.adoption_likelihood ?? '-')}%</b></span>
          <span>Need <b>${escapeHtml(p.need_fit_score ?? '-')}%</b></span>
        </div>
      </article>
    `;
  }).join('');
  wrap.querySelectorAll('.persona-card').forEach(card => {
    card.addEventListener('click', () => selectPersona(Number(card.dataset.personaIndex || 0)));
  });
}

function renderPersonaWorkbench() {
  renderPersonaConstellation(activePersonas());
  const list = activePersonas();
  if (!list.length) {
    document.getElementById('personaDetail').innerHTML = '<div class="version-empty">아직 선택된 persona가 없습니다.</div>';
    document.getElementById('chatPersonaName').textContent = '페르소나와 대화';
    document.getElementById('chatMessages').innerHTML = '<div class="empty-chat">시뮬레이션 결과가 생성되면 후속 질문을 보낼 수 있습니다.</div>';
    return;
  }
  if (activePersonaIndex >= list.length) activePersonaIndex = 0;
  const persona = list[activePersonaIndex];
  const detail = document.getElementById('personaDetail');
  const chatTitle = document.getElementById('chatPersonaName');
  const key = personaKey(persona);
  const history = personaChatHistories[key] || [];

  chatTitle.textContent = `${persona.name || 'Persona'}와 대화`;
  detail.innerHTML = `
    <div class="detail-header">
      <div>
        <h3>${escapeHtml(persona.name || 'Persona')}</h3>
        <p>${escapeHtml(persona.meta || '')}</p>
      </div>
      <span class="badge ${String(persona.stance || '').includes('회의') || String(persona.stance || '').includes('관망') ? 'warn' : ''}">${escapeHtml(persona.stance || '분석됨')}</span>
    </div>
    <div class="detail-scores">
      <div><small>Understanding</small><strong>${escapeHtml(persona.understanding_score ?? '-')}%</strong></div>
      <div><small>Need fit</small><strong>${escapeHtml(persona.need_fit_score ?? '-')}%</strong></div>
      <div><small>Adoption</small><strong>${escapeHtml(persona.adoption_likelihood ?? '-')}%</strong></div>
      <div><small>Price</small><strong>${escapeHtml(persona.price_resistance || '-')}</strong></div>
    </div>
    <div class="detail-block"><b>핵심 반응</b><p>${escapeHtml(persona.concern || '아직 분석 결과가 없습니다.')}</p></div>
    <div class="detail-columns">
      <div><b>Positive drivers</b><ul>${asList(persona.positive_drivers).map(v => `<li>${escapeHtml(v)}</li>`).join('') || '<li>-</li>'}</ul></div>
      <div><b>Top risks</b><ul>${asList(persona.top_risks).map(v => `<li>${escapeHtml(v)}</li>`).join('') || '<li>-</li>'}</ul></div>
    </div>
    <div class="detail-block"><b>다음 검증 질문</b><p>${escapeHtml(persona.next_validation_question || '-')}</p></div>
    ${asList(persona.used_persona_fields).length ? `<div class="used-fields">${asList(persona.used_persona_fields).map(v => `<span>${escapeHtml(v)}</span>`).join('')}</div>` : ''}
  `;

  renderChat(history);
}

function renderChat(history) {
  const messages = document.getElementById('chatMessages');
  if (!history.length) {
    messages.innerHTML = `<div class="empty-chat">이 페르소나에게 제품 반응 이유, 가격 저항, 어떤 메시지가 먹힐지 물어볼 수 있어요.</div>`;
    return;
  }
  messages.innerHTML = history.map(item => `
    <div class="chat-bubble ${item.role === 'user' ? 'user' : 'persona'}">
      <small>${item.role === 'user' ? 'You' : escapeHtml(activePersonas()[activePersonaIndex]?.name || 'Persona')}</small>
      <p>${escapeHtml(item.content)}</p>
    </div>
  `).join('');
  messages.scrollTop = messages.scrollHeight;
}

function tidyReportBlocks(container) {
  container.querySelectorAll('.report-block').forEach(block => {
    const contentNodes = block.querySelectorAll('p, li, small');
    const hasBodyContent = Array.from(contentNodes).some(node => node.textContent.trim());
    if (!hasBodyContent) {
      block.remove();
      return;
    }
    const textLength = block.textContent.trim().length;
    const listCount = block.querySelectorAll('li').length;
    if (textLength > 420 || listCount >= 4 || block.querySelector('.sprint-days')) {
      block.classList.add('wide');
    }
  });
}

function selectPersona(index) {
  activePersonaIndex = index;
  renderPersonas(activePersonas());
  renderPersonaWorkbench();
  openModal('Persona detail', document.getElementById('personaDetail').innerHTML);
}

function collectBrief() {
  return {
    product_name: document.getElementById('productName').value.trim() || '제품',
    description: document.getElementById('description').value.trim(),
    features: document.getElementById('features').value.split(',').map(v => v.trim()).filter(Boolean),
    pricing: document.getElementById('pricing').value.split(',').map(v => v.trim()).filter(Boolean),
    target_market: document.getElementById('targetMarket').value.trim(),
    current_alternatives: document.getElementById('currentAlternatives').value.trim(),
    hypothesis: document.getElementById('hypothesis').value.trim(),
    research_type: activeType,
    sample_size: Number(document.getElementById('sampleSize').value || 100),
    seed: Number(document.getElementById('seed').value || 42),
    max_parallel_requests: 4
  };
}

function applyApiResult(result, productName, type, options = {}) {
  lastResult = result;
  lastAnalystResult = null;
  personaChatHistories = {};
  activePersonaIndex = 0;
  if (result.version && !options.preserveVersion) {
    activeVersionId = result.version.version_id;
    const existingIndex = simulationVersions.findIndex(v => v.version_id === result.version.version_id);
    if (existingIndex >= 0) simulationVersions.splice(existingIndex, 1, result.version);
    else simulationVersions.unshift(result.version);
    renderVersionHistory();
    void loadVersionComparison(activeVersionId);
  } else if (result.version && options.preserveVersion) {
    activeVersionId = result.version.version_id;
  }
  setMarkdownExport(result.report_markdown || result.report?.markdown || buildResultMarkdown(collectBrief(), result));

  const adoption = Number(result.adoption_score ?? 0);
  const needFit = Number(result.need_fit_score ?? 0);
  const dist = result.reaction_distribution || {};
  const pos = Number(dist.positive ?? 0);
  const neu = Number(dist.neutral ?? 0);
  const neg = Number(dist.negative ?? 0);
  const priceRisk = result.price_risk || 'Medium';

  document.getElementById('adoptionScore').textContent = `${adoption}%`;
  document.getElementById('needFitScore').textContent = `${needFit}%`;
  document.getElementById('priceRiskScore').textContent = priceRisk;
  const actionCard = document.getElementById('serviceActionCard');
  if (actionCard) {
    const skeptical = neg >= pos;
    const headline = skeptical
      ? `긍정 반응 ${pos}, 회의적인 반응 ${neg}. <span class="hi">컨셉을 더 선명하게 다듬어야 해요.</span>`
      : `긍정 반응 ${pos}, 회의적인 반응 ${neg}. <span class="hi">초기 신호가 살아있습니다.</span>`;
    actionCard.innerHTML = `
      <div class="action-eyebrow">한 줄 결론</div>
      <div class="action-headline">${headline}</div>
      <div class="action-body">Adoption ${adoption}% · Need fit ${needFit}% · Price risk ${escapeHtml(priceRisk)}. 아래에서 지표를 확인하고, Layer 4에서 실제 페르소나별 이유를 분해해 보세요.</div>
      <div class="action-cta"><button class="secondary-button" type="button" data-next-layer="personas">응답자 목소리 보기</button><button class="secondary-button" type="button" data-next-layer="analyst">분석가에게 질문하기</button></div>
    `;
    actionCard.querySelectorAll('[data-next-layer]').forEach(button => button.addEventListener('click', () => showLayer(button.dataset.nextLayer)));
  }
  updateBars(pos, neu, neg);
  renderPersonas(activePersonas());
  renderPersonaWorkbench();
  setResultHandoff(result);
  renderAnalystState();

  const report = result.report || {};
  const briefQuality = result.brief_quality || report.brief_quality || null;
  const evidenceQuality = result.evidence_quality || report.evidence_quality || null;
  const requestBudget = result.request_budget || report.request_budget || null;
  const panelProfile = result.panel_profile || report.panel_profile || null;
  const founderMemo = result.founder_memo || report.founder_memo || null;
  const objections = Array.isArray(report.objections) ? report.objections : [];
  const segments = Array.isArray(report.segment_recommendations) ? report.segment_recommendations : [];
  const decisionBoard = report.decision_board || null;
  const decisionSensitivity = result.decision_sensitivity || report.decision_sensitivity || null;
  const switchingAnalysis = report.switching_analysis || null;
  const assumptionStressTest = report.assumption_stress_test || null;
  const validationPlan = report.validation_plan || null;
  const interviewDiscussionGuide = report.interview_discussion_guide || result.interview_discussion_guide || null;
  const validationSurvey = report.validation_survey || result.validation_survey || null;
  const intentCohortContrast = report.intent_cohort_contrast || null;
  const researchTypeLens = result.research_type_lens || report.research_type_lens || null;
  const personaEvidencePack = result.persona_evidence_pack || report.persona_evidence_pack || null;
  const messageAngleTests = Array.isArray(report.message_angle_tests) ? report.message_angle_tests : [];
  const experimentBacklog = Array.isArray(report.experiment_backlog) ? report.experiment_backlog : [];
  const nextRunBriefVariants = Array.isArray(report.next_run_brief_variants) ? report.next_run_brief_variants : [];
  const researchSprint = report.research_sprint || null;
  const reportEl = document.getElementById('reportPreview');
  reportEl.innerHTML = `
    <div class="report-block">
      <h3>Executive Summary</h3>
      <p>${escapeHtml(report.executive_summary || `${productName}에 대한 ${type} 결과를 생성했습니다.`)}</p>
    </div>
    ${founderMemo ? `
    <div class="report-block">
      <h3>Founder Decision Memo</h3>
      <p><strong>${escapeHtml(founderMemo.headline || founderMemo.recommendation || '다음 의사결정 메모')}</strong></p>
      ${founderMemo.why_it_may_work ? `<p>${escapeHtml(founderMemo.why_it_may_work)}</p>` : ''}
      ${founderMemo.primary_kill_risk ? `<p><strong>Kill-risk:</strong> ${escapeHtml(founderMemo.primary_kill_risk)}</p>` : ''}
      ${founderMemo.decision_gate ? `<small>Decision gate: ${escapeHtml(founderMemo.decision_gate)}</small>` : ''}
      ${Array.isArray(founderMemo.next_48h_actions) && founderMemo.next_48h_actions.length ? `<p><strong>Next 48h</strong></p><ul>${founderMemo.next_48h_actions.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : ''}
    </div>` : ''}
    ${requestBudget || panelProfile ? `
    <div class="report-block">
      <h3>Run Budget & Panel Guardrails</h3>
      ${requestBudget ? `<p><strong>${escapeHtml(requestBudget.model || 'Solar Pro 3')}</strong> · ${escapeHtml(requestBudget.estimated_total_model_calls ?? requestBudget.solar_persona_calls ?? '-')} persona calls · ${escapeHtml(requestBudget.planned_batches ?? '-')} planned batches · max parallel ${escapeHtml(requestBudget.max_parallel_requests ?? '-')}</p>` : ''}
      ${requestBudget ? `<small>Requested ${escapeHtml(requestBudget.requested_sample_size ?? '-')} personas, actually ran ${escapeHtml(requestBudget.actual_persona_count ?? requestBudget.solar_persona_calls ?? '-')} persona-level simulations.</small>` : ''}
      ${panelProfile ? `<p><strong>Panel:</strong> ${escapeHtml(panelProfile.selection_mode || 'unfiltered')} ${panelProfile.persona_filter_source ? `· ${escapeHtml(panelProfile.persona_filter_source)}` : ''} · selected ${escapeHtml(panelProfile.selected_persona_count ?? '-')} / source ${escapeHtml(panelProfile.source_persona_count ?? '-')}</p>` : ''}
      ${panelProfile && panelProfile.target_filter_match_count !== undefined && panelProfile.target_filter_match_count !== null ? `<small>Target match: ${escapeHtml(panelProfile.target_filter_match_count)} personas</small>` : ''}
      ${requestBudget && Array.isArray(requestBudget.warnings) && requestBudget.warnings.length ? `<p><strong>Budget warnings</strong></p><ul>${requestBudget.warnings.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : ''}
      ${panelProfile && Array.isArray(panelProfile.warnings) && panelProfile.warnings.length ? `<p><strong>Panel warnings</strong></p><ul>${panelProfile.warnings.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : ''}
    </div>` : ''}
    ${briefQuality ? `
    <div class="report-block">
      <h3>Brief Quality · ${escapeHtml(briefQuality.score ?? '-')} / 100</h3>
      <p>${escapeHtml(briefQuality.verdict === 'ready' ? '시뮬레이션에 충분히 구체적인 브리프입니다.' : '추가로 좁히면 다음 실험 질문이 더 선명해집니다.')}</p>
      ${Array.isArray(briefQuality.missing_fields) && briefQuality.missing_fields.length ? `<p><strong>Missing:</strong> ${briefQuality.missing_fields.map(escapeHtml).join(', ')}</p>` : ''}
      ${Array.isArray(briefQuality.recommended_questions) && briefQuality.recommended_questions.length ? `<ul>${briefQuality.recommended_questions.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : ''}
    </div>` : ''}
    ${evidenceQuality ? `
    <div class="report-block">
      <h3>Evidence Quality · ${escapeHtml(evidenceQuality.score ?? '-')} / 100</h3>
      <p><strong>${escapeHtml(evidenceQuality.level || 'exploratory')}</strong> · ${escapeHtml(evidenceQuality.confidence || 'low')} confidence · ${escapeHtml(evidenceQuality.persona_count ?? '-')} personas</p>
      ${Array.isArray(evidenceQuality.warnings) && evidenceQuality.warnings.length ? `<p><strong>Guardrails:</strong></p><ul>${evidenceQuality.warnings.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : ''}
      ${Array.isArray(evidenceQuality.recommended_actions) && evidenceQuality.recommended_actions.length ? `<small>Next: ${evidenceQuality.recommended_actions.map(escapeHtml).join(' · ')}</small>` : ''}
    </div>` : ''}
    ${researchTypeLens ? `
    <div class="report-block">
      <h3>${escapeHtml(researchTypeLens.lens || 'Research type lens')}</h3>
      <p><strong>${escapeHtml(researchTypeLens.primary_metric || '')}</strong> → ${escapeHtml(researchTypeLens.primary_output || '')}</p>
      <p>${escapeHtml(researchTypeLens.interpretation || '')}</p>
      <small>Next: ${escapeHtml(researchTypeLens.recommended_next_action || '')}</small>
    </div>` : ''}
    <div class="report-block">
      <h3>Likely Positive Drivers</h3>
      <ul>${(report.positive_drivers || []).map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>
    </div>
    <div class="report-block">
      <h3>Top Risks</h3>
      <ul>${(report.top_risks || []).map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>
    </div>
    ${personaEvidencePack ? `
    <div class="report-block">
      <h3>Persona Evidence Pack</h3>
      <p>${escapeHtml(personaEvidencePack.summary || '')}</p>
      ${Array.isArray(personaEvidencePack.supporter_cards) && personaEvidencePack.supporter_cards.length ? `<p><strong>Supporters</strong></p><ul>${personaEvidencePack.supporter_cards.map(card => `<li><strong>${escapeHtml(card.persona || 'Persona')}</strong> · ${escapeHtml(card.adoption_likelihood ?? '-')}% adoption<br>${escapeHtml(card.signal || '')}<br><small>Probe: ${escapeHtml(card.interview_probe || '')}</small></li>`).join('')}</ul>` : ''}
      ${Array.isArray(personaEvidencePack.barrier_cards) && personaEvidencePack.barrier_cards.length ? `<p><strong>Barriers</strong></p><ul>${personaEvidencePack.barrier_cards.map(card => `<li><strong>${escapeHtml(card.persona || 'Persona')}</strong> · ${escapeHtml(card.adoption_likelihood ?? '-')}% adoption<br>${escapeHtml(card.signal || '')}<br><small>Probe: ${escapeHtml(card.interview_probe || '')}</small></li>`).join('')}</ul>` : ''}
      ${Array.isArray(personaEvidencePack.validation_followups) && personaEvidencePack.validation_followups.length ? `<small>Follow-up: ${personaEvidencePack.validation_followups.map(card => escapeHtml(card.validation_question || '')).join(' · ')}</small>` : ''}
    </div>` : ''}
    ${objections.length ? `
    <div class="report-block">
      <h3>Objection Mining</h3>
      <ul>${objections.map(o => `<li><strong>${escapeHtml(o.category || '우려')}</strong>: ${escapeHtml(o.objection || '')}<br><small>${escapeHtml(o.suggested_fix || '')}</small></li>`).join('')}</ul>
    </div>` : ''}
    ${switchingAnalysis ? `
    <div class="report-block">
      <h3>Current Alternative & Switching Triggers</h3>
      <p><strong>현재 대안:</strong> ${escapeHtml(switchingAnalysis.current_alternatives || '-')}</p>
      ${Array.isArray(switchingAnalysis.why_current_alternative_persists) && switchingAnalysis.why_current_alternative_persists.length ? `<p><strong>왜 유지되는가:</strong></p><ul>${switchingAnalysis.why_current_alternative_persists.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : ''}
      ${Array.isArray(switchingAnalysis.switching_triggers) && switchingAnalysis.switching_triggers.length ? `<p><strong>전환 트리거:</strong></p><ul>${switchingAnalysis.switching_triggers.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : ''}
      ${Array.isArray(switchingAnalysis.validation_tests) && switchingAnalysis.validation_tests.length ? `<small>Test: ${switchingAnalysis.validation_tests.map(escapeHtml).join(' · ')}</small>` : ''}
    </div>` : ''}
    ${assumptionStressTest ? `
    <div class="report-block">
      <h3>Assumption Stress Test · ${escapeHtml(assumptionStressTest.overall_risk || 'Low')} risk</h3>
      <p><strong>Next:</strong> ${escapeHtml(assumptionStressTest.recommended_next_step || '')}</p>
      ${Array.isArray(assumptionStressTest.assumptions) && assumptionStressTest.assumptions.length ? `<ul>${assumptionStressTest.assumptions.map(card => `<li><strong>${escapeHtml(card.risk_level || '-')}: ${escapeHtml(card.area || 'assumption')}</strong><br>${escapeHtml(card.assumption || '')}<br><small>Signal: ${escapeHtml(card.synthetic_signal || '')} · Test: ${escapeHtml(card.falsification_test || '')}</small></li>`).join('')}</ul>` : ''}
    </div>` : ''}
    ${segments.length ? `
    <div class="report-block">
      <h3>Segment Recommendations</h3>
      <ul>${segments.map(s => `<li><strong>${escapeHtml(s.segment || '검증 타깃')}</strong> · ${escapeHtml(s.avg_adoption ?? '-')}% adoption / ${escapeHtml(s.price_risk_mode || 'Medium')} price risk<br><small>${escapeHtml(s.primary_driver || '')} → ${escapeHtml(s.validation_action || '')}</small></li>`).join('')}</ul>
    </div>` : ''}
    ${intentCohortContrast && Array.isArray(intentCohortContrast.cohorts) && intentCohortContrast.cohorts.length ? `
    <div class="report-block">
      <h3>Intent Cohort Contrast</h3>
      <p>${escapeHtml(intentCohortContrast.summary || '')}</p>
      <small>Gap: ${escapeHtml(intentCohortContrast.adoption_gap ?? 0)}p · ${escapeHtml(intentCohortContrast.recommended_comparison || '')}</small>
      <ul>${intentCohortContrast.cohorts.map(cohort => `<li><strong>${escapeHtml(cohort.label || cohort.cohort || 'Cohort')}</strong> · ${escapeHtml(cohort.avg_adoption ?? '-')}% adoption / ${escapeHtml(cohort.persona_count ?? 0)} personas<br><small>Drivers: ${asList(cohort.shared_drivers).map(escapeHtml).join(', ') || '-'} · Objections: ${asList(cohort.shared_objections).map(escapeHtml).join(', ') || '-'}</small></li>`).join('')}</ul>
    </div>` : ''}
    ${decisionBoard ? `
    <div class="report-block">
      <h3>Decision Board · ${escapeHtml(decisionBoard.decision || 'Refine')}</h3>
      <p><strong>${escapeHtml(decisionBoard.confidence || 'low')} confidence</strong> — ${escapeHtml(decisionBoard.rationale || '')}</p>
      <p>${escapeHtml(decisionBoard.next_step || '')}</p>
      ${Array.isArray(decisionBoard.criteria) && decisionBoard.criteria.length ? `<ul>${decisionBoard.criteria.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : ''}
      <small>${escapeHtml(decisionBoard.disclaimer || '')}</small>
    </div>` : ''}
    ${decisionSensitivity ? `
    <div class="report-block">
      <h3>Decision Sensitivity · ${escapeHtml(decisionSensitivity.risk_level || 'medium')} risk</h3>
      <p>${escapeHtml(decisionSensitivity.summary || '')}</p>
      <p><strong>Adoption band:</strong> ${escapeHtml(asList(decisionSensitivity.adoption_band?.range).join('-') || '-')}% · <strong>Need-fit band:</strong> ${escapeHtml(asList(decisionSensitivity.need_fit_band?.range).join('-') || '-')}%</p>
      <p>${escapeHtml(decisionSensitivity.interpretation || '')}</p>
      <small>Next: ${escapeHtml(decisionSensitivity.recommended_action || '')}</small>
    </div>` : ''}
    ${validationPlan ? `
    <div class="report-block">
      <h3>Real-user Validation Plan</h3>
      <p><strong>${escapeHtml(validationPlan.recommended_sample || '')}</strong></p>
      <p>${escapeHtml(validationPlan.objective || '')}</p>
      <p><strong>Recruit:</strong> ${escapeHtml(validationPlan.recruiting_focus || '')}</p>
      ${Array.isArray(validationPlan.interview_questions) && validationPlan.interview_questions.length ? `<ul>${validationPlan.interview_questions.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : ''}
      ${Array.isArray(validationPlan.success_criteria) && validationPlan.success_criteria.length ? `<small>Success: ${validationPlan.success_criteria.map(escapeHtml).join(' · ')}</small>` : ''}
    </div>` : ''}
    ${interviewDiscussionGuide ? `
    <div class="report-block">
      <h3>Interview Discussion Guide</h3>
      <p><strong>${escapeHtml(interviewDiscussionGuide.session_length || '25-30 minutes')}</strong> · ${escapeHtml(interviewDiscussionGuide.participant_profile || '')}</p>
      <p>${escapeHtml(interviewDiscussionGuide.objective || '')}</p>
      <p><strong>Concept read:</strong> ${escapeHtml(interviewDiscussionGuide.concept_read || '')}</p>
      ${Array.isArray(interviewDiscussionGuide.warmup_questions) && interviewDiscussionGuide.warmup_questions.length ? `<p><strong>Warm-up</strong></p><ul>${interviewDiscussionGuide.warmup_questions.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : ''}
      ${Array.isArray(interviewDiscussionGuide.concept_reaction_tasks) && interviewDiscussionGuide.concept_reaction_tasks.length ? `<p><strong>Concept tasks</strong></p><ul>${interviewDiscussionGuide.concept_reaction_tasks.map(task => `<li><strong>${escapeHtml(task.step || 'task')}</strong>: ${escapeHtml(task.question || '')}<br><small>Listen for: ${escapeHtml(task.what_to_listen_for || '')}</small></li>`).join('')}</ul>` : ''}
      ${Array.isArray(interviewDiscussionGuide.objection_probes) && interviewDiscussionGuide.objection_probes.length ? `<p><strong>Objection probes</strong></p><ul>${interviewDiscussionGuide.objection_probes.map(probe => `<li><strong>${escapeHtml(probe.objection || '우려')}</strong>: ${escapeHtml(probe.probe || '')}<br><small>${escapeHtml(probe.possible_fix_to_test || '')}</small></li>`).join('')}</ul>` : ''}
      ${interviewDiscussionGuide.pricing_probe ? `<small>Pricing: ${escapeHtml(interviewDiscussionGuide.pricing_probe)}</small>` : ''}
    </div>` : ''}
    ${validationSurvey ? `
    <div class="report-block">
      <h3>Validation Survey Instrument</h3>
      <p><strong>${escapeHtml(validationSurvey.estimated_length || '5-7 minutes')}</strong> · ${escapeHtml(validationSurvey.recommended_completes || '')}</p>
      <p>${escapeHtml(validationSurvey.objective || '')}</p>
      ${Array.isArray(validationSurvey.primary_metrics) && validationSurvey.primary_metrics.length ? `<p><strong>Metrics</strong></p><ul>${validationSurvey.primary_metrics.map(metric => `<li>${escapeHtml(metric)}</li>`).join('')}</ul>` : ''}
      ${validationSurvey.randomization_plan ? `<small>Randomization: ${escapeHtml(validationSurvey.randomization_plan.instruction || '')}</small>` : ''}
      ${Array.isArray(validationSurvey.question_blocks) && validationSurvey.question_blocks.length ? `<p><strong>Survey blocks</strong></p><ul>${validationSurvey.question_blocks.map(block => {
        const questions = Array.isArray(block.questions) ? block.questions : [];
        const first = questions[0] || {};
        return `<li><strong>${escapeHtml(block.block || 'block')}</strong>: ${escapeHtml(block.purpose || '')}<br><small>${escapeHtml(first.question || '')}</small></li>`;
      }).join('')}</ul>` : ''}
      ${Array.isArray(validationSurvey.pass_signals) && validationSurvey.pass_signals.length ? `<small>Pass: ${validationSurvey.pass_signals.map(escapeHtml).join(' · ')}</small>` : ''}
    </div>` : ''}
    ${messageAngleTests.length ? `
    <div class="report-block">
      <h3>Message Angle Tests</h3>
      <ul>${messageAngleTests.map(angle => `<li><strong>${escapeHtml(angle.label || 'Message test')}</strong> · ${escapeHtml(angle.audience || '')}<br>${escapeHtml(angle.headline || '')}<br><small>Show: ${escapeHtml(angle.evidence_to_show || '')} · Pass: ${escapeHtml(angle.pass_signal || '')}</small></li>`).join('')}</ul>
    </div>` : ''}
    ${experimentBacklog.length ? `
    <div class="report-block">
      <h3>Experiment Backlog</h3>
      <ul>${experimentBacklog.map(exp => `<li><strong>${escapeHtml(exp.priority || 'P1')} · ${escapeHtml(exp.experiment || 'Learning test')}</strong><br>${escapeHtml(exp.hypothesis || '')}<br><small>Pass: ${escapeHtml(exp.pass_threshold || '')}</small></li>`).join('')}</ul>
    </div>` : ''}
    ${nextRunBriefVariants.length ? `
    <div class="report-block">
      <h3>Next-run Brief Variants</h3>
      <ul>${nextRunBriefVariants.map(variant => `<li><strong>${escapeHtml(variant.title || variant.variant || 'Next-run variant')}</strong><br>${escapeHtml(variant.why || '')}<br><small>Focus: ${escapeHtml(variant.validation_focus || '')} · Pass: ${escapeHtml(variant.pass_signal || '')}</small></li>`).join('')}</ul>
    </div>` : ''}
    ${researchSprint ? `
    <div class="report-block sprint-plan">
      <h3>Research Sprint · ${escapeHtml(researchSprint.name || '5-day validation sprint')}</h3>
      <p>${escapeHtml(researchSprint.objective || '')}</p>
      <p><strong>Recruit:</strong> ${escapeHtml(researchSprint.recruiting_focus || '')}</p>
      <p><strong>Decision gate:</strong> ${escapeHtml(researchSprint.decision_gate || '')}</p>
      ${Array.isArray(researchSprint.day_plan) && researchSprint.day_plan.length ? `<ol class="sprint-days">${researchSprint.day_plan.map(day => `<li><strong>Day ${escapeHtml(day.day ?? '')} · ${escapeHtml(day.focus || '')}</strong><br><small>${escapeHtml(day.output || '')}</small>${Array.isArray(day.tasks) && day.tasks.length ? `<ul>${day.tasks.map(task => `<li>${escapeHtml(task)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ol>` : ''}
      ${Array.isArray(researchSprint.stop_conditions) && researchSprint.stop_conditions.length ? `<small>Stop: ${researchSprint.stop_conditions.map(escapeHtml).join(' · ')}</small>` : ''}
    </div>` : ''}
    <div class="report-block">
      <h3>Next Validation Questions</h3>
      <ul>${(report.next_validation_questions || []).map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>
    </div>
  `;
  tidyReportBlocks(reportEl);
}

async function askAnalystQuestion() {
  if (!lastResult || !activePersonas().length) return;
  const input = document.getElementById('analystQuestion');
  const button = document.getElementById('askAnalystButton');
  const question = (input.value.trim() || defaultAnalystQuestion()).trim();
  input.value = question;
  button.disabled = true;
  button.textContent = '페르소나 인터뷰 중...';
  setApiStatus('checking', 'Analyst Interviewing', '타깃 페르소나별 최대 5회 맞춤 질문 중');
  try {
    const response = await fetch('/api/analyst-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brief: collectBrief(),
        persona_reactions: activePersonas(),
        question,
        target_limit: 4,
        max_parallel_requests: 4,
        max_rounds: 5
      })
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const result = await response.json();
    if (result.error) throw new Error(result.message || result.error);
    lastAnalystResult = result;
    renderAnalystState();
    setMarkdownExport(buildResultMarkdown(collectBrief(), lastResult));
    const totalRounds = (result.conversations || []).reduce((sum, item) => sum + Number(item.round_count || 0), 0);
    setApiStatus('ready', 'Analyst Complete', `${result.target_personas?.length || 0}명 persona · ${totalRounds}회 질문 수합`);
    showLayer('analyst');
  } catch (error) {
    lastAnalystResult = {
      question,
      target_personas: [],
      conversations: [],
      synthesis: { summary: `분석가 질문 API가 실패했습니다: ${error.message || error}. 임시 답변으로 대체하지 않았습니다.` }
    };
    renderAnalystState();
    setApiStatus('error', 'Analyst Failed', '분석가 질문 API 확인 필요');
  } finally {
    button.disabled = !activePersonas().length;
    button.textContent = '분석가에게 질문하기';
  }
}

async function copyMarkdownReport() {
  if (!lastReportMarkdown) return;
  const button = document.getElementById('copyMarkdown');
  try {
    await navigator.clipboard.writeText(lastReportMarkdown);
    button.textContent = '복사됨';
  } catch (error) {
    const blob = new Blob([lastReportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'upkinsey-report.md';
    link.click();
    URL.revokeObjectURL(url);
    button.textContent = '다운로드됨';
  } finally {
    setTimeout(() => { button.textContent = 'Markdown 복사'; }, 1400);
  }
}

async function simulate() {
  const brief = collectBrief();
  const button = document.getElementById('runButton');
  button.disabled = true;
  button.textContent = '시뮬레이션 실행 중...';
  setApiStatus('checking', 'API Requesting', '입력 데이터를 Solar backend로 전송 중');
  updateRequestPreview();
  renderProgressModal({ status: 'queued', message: '시뮬레이션 작업 생성 중', completed: 0, total: brief.sample_size, percent: 0 });
  try {
    const response = await fetch('/api/simulate/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief)
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const job = await response.json();
    if (job.error) throw new Error(job.message || job.error);
    await pollSimulationJob(job.job_id, brief);
  } catch (error) {
    renderRunError(error);
    setApiStatus('error', 'API Failed', '임시 결과 없이 오류를 표시했습니다');
    renderProgressModal({ status: 'error', message: error.message || String(error), completed: 0, total: brief.sample_size, percent: 100 });
  } finally {
    button.disabled = false;
    button.textContent = '실제 API로 시뮬레이션 실행';
  }
}

async function sendPersonaMessage() {
  if (!lastResult) return;
  const input = document.getElementById('chatInput');
  const button = document.getElementById('chatSend');
  const message = input.value.trim();
  if (!message) return;

  const persona = activePersonas()[activePersonaIndex];
  const key = personaKey(persona);
  const history = personaChatHistories[key] || [];
  history.push({ role: 'user', content: message });
  personaChatHistories[key] = history;
  input.value = '';
  renderChat(history);

  button.disabled = true;
  button.textContent = '대화 중...';
  try {
    const response = await fetch('/api/persona-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brief: collectBrief(),
        persona,
        message,
        history: history.slice(-8)
      })
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const result = await response.json();
    if (result.error) throw new Error(result.message || result.error);
    history.push({ role: 'persona', content: result.reply || '조금 더 구체적으로 물어봐 주세요.' });
  } catch (error) {
    history.push({ role: 'persona', content: `API 요청이 실패했습니다: ${error.message || error}. 임시 답변으로 대체하지 않았습니다.` });
  } finally {
    button.disabled = false;
    button.textContent = '질문하기';
    renderChat(history);
  }
}

document.getElementById('runButton').addEventListener('click', simulate);
document.getElementById('chatSend').addEventListener('click', sendPersonaMessage);
document.getElementById('askAnalystButton').addEventListener('click', askAnalystQuestion);
document.getElementById('suggestAnalystQuestion').addEventListener('click', () => {
  document.getElementById('analystQuestion').value = defaultAnalystQuestion();
});
document.getElementById('copyMarkdown').addEventListener('click', copyMarkdownReport);
document.getElementById('refreshVersions').addEventListener('click', refreshVersionHistory);
document.getElementById('clearVersions').addEventListener('click', clearVersionHistory);
document.getElementById('openRequestModal').addEventListener('click', openRequestModal);
document.querySelectorAll('[data-report-section]').forEach(button => {
  button.addEventListener('click', () => {
    const blocks = document.querySelectorAll('#reportPreview .report-block');
    const target = blocks[Number(button.dataset.reportSection || 0)] || blocks[0];
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', event => {
  if (event.target.id === 'modalBackdrop') closeModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});
layerButtons.forEach(button => {
  button.addEventListener('click', () => showLayer(button.dataset.layer));
});
document.querySelectorAll('[data-next-layer]').forEach(button => {
  button.addEventListener('click', () => showLayer(button.dataset.nextLayer));
});
document.getElementById('chatInput').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendPersonaMessage();
  }
});
['productName', 'description', 'features', 'pricing', 'targetMarket', 'currentAlternatives', 'hypothesis', 'sampleSize', 'seed'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateRequestPreview);
});
renderEmptyState();
renderResearchTypeGuide();
updateRequestPreview();
checkApiHealth();
refreshVersionHistory();
