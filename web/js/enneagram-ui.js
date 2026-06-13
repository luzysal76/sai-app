/**
 * 사이(Sai) — 에니어그램 궁합 UI 컨트롤러
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  let sel1 = null, sel2 = null;

  function init() {
    sel1 = null; sel2 = null;
    renderTypePicker('ennPicker1', 1);
    renderTypePicker('ennPicker2', 2);
    $('#ennCalcBtn')?.addEventListener('click', calculate);
    $('#ennResultArea')?.classList.add('hidden');
  }

  function renderTypePicker(containerId, slot) {
    const wrap = $(`#${containerId}`);
    if (!wrap) return;
    const T = window.SaiEnneagram.TYPES;
    wrap.innerHTML = T.map(t => `
      <button class="enn-num-btn" data-slot="${slot}" data-n="${t.n}"
        style="--center-color:${window.SaiEnneagram.CENTER_COLOR[t.center]}">
        <span class="enn-num">${t.n}</span>
        <span class="enn-num-name">${t.name}</span>
      </button>
    `).join('');

    wrap.querySelectorAll('.enn-num-btn').forEach(btn => {
      btn.addEventListener('click', () => selectType(slot, parseInt(btn.dataset.n), btn));
    });
  }

  function selectType(slot, n, btn) {
    const pickerId = slot === 1 ? 'ennPicker1' : 'ennPicker2';
    $$(`#${pickerId} .enn-num-btn`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (slot === 1) sel1 = n; else sel2 = n;
    showPreview(slot, n);
    updateCalcBtn();
  }

  function showPreview(slot, n) {
    const T = window.SaiEnneagram.TYPES[n - 1];
    const previewId = slot === 1 ? 'ennPreview1' : 'ennPreview2';
    const el = $(`#${previewId}`);
    if (!el) return;
    const CC = window.SaiEnneagram.CENTER_COLOR;
    const CB = window.SaiEnneagram.CENTER_BG;
    const CK = window.SaiEnneagram.CENTER_KR;
    el.innerHTML = `
      <div class="enn-preview-inner">
        <div class="enn-preview-em">${T.emoji}</div>
        <div class="enn-preview-name">${T.n}번 ${T.name}</div>
        <div class="enn-center-badge"
          style="background:${CB[T.center]};color:${CC[T.center]};border-color:${CC[T.center]}40">
          ${CK[T.center]}
        </div>
        <div class="enn-preview-desc">${T.desc}</div>
        <div class="enn-kw-row">${T.keyword.map(k =>
          `<span class="enn-kw" style="background:${CB[T.center]};color:${CC[T.center]}">#${k}</span>`
        ).join('')}</div>
      </div>
    `;
    el.classList.remove('hidden');
  }

  function updateCalcBtn() {
    const btn = $('#ennCalcBtn');
    if (!btn) return;
    btn.disabled = !(sel1 && sel2);
    btn.style.opacity = (sel1 && sel2) ? '1' : '0.5';
  }

  function calculate() {
    if (!sel1 || !sel2) return;
    const { score, note, sameCenter, level } = window.SaiEnneagram.calcCompat(sel1, sel2);
    const T1 = window.SaiEnneagram.TYPES[sel1 - 1];
    const T2 = window.SaiEnneagram.TYPES[sel2 - 1];
    const CC = window.SaiEnneagram.CENTER_COLOR;

    const resultEl = $('#ennResultArea');
    if (!resultEl) return;

    const r = 42, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;

    resultEl.innerHTML = `
      <div class="card enn-result-header">
        <div class="enn-ring-wrap">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="${r}" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="9"/>
            <circle cx="55" cy="55" r="${r}" fill="none" stroke="${level.color}" stroke-width="9"
              stroke-linecap="round" stroke-dasharray="${dash} ${circ}"
              transform="rotate(-90 55 55)"
              style="transition:stroke-dasharray 1s ease"/>
          </svg>
          <div class="enn-ring-score" style="color:${level.color}">${score}</div>
        </div>
        <div class="enn-result-pair">
          <span style="color:${CC[T1.center]}">${T1.emoji} ${T1.n}번 ${T1.name}</span>
          <span class="enn-heart">💕</span>
          <span style="color:${CC[T2.center]}">${T2.emoji} ${T2.n}번 ${T2.name}</span>
        </div>
        <div class="enn-level-badge" style="background:${level.color}18;color:${level.color};border-color:${level.color}40">
          ${level.label}
        </div>
      </div>

      <div class="card enn-note-card">
        <div class="enn-note-head">💡 궁합 분석</div>
        <p class="enn-note-body">${note}</p>
        ${sameCenter ? `<div class="enn-same-center">같은 에너지 센터(${window.SaiEnneagram.CENTER_KR[T1.center]}) — 서로를 직관적으로 이해해요</div>` : ''}
      </div>

      <div class="enn-two-col">
        <div class="card enn-type-mini" style="border-color:${CC[T1.center]}30">
          <div class="enn-tm-num" style="color:${CC[T1.center]}">${T1.n}</div>
          <div class="enn-tm-name">${T1.name}</div>
          <div class="enn-tm-growth">성장 → ${window.SaiEnneagram.TYPES[T1.growth - 1].name}</div>
        </div>
        <div class="card enn-type-mini" style="border-color:${CC[T2.center]}30">
          <div class="enn-tm-num" style="color:${CC[T2.center]}">${T2.n}</div>
          <div class="enn-tm-name">${T2.name}</div>
          <div class="enn-tm-growth">성장 → ${window.SaiEnneagram.TYPES[T2.growth - 1].name}</div>
        </div>
      </div>

      <div class="card tip-card">
        <span class="tip-emoji">🌱</span>
        <p>에니어그램은 서로를 판단하는 도구가 아니라 이해하는 도구예요. 다름을 발견했다면 그게 바로 성장의 기회예요.</p>
      </div>

      <button class="btn-primary enn-retry-btn" id="ennRetryBtn">🔄 다시 선택하기</button>
    `;

    resultEl.classList.remove('hidden');
    setTimeout(() => resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    $('#ennRetryBtn')?.addEventListener('click', () => {
      resultEl.classList.add('hidden');
      sel1 = null; sel2 = null;
      $$('.enn-num-btn').forEach(b => b.classList.remove('active'));
      $$('#ennPreview1, #ennPreview2').forEach(el => { el.innerHTML = ''; el.classList.add('hidden'); });
      updateCalcBtn();
      $('section#page-enneagram')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  window.HU = window.HU || {};
  window.HU._initEnneagram = init;
})();
