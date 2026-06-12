/**
 * 사이(Sai) — 관계 타임머신 UI 컨트롤러
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  let selectedPersonId   = null;
  let selectedPersonName = '';

  function init() {
    renderPersonChips();
    bindQChips();
    bindAnalyzeBtn();
  }

  /** 관계 지도에서 인물 칩 렌더링 */
  function renderPersonChips() {
    const container = $('#tmPersonChips');
    if (!container) return;
    const relations = window.HearimRelations?.getAll() || [];

    if (!relations.length) {
      container.innerHTML = '<span class="tm-chips-empty">관계 지도에 사람을 추가하면 여기서 선택할 수 있어요</span>';
      return;
    }

    container.innerHTML = '';
    relations.forEach(rel => {
      const btn = document.createElement('button');
      btn.className = 'chip tm-chip';
      btn.dataset.id   = rel.id;
      btn.dataset.name = rel.name;
      btn.textContent  = `${rel.emoji || '🧑'} ${rel.name}`;
      btn.addEventListener('click', () => {
        $$('.tm-chip', container).forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        selectedPersonId   = rel.id;
        selectedPersonName = rel.name;
        const inp = $('#tmPersonInput');
        if (inp) inp.value = '';
      });
      container.appendChild(btn);
    });
  }

  /** 예시 질문 칩 클릭 */
  function bindQChips() {
    $$('.tm-q-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const ta = $('#tmQuestion');
        if (ta) ta.value = btn.dataset.q || '';
      });
    });

    // 직접 이름 입력 시 칩 선택 해제
    const inp = $('#tmPersonInput');
    inp?.addEventListener('input', () => {
      selectedPersonId   = null;
      selectedPersonName = (inp.value || '').trim();
      $$('.tm-chip').forEach(c => c.classList.remove('active'));
    });
  }

  /** 분석 버튼 */
  function bindAnalyzeBtn() {
    $('#tmAnalyzeBtn')?.addEventListener('click', runAnalysis);
  }

  function runAnalysis() {
    const name     = selectedPersonName || ($('#tmPersonInput')?.value || '').trim();
    const question = ($('#tmQuestion')?.value || '').trim();

    if (!name) {
      const inp = $('#tmPersonInput');
      inp?.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:250});
      inp?.focus();
      return;
    }

    const stats   = window.SaiTimemachine.getMonthlyStats(selectedPersonId, name, 6);
    const trend   = window.SaiTimemachine.analyzeTrend(stats);
    const insight = window.SaiTimemachine.generateInsight(question || `${name}와의 관계는 어떤가요?`, name, trend);

    const isDemo     = !trend.hasData;
    const showStats  = isDemo ? window.SaiTimemachine.getDemoStats() : stats;

    renderResult(name, question, showStats, trend, insight, isDemo);
  }

  /** 결과 렌더링 */
  function renderResult(name, question, stats, trend, insight, isDemo) {
    const resultEl = $('#tmResult');
    if (!resultEl) return;

    // ── 막대 차트 ──
    const max = Math.max(1, ...stats.map(m => m.activityCount));
    const chartHtml = stats.map(m => {
      const pct   = Math.round((m.activityCount / max) * 100);
      const color = m.avgMood === null  ? '#8b6fcf' :
                    m.avgMood >= 4       ? '#41c46e' :
                    m.avgMood >= 3       ? '#4a9eff' : '#ff6b6b';
      return `
        <div class="tm-bar-item">
          <div class="tm-bar-track">
            <div class="tm-bar-fill" style="height:${Math.max(4, pct)}%;background:${color}"></div>
          </div>
          <div class="tm-bar-label">${m.monthLabel}</div>
          ${m.activityCount > 0 ? `<div class="tm-bar-count">${m.activityCount}</div>` : ''}
        </div>`;
    }).join('');

    // ── 트렌드 뱃지 ──
    const badges = [];
    if (trend.contactTrend === 'down')     badges.push({ icon:'📉', text:'연락 감소', c:'#ff6b6b' });
    else if (trend.contactTrend === 'up')  badges.push({ icon:'📈', text:'연락 증가', c:'#41c46e' });
    else                                   badges.push({ icon:'➡️', text:'연락 유지', c:'#4a9eff' });

    if (trend.moodTrend === 'down')        badges.push({ icon:'😔', text:'감정 하락', c:'#ff6b6b' });
    else if (trend.moodTrend === 'up')     badges.push({ icon:'😊', text:'감정 상승', c:'#41c46e' });

    if (trend.totalConflicts > 0)          badges.push({ icon:'⚡', text:`갈등 ${trend.totalConflicts}회`, c:'#ffaa00' });
    if (trend.totalMilestones > 0)         badges.push({ icon:'⭐', text:`특별한 날 ${trend.totalMilestones}회`, c:'#a06bff' });

    const badgesHtml = badges.map(b => `
      <div class="tm-badge" style="border-color:${b.c}30;color:${b.c}">
        <span>${b.icon}</span><span>${b.text}</span>
      </div>`).join('');

    // ── 최근 이벤트 ──
    const eventsHtml = trend.recentEvents.length
      ? trend.recentEvents.map(e => `
          <div class="tm-event-item">
            <span class="tm-event-emoji">${e.emoji || '📌'}</span>
            <div>
              <div class="tm-event-title">${e.title}</div>
              <div class="tm-event-date">${e.date}</div>
            </div>
          </div>`).join('')
      : '<p class="tm-no-events">최근 이벤트가 없어요. 타임라인에 기록을 남겨보세요.</p>';

    resultEl.innerHTML = `
      ${isDemo ? '<div class="tm-demo-notice">💡 아직 기록이 없어요 — 아래는 예시예요. 일기·타임라인에 기록하면 실제 분석이 시작돼요!</div>' : ''}

      <div class="card tm-chart-card">
        <div class="tm-section-title">📊 ${name}와의 6개월 교류 흐름</div>
        <div class="tm-bar-chart">${chartHtml}</div>
        <div class="tm-legend">
          <span style="color:#41c46e">● 좋은 감정</span>
          <span style="color:#4a9eff">● 보통</span>
          <span style="color:#ff6b6b">● 힘든 감정</span>
          <span style="color:#8b6fcf">● 기록 없음</span>
        </div>
      </div>

      <div class="card">
        <div class="tm-section-title">🔍 패턴 요약</div>
        <div class="tm-badge-row">${badgesHtml}</div>
      </div>

      ${trend.recentEvents.length ? `
      <div class="card">
        <div class="tm-section-title">📌 최근 주요 기록</div>
        <div class="tm-events-list">${eventsHtml}</div>
      </div>` : ''}

      <div class="card tm-insight-card">
        ${question ? `<div class="tm-insight-q">"${question}"</div>` : ''}
        <div class="tm-insight-body">
          <span class="tm-insight-icon">💡</span>
          <p class="tm-insight-text">${insight.answer}</p>
        </div>
        ${insight.patterns.length > 1 ? `
          <ul class="tm-pattern-list">
            ${insight.patterns.map(p => `<li>• ${p}</li>`).join('')}
          </ul>` : ''}
      </div>
    `;

    resultEl.classList.remove('hidden');
    setTimeout(() => resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  // app.js 의 showPage('timemachine') 에서 호출
  window.HU = window.HU || {};
  window.HU._initTimemachine = init;
})();
