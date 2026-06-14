/**
 * 사이(Sai) — 관계 타로 UI 컨트롤러
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  let selectedPerson = '';
  let selectedContext = 'lover';
  let drawnCard = null;
  let isReversed = false;

  function init() {
    renderPersonChips();
    setupContextBtns();
    $('#tarotRandomBtn')?.addEventListener('click', drawRandomCard);
  }

  function renderPersonChips() {
    const wrap = $('#tarotPersonChips');
    if (!wrap) return;
    const rels = window.HearimRelations?.getAll() || [];
    if (!rels.length) {
      wrap.innerHTML = '<span class="tarot-no-rel">관계지도에 사람을 추가하면 선택할 수 있어요</span>';
      return;
    }
    wrap.innerHTML = rels.slice(0, 8).map(r =>
      `<button class="chip tarot-person-chip" data-name="${r.name}">${r.emoji || '👤'} ${r.name}</button>`
    ).join('');
    wrap.addEventListener('click', e => {
      const chip = e.target.closest('.tarot-person-chip');
      if (!chip) return;
      $$('.tarot-person-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedPerson = chip.dataset.name;
    });
  }

  function setupContextBtns() {
    $$('.tarot-ctx-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.tarot-ctx-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedContext = btn.dataset.ctx;
      });
    });
    // 기본값 활성화
    $('.tarot-ctx-btn[data-ctx="lover"]')?.classList.add('active');
  }

  function drawTodayCard() {
    const card = window.SaiTarot.getTodayCard();
    isReversed = false;
    animateCardFlip(card);
  }

  function drawRandomCard() {
    const card = window.SaiTarot.drawCard(drawnCard?.id);
    isReversed = Math.random() > 0.72; // 약 28% 역방향
    animateCardFlip(card);
  }

  function animateCardFlip(card) {
    drawnCard = card;
    const area = $('#tarotCardArea');
    if (!area) return;

    // 결과 숨기기
    const result = $('#tarotResult');
    result?.classList.add('hidden');

    // 카드 렌더
    area.innerHTML = buildCardHTML(card);
    area.classList.remove('hidden');

    // 플립 트리거 (한 프레임 후)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        area.querySelector('.tarot-card')?.classList.add('flipped');
      });
    });

    // 결과 표시 (애니메이션 후)
    setTimeout(() => showResult(card), 750);
  }

  function buildCardHTML(card) {
    return `
      <div class="tarot-card-wrap">
        <div class="tarot-card">
          <div class="tarot-card-back">
            <div class="tarot-back-inner">
              <div class="tarot-back-star">🔮</div>
              <div class="tarot-back-text">사이 타로</div>
            </div>
          </div>
          <div class="tarot-card-front">
            <div class="tarot-front-arcana">Major Arcana · ${card.id}</div>
            <div class="tarot-front-symbol">${card.symbol}</div>
            <div class="tarot-front-name">${card.name}</div>
            <div class="tarot-front-kws">${card.keyword.slice(0, 2).join(' · ')}</div>
          </div>
        </div>
      </div>
    `;
  }

  function showResult(card) {
    const reading = window.SaiTarot.getFullReading(card, selectedPerson, selectedContext, isReversed);
    const el = $('#tarotResult');
    if (!el) return;

    const scoreColor = card.id <= 7 ? '#ff6b9d' : card.id <= 14 ? '#6b4eaa' : '#4a9eff';

    el.innerHTML = `
      <div class="card tarot-result-header" style="--tc:${scoreColor}">
        <div class="tarot-arcana-num">Major Arcana ${card.id}</div>
        <div class="tarot-big-symbol">${card.symbol}</div>
        <div class="tarot-result-name">
          ${card.name}
          ${isReversed ? '<span class="tarot-rev-badge">역방향</span>' : ''}
        </div>
        ${selectedPerson ? `<div class="tarot-for-whom">💕 ${selectedPerson}와의 관계 리딩</div>` : ''}
        <div class="tarot-kw-row">
          ${card.keyword.map(k => `<span class="tarot-kw">${k}</span>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="tarot-section-label">🃏 오늘의 메시지</div>
        <p class="tarot-main-msg">${reading.mainMessage}</p>
      </div>

      <div class="card action-card">
        <span class="action-emoji">🌟</span>
        <div>
          <span class="action-label">오늘의 조언</span>
          <p>${card.advice}</p>
        </div>
      </div>

      ${selectedPerson ? `
      <div class="card tip-card">
        <span class="tip-emoji">💡</span>
        <p>${reading.tip}</p>
      </div>` : ''}

      <div class="tarot-action-row">
        <button class="tarot-redraw-btn" id="tarotRedrawBtn">🔄 다른 카드</button>
        <button class="btn-primary" id="tarotShareBtn" style="flex:1">🔗 공유하기</button>
      </div>
    `;

    el.classList.remove('hidden');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    $('#tarotRedrawBtn')?.addEventListener('click', drawRandomCard);

    $('#tarotShareBtn')?.addEventListener('click', () => {
      const text = `[사이 관계 타로] 오늘의 카드: ${card.symbol} ${card.name}${isReversed ? ' (역방향)' : ''}\n\n"${reading.mainMessage}"\n\n오늘의 조언: ${card.advice}`;
      if (navigator.share) {
        navigator.share({ title: '사이 관계 타로', text }).catch(() => fbCopy(text));
      } else {
        fbCopy(text);
      }
    });
  }

  function fbCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    const toast = document.getElementById('bbToast');
    if (toast) {
      toast.textContent = '클립보드에 복사됐어요!';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
  }

  window.HU = window.HU || {};
  window.HU._initTarot = init;
})();
