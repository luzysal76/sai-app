/**
 * 사이(Sai) — 별자리 궁합 UI 컨트롤러
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  let chipsInited = false;

  function init() {
    if (!chipsInited) { setupChips(); chipsInited = true; }
    setupDateInputs();
    $('#zodiacCalcBtn')?.addEventListener('click', calculate);
  }

  function setupChips() {
    const rels = window.HearimRelations?.getAll() || [];
    [1, 2].forEach(n => {
      const wrap = $(`#zodiacChips${n}`);
      if (!wrap || !rels.length) return;
      wrap.innerHTML = rels.slice(0, 6).map(r =>
        `<button class="chip zodiac-pchip" data-n="${n}" data-name="${r.name}">${r.emoji || '👤'} ${r.name}</button>`
      ).join('');
    });
    document.addEventListener('click', e => {
      const chip = e.target.closest('.zodiac-pchip');
      if (!chip) return;
      const n = chip.dataset.n;
      const inp = $(`#zodiacName${n}`);
      if (inp) inp.value = chip.dataset.name;
      $$(`[data-n="${n}"].zodiac-pchip`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  }

  function setupDateInputs() {
    [1, 2].forEach(n => {
      const mSel = $(`#zodiacMonth${n}`), dInp = $(`#zodiacDay${n}`);
      const preview = $(`#zodiacPreview${n}`);
      function updatePreview() {
        const m = parseInt(mSel?.value), d = parseInt(dInp?.value);
        if (!preview) return;
        if (m && d && d >= 1 && d <= 31) {
          const idx = window.SaiZodiac.getSign(m, d);
          const s = window.SaiZodiac.SIGNS[idx];
          preview.textContent = `${s.symbol} ${s.name}`;
          preview.style.opacity = '1';
        } else {
          preview.textContent = '';
          preview.style.opacity = '0';
        }
      }
      mSel?.addEventListener('change', updatePreview);
      dInp?.addEventListener('input', updatePreview);
    });
  }

  function calculate() {
    const m1 = parseInt($('#zodiacMonth1')?.value);
    const d1 = parseInt($('#zodiacDay1')?.value);
    const m2 = parseInt($('#zodiacMonth2')?.value);
    const d2 = parseInt($('#zodiacDay2')?.value);
    const name1 = $('#zodiacName1')?.value.trim() || '나';
    const name2 = $('#zodiacName2')?.value.trim() || '상대방';

    if (!m1 || !d1 || !m2 || !d2 || d1 < 1 || d1 > 31 || d2 < 1 || d2 > 31) {
      alert('두 사람의 생일(월/일)을 모두 입력해주세요.');
      return;
    }
    const result = window.SaiZodiac.calculate(m1, d1, m2, d2);
    const msg    = window.SaiZodiac.getMessage(result);
    renderResult(result, msg, name1, name2);
  }

  function signCard(sign, name) {
    return `
      <div class="zodiac-sign-card">
        <div class="zodiac-sign-symbol">${sign.symbol}</div>
        <div class="zodiac-sign-name">${sign.name}</div>
        <div class="zodiac-sign-dates">${sign.dates}</div>
        <div class="zodiac-sign-who">${name}</div>
        <div class="zodiac-sign-kws">
          ${sign.keyword.map(k => `<span class="zodiac-kw">${k}</span>`).join('')}
        </div>
      </div>
    `;
  }

  function renderResult(result, msg, name1, name2) {
    const { s1, s2, score, aspectLabel, ELEM_KR, ELEM_EMOJI } = result;
    const el = $('#zodiacResult');
    if (!el) return;

    const color = score >= 80 ? '#e2b33d' : score >= 65 ? '#7c3aed' : '#dc2626';
    const grade = score >= 88 ? '별들의 축복 ✨' : score >= 78 ? '운명적 인연 💫' : score >= 65 ? '성장하는 인연 🌱' : '도전적 인연 🔥';
    const C = 2 * Math.PI * 34;

    el.innerHTML = `
      <div class="zodiac-signs-row">
        ${signCard(s1, name1)}
        <div class="zodiac-signs-center">
          <div class="zodiac-aspect">${aspectLabel}</div>
          <div class="zodiac-stars">✦✦✦</div>
        </div>
        ${signCard(s2, name2)}
      </div>

      <div class="card zodiac-score-card">
        <div class="zodiac-sc-label">별자리 궁합 점수</div>
        <div class="zodiac-sc-ring">
          <svg viewBox="0 0 80 80" width="110" height="110">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(226,179,61,.15)" stroke-width="7"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke="${color}" stroke-width="7"
              stroke-dasharray="${C * score / 100} ${C}"
              stroke-linecap="round" transform="rotate(-90 40 40)"
              style="transition:stroke-dasharray 1.2s ease"/>
          </svg>
          <div class="zodiac-sc-num" style="color:${color}">${score}</div>
        </div>
        <div class="zodiac-sc-grade">${grade}</div>
        <div class="zodiac-elem-badges">
          <span class="zodiac-elem-badge">${ELEM_EMOJI[s1.element]} ${ELEM_KR[s1.element]}</span>
          <span class="zodiac-aspect-badge">${aspectLabel}</span>
          <span class="zodiac-elem-badge">${ELEM_EMOJI[s2.element]} ${ELEM_KR[s2.element]}</span>
        </div>
        <div class="zodiac-sc-summary">${msg.summary}</div>
      </div>

      <div class="card action-card">
        <span class="action-emoji">💫</span>
        <div>
          <span class="action-label">이 관계의 강점</span>
          <p>${msg.strength}</p>
        </div>
      </div>

      <div class="card zodiac-caution-card">
        <div class="zodiac-caution-head">⚠️ <span>주의할 점</span></div>
        <p>${msg.caution}</p>
      </div>

      <div class="card tip-card">
        <span class="tip-emoji">🔭</span>
        <p>${msg.tip}</p>
      </div>

      <div class="zodiac-traits-row">
        ${traitCard(s1, name1)}
        ${traitCard(s2, name2)}
      </div>

      <button class="btn-primary zodiac-retry-btn" id="zodiacRetryBtn">🌟 다시 분석하기</button>
    `;

    el.classList.remove('hidden');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    $('#zodiacRetryBtn')?.addEventListener('click', () => {
      el.classList.add('hidden');
      $('section#page-zodiac')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function traitCard(sign, name) {
    return `
      <div class="zodiac-trait-card">
        <div class="zodiac-trait-sym">${sign.symbol}</div>
        <div class="zodiac-trait-name">${name}</div>
        <div class="zodiac-trait-desc">${sign.trait}</div>
      </div>
    `;
  }

  window.HU = window.HU || {};
  window.HU._initZodiac = init;
})();
