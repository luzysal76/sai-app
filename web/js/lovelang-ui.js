/**
 * 사이(Sai) — 사랑의 언어 테스트 UI 컨트롤러
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);

  let choices = [];
  let currentQ = 0;

  function init() {
    choices = []; currentQ = 0;
    $('#lovelangResult')?.classList.add('hidden');
    $('#lovelangQuiz')?.classList.add('hidden');
    $('#lovelangIntro')?.classList.remove('hidden');
    $('#lovelangStartBtn')?.addEventListener('click', startQuiz);
  }

  function startQuiz() {
    $('#lovelangIntro')?.classList.add('hidden');
    $('#lovelangQuiz')?.classList.remove('hidden');
    showQuestion(0);
  }

  function showQuestion(idx) {
    const Q = window.SaiLoveLang.QUESTIONS;
    const total = Q.length;
    const q = Q[idx];

    // 진행바
    const fill = $('#llProgressFill'), label = $('#llProgressLabel');
    if (fill) fill.style.width = `${(idx / total) * 100}%`;
    if (label) label.textContent = `${idx + 1} / ${total}`;

    // 번호
    const numEl = $('#llQNum');
    if (numEl) numEl.textContent = `Q${idx + 1}`;

    // A/B 카드 렌더
    const area = $('#llChoiceArea');
    if (!area) return;
    area.style.cssText = 'opacity:0;transform:translateY(10px);transition:none';
    area.innerHTML = `
      <button class="ll-choice-card" data-choice="a">
        <span class="ll-choice-label">A</span>
        <span class="ll-choice-text">${q.a.text}</span>
      </button>
      <div class="ll-or">VS</div>
      <button class="ll-choice-card" data-choice="b">
        <span class="ll-choice-label">B</span>
        <span class="ll-choice-text">${q.b.text}</span>
      </button>
    `;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      area.style.cssText = 'opacity:1;transform:translateY(0);transition:opacity .3s,transform .3s';
    }));

    area.querySelectorAll('.ll-choice-card').forEach(btn => {
      btn.addEventListener('click', () => selectAnswer(idx, btn.dataset.choice));
    });
  }

  function selectAnswer(idx, choice) {
    choices[idx] = choice;

    // 선택 시각 피드백
    const area = $('#llChoiceArea');
    area?.querySelectorAll('.ll-choice-card').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.choice === choice);
      btn.disabled = true;
    });

    const total = window.SaiLoveLang.QUESTIONS.length;
    const fill = $('#llProgressFill');
    if (fill) fill.style.width = `${((idx + 1) / total) * 100}%`;

    if (idx + 1 < total) {
      setTimeout(() => { currentQ = idx + 1; showQuestion(currentQ); }, 400);
    } else {
      setTimeout(showResult, 450);
    }
  }

  function showResult() {
    $('#lovelangQuiz')?.classList.add('hidden');
    const el = $('#lovelangResult');
    if (!el) return;

    const { counts, primary, secondary } = window.SaiLoveLang.calcResult(choices);
    const L = window.SaiLoveLang.LANGS;
    const D = window.SaiLoveLang.DETAILS;
    const t = L[primary], d = D[primary];
    const max = 4; // each language appears 4 times max

    function barW(k) { return Math.round(counts[k] / max * 100); }

    el.innerHTML = `
      <div class="card ll-result-header" style="border-color:${t.color}25">
        <div class="ll-result-emoji">${t.emoji}</div>
        <div class="ll-result-type" style="color:${t.color}">${t.name}</div>
        <div class="ll-result-desc">${t.desc}</div>
      </div>

      <div class="card ll-bars-card">
        <div class="ll-bars-title">5가지 언어 분석</div>
        ${Object.entries(L).map(([k, lang]) => `
          <div class="ll-bar-row">
            <span class="ll-bar-em">${lang.emoji}</span>
            <span class="ll-bar-name">${lang.name}</span>
            <div class="ll-bar-track">
              <div class="ll-bar-fill" style="width:${barW(k)}%;background:${lang.color};
                transition:width 1s ease ${Object.keys(L).indexOf(k) * 0.12}s"></div>
            </div>
            <span class="ll-bar-score" style="color:${lang.color}">${counts[k]}/4</span>
          </div>
        `).join('')}
        <div class="ll-secondary-note">보조 언어: ${L[secondary].emoji} <strong>${L[secondary].name}</strong></div>
      </div>

      <div class="card ll-feel-card" style="background:${t.bg};border-color:${t.color}20">
        <div class="ll-feel-head" style="color:${t.color}">${t.emoji} 나는 이럴 때 사랑받는다고 느껴요</div>
        <p>${d.feel}</p>
        <div class="ll-feel-head" style="color:#dc2626;margin-top:12px">💔 이럴 때 사랑받지 못한다고 느껴요</div>
        <p>${d.unloved}</p>
      </div>

      <div class="card action-card">
        <span class="action-emoji">💡</span>
        <div>
          <span class="action-label">나를 사랑하는 법</span>
          <p>${d.howto}</p>
        </div>
      </div>

      <div class="card tip-card">
        <span class="tip-emoji">💕</span>
        <p>사랑의 언어가 다른 파트너와는 오해가 생길 수 있어요. 서로의 언어를 알고 나면 "왜 내 사랑이 안 전해질까?"가 해결돼요.</p>
      </div>

      <button class="btn-primary ll-retry-btn" id="llRetryBtn">🔄 다시 하기</button>
    `;

    el.classList.remove('hidden');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    $('#llRetryBtn')?.addEventListener('click', () => {
      el.classList.add('hidden');
      choices = []; currentQ = 0;
      $('#lovelangIntro')?.classList.remove('hidden');
      $('section#page-lovelang')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  window.HU = window.HU || {};
  window.HU._initLoveLang = init;
})();
