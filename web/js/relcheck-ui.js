/**
 * 사이(Sai) — 관계 건강 체크 UI 컨트롤러
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  const LABELS = ['😞', '😕', '😐', '😊', '😍'];

  function init() {
    const wrap = $('#relcheckForm');
    if (!wrap) return;
    $('#relcheckResult')?.classList.add('hidden');
    wrap.classList.remove('hidden');
    renderForm(wrap);
    $('#relcheckSubmitBtn')?.addEventListener('click', submit);
  }

  function renderForm(wrap) {
    const { DIMS } = window.SaiRelCheck;
    wrap.innerHTML = `
      ${DIMS.map(d => `
        <div class="card rc-dim-card" data-key="${d.key}">
          <div class="rc-dim-head">
            <span class="rc-dim-em">${d.emoji}</span>
            <span class="rc-dim-name" style="color:${d.color}">${d.name}</span>
          </div>
          <p class="rc-dim-q">${d.q}</p>
          <div class="rc-stars" data-key="${d.key}">
            ${[1,2,3,4,5].map(v => `
              <button class="rc-star-btn" data-val="${v}" data-dkey="${d.key}">
                <span class="rc-star-face">${LABELS[v-1]}</span>
                <span class="rc-star-num">${v}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <button class="btn-primary rc-submit-btn hidden" id="relcheckSubmitBtn">💕 관계 건강 리포트 보기</button>
    `;

    // 별점 선택 이벤트
    $$('.rc-star-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.dkey, val = parseInt(btn.dataset.val);
        $$(`[data-dkey="${key}"]`).forEach(b => {
          b.classList.toggle('selected', parseInt(b.dataset.val) <= val);
          b.classList.toggle('exact', parseInt(b.dataset.val) === val);
        });
        // 카드에 선택 값 저장
        const card = $(`.rc-dim-card[data-key="${key}"]`);
        if (card) card.dataset.score = val;
        checkAllSelected();
      });
    });
  }

  function checkAllSelected() {
    const { DIMS } = window.SaiRelCheck;
    const allDone = DIMS.every(d => {
      const card = $(`.rc-dim-card[data-key="${d.key}"]`);
      return card?.dataset.score;
    });
    const btn = $('#relcheckSubmitBtn');
    if (btn) {
      btn.classList.toggle('hidden', !allDone);
    }
  }

  function submit() {
    const { DIMS, calcResult, getTip, overallLabel, buildSVG } = window.SaiRelCheck;
    const scores = {};
    let allDone = true;
    DIMS.forEach(d => {
      const card = $(`.rc-dim-card[data-key="${d.key}"]`);
      const v = parseInt(card?.dataset.score || 0);
      if (!v) { allDone = false; return; }
      scores[d.key] = v;
    });
    if (!allDone) return;

    const { avg, weakest, strongest } = calcResult(scores);
    const overall = overallLabel(avg);

    const resultEl = $('#relcheckResult');
    if (!resultEl) return;

    resultEl.innerHTML = `
      <div class="card rc-result-header">
        <div class="rc-overall-label" style="color:${overall.color}">${overall.label}</div>
        <div class="rc-avg-score" style="color:${overall.color}">${avg.toFixed(1)} <span>/ 5</span></div>
        ${buildSVG(scores)}
      </div>

      <div class="card rc-scores-card">
        <div class="rc-scores-title">📊 차원별 점수</div>
        ${DIMS.map(d => `
          <div class="rc-score-row">
            <span class="rc-sc-em">${d.emoji}</span>
            <span class="rc-sc-name">${d.name}</span>
            <div class="rc-sc-track">
              <div class="rc-sc-fill" style="width:${scores[d.key]/5*100}%;background:${d.color};
                transition:width 1s ease ${DIMS.indexOf(d)*0.12}s"></div>
            </div>
            <span class="rc-sc-num" style="color:${d.color}">${scores[d.key]}/5</span>
          </div>
        `).join('')}
      </div>

      <div class="card rc-weak-card" style="border-color:${weakest.color}30">
        <div class="rc-weak-head">
          <span>${weakest.emoji}</span>
          <span style="color:${weakest.color};font-weight:800">${weakest.name} 케어 포인트</span>
        </div>
        <p>${getTip(weakest.key, scores[weakest.key])}</p>
      </div>

      <div class="card rc-strong-card" style="border-color:${strongest.color}30">
        <div class="rc-strong-head">
          <span>${strongest.emoji}</span>
          <span style="color:${strongest.color};font-weight:800">${strongest.name}이 관계의 강점이에요</span>
        </div>
        <p>${getTip(strongest.key, scores[strongest.key])}</p>
      </div>

      <div class="card tip-card">
        <span class="tip-emoji">🌿</span>
        <p>관계는 꺾이는 것이 아니라 자라는 거예요. 오늘 체크한 약점 하나만 집중해서 이번 주에 실천해보세요.</p>
      </div>

      <button class="btn-primary rc-retry-btn" id="rcRetryBtn">🔄 다시 체크하기</button>
    `;

    resultEl.classList.remove('hidden');
    $('#relcheckForm')?.classList.add('hidden');
    setTimeout(() => resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    $('#rcRetryBtn')?.addEventListener('click', () => {
      resultEl.classList.add('hidden');
      const wrap = $('#relcheckForm');
      if (wrap) { wrap.classList.remove('hidden'); renderForm(wrap); }
      $('section#page-relcheck')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  window.HU = window.HU || {};
  window.HU._initRelCheck = init;
})();
