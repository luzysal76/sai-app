/**
 * 사이(Sai) — DISC 소통 유형 UI 컨트롤러
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  const KEYS = ['D', 'I', 'S', 'C'];
  let answers = [];
  let currentQ = 0;

  function init() {
    answers = []; currentQ = 0;
    $('#discResult')?.classList.add('hidden');
    $('#discQuiz')?.classList.add('hidden');
    $('#discIntro')?.classList.remove('hidden');
    $('#discStartBtn')?.addEventListener('click', startQuiz);
  }

  function startQuiz() {
    $('#discIntro')?.classList.add('hidden');
    $('#discQuiz')?.classList.remove('hidden');
    showQuestion(0);
  }

  function showQuestion(idx) {
    const Q = window.SaiDisc.QUESTIONS;
    const T = window.SaiDisc.TYPES;
    const q = Q[idx];
    const total = Q.length;

    const fill = $('#discProgressFill'), label = $('#discProgressLabel');
    if (fill) fill.style.width = `${(idx / total) * 100}%`;
    if (label) label.textContent = `${idx + 1} / ${total}`;
    const numEl = $('#discQNum');
    if (numEl) numEl.textContent = `Q${idx + 1}`;

    const area = $('#discChoiceArea');
    if (!area) return;
    area.style.cssText = 'opacity:0;transform:translateY(8px);transition:none';
    area.innerHTML = `
      <div class="disc-q-text">${q.q}</div>
      <div class="disc-choices">
        ${KEYS.map(k => `
          <button class="disc-choice-btn disc-${k}" data-key="${k}">
            <span class="disc-type-badge" style="background:${T[k].color}">${k}</span>
            <span class="disc-choice-text">${q[k]}</span>
          </button>
        `).join('')}
      </div>
    `;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      area.style.cssText = 'opacity:1;transform:translateY(0);transition:opacity .28s,transform .28s';
    }));
    area.querySelectorAll('.disc-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => selectAnswer(idx, btn.dataset.key));
    });
  }

  function selectAnswer(idx, key) {
    answers[idx] = key;
    const area = $('#discChoiceArea');
    area?.querySelectorAll('.disc-choice-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.key === key);
      btn.disabled = true;
    });
    const total = window.SaiDisc.QUESTIONS.length;
    const fill = $('#discProgressFill');
    if (fill) fill.style.width = `${((idx + 1) / total) * 100}%`;
    if (idx + 1 < total) {
      setTimeout(() => { currentQ = idx + 1; showQuestion(currentQ); }, 380);
    } else {
      setTimeout(showResult, 420);
    }
  }

  function showResult() {
    $('#discQuiz')?.classList.add('hidden');
    const el = $('#discResult');
    if (!el) return;

    const { counts, primary, secondary } = window.SaiDisc.calcResult(answers);
    const T = window.SaiDisc.TYPES;
    const t = T[primary];
    const max = window.SaiDisc.QUESTIONS.length;

    function barW(k) { return Math.round(counts[k] / max * 100); }

    el.innerHTML = `
      <div class="card disc-result-header" style="border-color:${t.color}30">
        <div class="disc-result-em">${t.emoji}</div>
        <div class="disc-result-badge" style="background:${t.color};color:#fff">${primary} · ${t.name}</div>
        <div class="disc-result-desc">${t.desc}</div>
        <div class="disc-kw-row">
          ${t.keyword.map(k => `<span class="disc-kw" style="background:${t.bg};color:${t.color}">#${k}</span>`).join('')}
        </div>
      </div>

      <div class="card disc-bars-card">
        <div class="disc-bars-title">📊 DISC 유형 분석</div>
        ${KEYS.map(k => `
          <div class="disc-bar-row">
            <span class="disc-bar-badge" style="background:${T[k].color}">${k}</span>
            <span class="disc-bar-name">${T[k].name}</span>
            <div class="disc-bar-track">
              <div class="disc-bar-fill" style="width:${barW(k)}%;background:${T[k].color};
                transition:width 1s ease ${KEYS.indexOf(k) * 0.15}s"></div>
            </div>
            <span class="disc-bar-score" style="color:${T[k].color}">${counts[k]}/${max}</span>
          </div>
        `).join('')}
        <div class="disc-secondary">보조 유형: ${T[secondary].emoji} <strong>${secondary} · ${T[secondary].name}</strong></div>
      </div>

      <div class="card" style="background:${t.bg};border:1.5px solid ${t.color}20">
        <div class="disc-sw-row">
          <div><div class="disc-sw-head" style="color:${t.color}">💪 강점</div><p>${t.strength}</p></div>
          <div><div class="disc-sw-head" style="color:#f43f5e">⚠️ 주의점</div><p>${t.weakness}</p></div>
        </div>
      </div>

      <div class="card action-card">
        <span class="action-emoji">💕</span>
        <div><span class="action-label">연애 스타일</span><p>${t.love}</p></div>
      </div>

      <!-- 파트너 궁합 -->
      <div class="card disc-partner-card">
        <div class="disc-partner-title">🔗 파트너 유형으로 궁합 보기</div>
        <div class="disc-partner-picks" id="discPartnerPicks">
          ${KEYS.map(k => `
            <button class="disc-partner-btn" data-ptype="${k}"
              style="border-color:${T[k].color}40;color:${T[k].color}">
              ${T[k].emoji}<br><strong>${k}</strong><br><span>${T[k].name}</span>
            </button>
          `).join('')}
        </div>
        <div class="disc-compat-result hidden" id="discCompatResult"></div>
      </div>

      <button class="btn-primary disc-retry-btn" id="discRetryBtn">🔄 다시 하기</button>
    `;

    el.classList.remove('hidden');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    // 파트너 궁합 선택
    $$('#discPartnerPicks .disc-partner-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#discPartnerPicks .disc-partner-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const pt = btn.dataset.ptype;
        const { score, note } = window.SaiDisc.getCompat(primary, pt);
        const compatEl = $('#discCompatResult');
        const scoreColor = score >= 85 ? '#f59e0b' : score >= 78 ? '#10b981' : score >= 68 ? '#6366f1' : '#f43f5e';
        compatEl.innerHTML = `
          <div class="disc-compat-inner" style="border-color:${scoreColor}30">
            <div class="disc-compat-score" style="color:${scoreColor}">${score}점</div>
            <div class="disc-compat-note">${note}</div>
          </div>
        `;
        compatEl.classList.remove('hidden');
      });
    });

    $('#discRetryBtn')?.addEventListener('click', () => {
      el.classList.add('hidden');
      answers = []; currentQ = 0;
      $('#discIntro')?.classList.remove('hidden');
      $('section#page-disc')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  window.HU = window.HU || {};
  window.HU._initDisc = init;
})();
