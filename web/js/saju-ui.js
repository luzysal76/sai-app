/**
 * 사이(Sai) — 사주 궁합 UI 컨트롤러
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  let chipsInited = false;

  function init() {
    if (!chipsInited) { renderPersonChips(); chipsInited = true; }
    $('#sajuCalcBtn')?.addEventListener('click', calculate);
  }

  function renderPersonChips() {
    const rels = window.HearimRelations?.getAll() || [];
    [1, 2].forEach(n => {
      const wrap = $(`#sajuChips${n}`);
      if (!wrap || !rels.length) return;
      wrap.innerHTML = rels.slice(0, 6).map(r =>
        `<button class="chip saju-pchip" data-n="${n}" data-name="${r.name}">${r.emoji || '👤'} ${r.name}</button>`
      ).join('');
    });
    document.addEventListener('click', e => {
      const chip = e.target.closest('.saju-pchip');
      if (!chip) return;
      const n = chip.dataset.n;
      const inp = $(`#sajuName${n}`);
      if (inp) inp.value = chip.dataset.name;
      $$(`[data-n="${n}"].saju-pchip`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  }

  function calculate() {
    const year1  = parseInt($('#sajuYear1')?.value);
    const month1 = parseInt($('#sajuMonth1')?.value);
    const year2  = parseInt($('#sajuYear2')?.value);
    const month2 = parseInt($('#sajuMonth2')?.value);
    const name1  = ($('#sajuName1')?.value.trim()) || '나';
    const name2  = ($('#sajuName2')?.value.trim()) || '상대방';

    if (!year1 || !month1 || !year2 || !month2 || year1 < 1930 || year2 < 1930) {
      alert('두 사람의 출생 연도(1930 이후)와 월을 모두 입력해주세요.');
      return;
    }
    const result = window.SaiSaju.calculate(year1, month1, year2, month2);
    const msg    = window.SaiSaju.getMessage(result);
    renderResult(result, msg, name1, name2);
  }

  function pillarCard(p, name, elem, E) {
    const e = E[elem];
    return `
      <div class="saju-pcard">
        <div class="saju-pcard-name">${name}</div>
        <div class="saju-pcard-elem" style="background:${e.bg};color:${e.color};border-color:${e.color}40">${e.emoji} ${e.name}</div>
        <div class="saju-pcard-cols">
          <div class="saju-pcol">
            <div class="saju-pcol-hanzi">${p.yearStem.hanzi}${p.yearBranch.hanzi}</div>
            <div class="saju-pcol-kor">${p.yearStem.name}${p.yearBranch.name}</div>
            <div class="saju-pcol-tag">연주(年柱)</div>
          </div>
          <div class="saju-pcol">
            <div class="saju-pcol-hanzi">${p.monthStem.hanzi}${p.monthBranch.hanzi}</div>
            <div class="saju-pcol-kor">${p.monthStem.name}${p.monthBranch.name}</div>
            <div class="saju-pcol-tag">월주(月柱)</div>
          </div>
        </div>
        <div class="saju-pcard-animal">${p.yearBranch.animal} ${p.yearBranch.animalName}띠</div>
      </div>
    `;
  }

  function elemCard(elem, name, E) {
    const e = E[elem];
    return `
      <div class="saju-ecard" style="border-color:${e.color}25;background:${e.bg}">
        <div class="saju-ecard-em">${e.emoji}</div>
        <div class="saju-ecard-name" style="color:${e.color}">${e.name}</div>
        <div class="saju-ecard-who">${name}</div>
        <div class="saju-ecard-meaning">${e.meaning}</div>
      </div>
    `;
  }

  function renderResult(result, msg, name1, name2) {
    const { p1, p2, e1, e2, score, label, ELEMENTS: E } = result;
    const el = $('#sajuResult');
    if (!el) return;

    const color = score >= 80 ? '#b8860b' : score >= 65 ? '#16a34a' : '#dc2626';
    const grade = score >= 85 ? '천생연분 ✨' : score >= 75 ? '좋은 인연 💕' : score >= 60 ? '노력형 인연 🌱' : '도전적 인연 🔥';
    const C = 2 * Math.PI * 34;

    el.innerHTML = `
      <div class="saju-result-pillars">
        ${pillarCard(p1, name1, e1, E)}
        <div class="saju-pillars-vs">天<br><span>命</span></div>
        ${pillarCard(p2, name2, e2, E)}
      </div>

      <div class="card saju-score-card">
        <div class="saju-sc-label">오행 궁합 점수</div>
        <div class="saju-sc-ring">
          <svg viewBox="0 0 80 80" width="110" height="110">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="7"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke="${color}" stroke-width="7"
              stroke-dasharray="${C * score / 100} ${C}"
              stroke-linecap="round" transform="rotate(-90 40 40)"
              style="transition:stroke-dasharray 1.2s ease"/>
          </svg>
          <div class="saju-sc-num" style="color:${color}">${score}</div>
        </div>
        <div class="saju-sc-grade">${grade}</div>
        <div class="saju-sc-rel">${label}</div>
        <div class="saju-sc-summary">${msg.summary}</div>
      </div>

      <div class="card action-card">
        <span class="action-emoji">💪</span>
        <div>
          <span class="action-label">이 관계의 강점</span>
          <p>${msg.strength}</p>
        </div>
      </div>

      <div class="card saju-caution-card">
        <div class="saju-caution-head">⚠️ <span>주의할 점</span></div>
        <p>${msg.caution}</p>
      </div>

      <div class="card tip-card">
        <span class="tip-emoji">💡</span>
        <p>${msg.tip}</p>
      </div>

      <div class="saju-elem-row">
        ${elemCard(e1, name1, E)}
        ${elemCard(e2, name2, E)}
      </div>

      <button class="btn-primary saju-retry-btn" id="sajuRetryBtn">🏮 다시 계산하기</button>
    `;

    el.classList.remove('hidden');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    $('#sajuRetryBtn')?.addEventListener('click', () => {
      el.classList.add('hidden');
      $('section#page-saju')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  window.HU = window.HU || {};
  window.HU._initSaju = init;
})();
