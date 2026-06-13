/**
 * 사이(Sai) — 애착 유형 분석 UI 컨트롤러
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  let answers = [];
  let currentQ = 0;

  function init() {
    answers = []; currentQ = 0;
    // 이전 결과 숨기고 인트로 표시
    $('#attachmentResult')?.classList.add('hidden');
    $('#attachmentQuiz')?.classList.add('hidden');
    $('#attachmentIntro')?.classList.remove('hidden');
    $('#attachmentStartBtn')?.addEventListener('click', startQuiz);
  }

  function startQuiz() {
    $('#attachmentIntro')?.classList.add('hidden');
    $('#attachmentQuiz')?.classList.remove('hidden');
    showQuestion(0);
  }

  function showQuestion(idx) {
    const Q = window.SaiAttachment.QUESTIONS;
    const total = Q.length;

    // 진행바
    const fill = $('#attProgressFill');
    const label = $('#attProgressLabel');
    if (fill) fill.style.width = `${(idx / total) * 100}%`;
    if (label) label.textContent = `${idx + 1} / ${total}`;

    // 질문 텍스트 애니메이션
    const numEl = $('#attQNum'), textEl = $('#attQText');
    if (numEl) numEl.textContent = `Q${idx + 1}`;
    if (textEl) {
      textEl.style.cssText = 'opacity:0;transform:translateY(8px);transition:none';
      textEl.textContent = Q[idx].text;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          textEl.style.cssText = 'opacity:1;transform:translateY(0);transition:opacity .3s,transform .3s';
        });
      });
    }

    // 선택지 초기화
    $$('.att-choice-btn').forEach(btn => {
      btn.classList.remove('selected');
      btn.onclick = () => selectAnswer(idx, parseInt(btn.dataset.val));
    });
  }

  function selectAnswer(idx, val) {
    answers[idx] = val;

    // 선택 피드백
    $$('.att-choice-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === val);
    });

    const total = window.SaiAttachment.QUESTIONS.length;
    const fill = $('#attProgressFill');
    if (fill) fill.style.width = `${((idx + 1) / total) * 100}%`;

    if (idx + 1 < total) {
      setTimeout(() => { currentQ = idx + 1; showQuestion(currentQ); }, 380);
    } else {
      setTimeout(showResult, 450);
    }
  }

  function showResult() {
    $('#attachmentQuiz')?.classList.add('hidden');
    const el = $('#attachmentResult');
    if (!el) return;

    const { avgs, primary, secondary } = window.SaiAttachment.calcScore(answers);
    const T = window.SaiAttachment.TYPES;
    const t = T[primary], st = T[secondary];

    function barW(k) { return Math.round(avgs[k] / 4 * 100); }

    el.innerHTML = `
      <div class="card att-result-header" style="border-color:${t.color}30">
        <div class="att-result-emoji">${t.emoji}</div>
        <div class="att-result-type" style="color:${t.color}">${t.name}</div>
        <div class="att-result-sub">${t.sub}</div>
      </div>

      <div class="card att-bars-card">
        <div class="att-bars-title">유형별 분석</div>
        ${Object.entries(T).map(([k, tp]) => `
          <div class="att-bar-row">
            <span class="att-bar-label">${tp.emoji} ${tp.name}</span>
            <div class="att-bar-track">
              <div class="att-bar-fill" style="width:${barW(k)}%;background:${tp.color};
                transition:width 1s ease ${Object.keys(T).indexOf(k) * 0.15}s"></div>
            </div>
            <span class="att-bar-pct" style="color:${tp.color}">${barW(k)}%</span>
          </div>
        `).join('')}
        <div class="att-secondary-note">보조 유형: ${st.emoji} <strong>${st.name}</strong></div>
      </div>

      <div class="card action-card">
        <span class="action-emoji">${t.emoji}</span>
        <div>
          <span class="action-label">나의 관계 패턴</span>
          <p>${t.desc}</p>
        </div>
      </div>

      <div class="card att-strength-card" style="background:${t.bg};border-color:${t.color}20">
        <div class="att-str-head" style="color:${t.color}">💪 강점</div>
        <p>${t.strength}</p>
      </div>

      <div class="card att-growth-card">
        <div class="att-gr-head">🌱 성장 포인트</div>
        <p>${t.growth}</p>
      </div>

      <div class="card tip-card">
        <span class="tip-emoji">💡</span>
        <p>${t.tip}</p>
      </div>

      <div class="att-retry-row">
        <button class="btn-primary att-retry-btn" id="attRetryBtn">🔄 다시 하기</button>
      </div>
    `;

    el.classList.remove('hidden');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    $('#attRetryBtn')?.addEventListener('click', () => {
      el.classList.add('hidden');
      answers = []; currentQ = 0;
      $('#attachmentIntro')?.classList.remove('hidden');
      $('section#page-attachment')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  window.HU = window.HU || {};
  window.HU._initAttachment = init;
})();
