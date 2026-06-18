/**
 * 사이(Sai) — 관계 통장 UI 컨트롤러
 * window.HU._initBankbook() 노출
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const BB  = window.SaiBankbook;
  const REL = window.HearimRelations;

  let currentPersonId = null;
  let showingPos = true;
  let bbInited = false;

  // ── 토스트 ──
  function toast(msg) {
    const el = $('#bbToast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ── 통장 화면 업데이트 ──
  function updateBook(personId) {
    const book  = BB.getBook(personId);
    const score = BB.totalScore(book);
    const status = BB.getStatus(score);

    // 점수 + 상태
    $('#bbTotalScore').textContent = score;
    $('#bbStatusIcon').textContent = status.icon;
    $('#bbStatusLabel').textContent = status.label;
    $('#bbStatusBadge').style.color = status.color;

    // 잔액 바
    requestAnimationFrame(() => {
      $('#bbTrustFill').style.width    = book.trust    + '%';
      $('#bbAffinityFill').style.width = book.affinity + '%';
      $('#bbCareFill').style.width     = book.care     + '%';
    });
    $('#bbTrustNum').textContent    = book.trust;
    $('#bbAffinityNum').textContent = book.affinity;
    $('#bbCareNum').textContent     = book.care;

    // 히스토리
    renderHistory(book.history);
  }

  // ── 히스토리 렌더 ──
  function renderHistory(history) {
    const el = $('#bbHistory'); if (!el) return;
    if (!history?.length) {
      el.innerHTML = '<div class="bb-history-empty">아직 기록이 없어요. 오늘 있었던 일을 기록해보세요 💗</div>';
      return;
    }
    el.innerHTML = history.slice(0, 15).map(h => {
      const deltas = [];
      if (h.trust    !== 0) deltas.push(`<span class="bb-hist-delta ${h.trust > 0 ? 'pos' : 'neg'}">신뢰 ${h.trust > 0 ? '+' : ''}${h.trust}</span>`);
      if (h.affinity !== 0) deltas.push(`<span class="bb-hist-delta ${h.affinity > 0 ? 'pos' : 'neg'}">호감 ${h.affinity > 0 ? '+' : ''}${h.affinity}</span>`);
      if (h.care     !== 0) deltas.push(`<span class="bb-hist-delta ${h.care > 0 ? 'pos' : 'neg'}">관심 ${h.care > 0 ? '+' : ''}${h.care}</span>`);
      return `
        <div class="bb-history-item">
          <span class="bb-hist-icon">${esc(h.icon)}</span>
          <div class="bb-hist-info">
            <div class="bb-hist-label">${esc(h.label)}</div>
            <div class="bb-hist-date">${esc(h.date)}</div>
          </div>
          <div class="bb-hist-deltas">${deltas.join('')}</div>
        </div>`;
    }).join('');
  }

  // ── 행동 그리드 렌더 ──
  function renderActions(type) {
    const grid = $('#bbActionGrid'); if (!grid) return;
    const actions = BB.ACTIONS[type];
    grid.innerHTML = actions.map(a => {
      const mainDelta = (type === 'positive')
        ? Math.max(a.trust || 0, a.affinity || 0, a.care || 0)
        : Math.min(a.trust || 0, a.affinity || 0, a.care || 0);
      const sign = mainDelta >= 0 ? '+' : '';
      const cls  = type === 'positive' ? 'pos' : 'neg';
      return `
        <button class="bb-action-btn ${type === 'negative' ? 'neg-btn' : ''}" data-action-id="${a.id}">
          <span class="bb-action-icon">${esc(a.icon)}</span>
          <span class="bb-action-label">${esc(a.label)}</span>
          <span class="bb-action-delta ${cls}">${sign}${mainDelta}</span>
        </button>`;
    }).join('');

    $$('.bb-action-btn', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        if (!currentPersonId) return;
        const actionId = btn.dataset.actionId;
        const today = new Date().toLocaleDateString('ko-KR');
        BB.recordAction(currentPersonId, actionId, today);
        updateBook(currentPersonId);
        const action = [...BB.ACTIONS.positive, ...BB.ACTIONS.negative].find(a => a.id === actionId);
        toast(`${action?.icon || ''} "${action?.label}" 기록 완료!`);
      });
    });
  }

  // ── 인물 선택 ──
  function selectPerson(personId, persons) {
    currentPersonId = personId;
    const person = persons.find(p => p.id === personId);

    // 칩 active 업데이트
    $$('.bb-person-chip').forEach(c => c.classList.toggle('active', c.dataset.personId === personId));

    // 인물 이름
    $('#bbPersonName').textContent = (person?.emoji || '') + ' ' + (person?.name || '');

    // 통장 메인 표시
    $('#bbMain').classList.remove('hidden');
    updateBook(personId);
    renderActions('positive');
    showingPos = true;
    $('#bbTabPos')?.classList.add('active-pos');
    $('#bbTabNeg')?.classList.remove('active-neg');
  }

  // ── 빠른 인물 추가 (관계 지도 탭 없을 때 인라인 등록) ──
  function renderQuickAdd(scroll) {
    scroll.innerHTML = `
      <div class="bb-quick-add">
        <p style="font-size:13px;color:var(--gray);margin:0 0 8px">통장을 만들 상대를 추가해주세요 💗</p>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <input id="bbQuickName" type="text" placeholder="이름 (예: 준혁)" maxlength="12"
            style="flex:1;min-width:80px;padding:7px 10px;border-radius:10px;border:1px solid #ddd;font-size:14px">
          <select id="bbQuickType" style="padding:7px 8px;border-radius:10px;border:1px solid #ddd;font-size:13px">
            <option value="lover">💑 연인</option>
            <option value="some">💗 썸</option>
            <option value="friend">🧑 친구</option>
            <option value="family">👨‍👩‍👧 가족</option>
            <option value="work">💼 직장</option>
          </select>
          <button id="bbQuickAddBtn" style="padding:7px 14px;border-radius:10px;background:linear-gradient(135deg,#ff6b9d,#6b4eaa);color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer">추가</button>
        </div>
      </div>`;
    $('#bbMain').classList.add('hidden');

    $('#bbQuickAddBtn').addEventListener('click', () => {
      const name = $('#bbQuickName').value.trim();
      if (!name) { $('#bbQuickName').focus(); return; }
      const type = $('#bbQuickType').value;
      const EMOJI = { lover:'💑', some:'💗', friend:'🧑', family:'👨‍👩‍👧', work:'💼' };
      REL.upsert({ name, type, emoji: EMOJI[type] || '👤', affinity: 60, frequency: 1, conflict: 0 }, null);
      renderPersons();
    });
  }

  // ── 인물 칩 렌더 ──
  function renderPersons() {
    const scroll = $('#bbPersonScroll'); if (!scroll) return;
    if (!REL) { scroll.innerHTML = '<p style="color:var(--gray);font-size:13px">관계 데이터를 불러올 수 없어요.</p>'; return; }

    const persons = REL.getAll ? REL.getAll() : [];
    if (!persons?.length) {
      renderQuickAdd(scroll);
      return;
    }

    scroll.innerHTML = persons.map(p => `
      <button class="bb-person-chip" data-person-id="${esc(p.id)}">
        <span class="bb-chip-emoji">${esc(p.emoji || '👤')}</span>
        <span class="bb-chip-name">${esc(p.name)}</span>
      </button>
    `).join('');

    $$('.bb-person-chip', scroll).forEach(chip => {
      chip.addEventListener('click', () => selectPerson(chip.dataset.personId, persons));
    });

    // 첫 번째 인물 자동 선택
    selectPerson(persons[0].id, persons);
  }

  // ── 탭 전환 ──
  function initTabs() {
    $('#bbTabPos')?.addEventListener('click', () => {
      showingPos = true;
      $('#bbTabPos').classList.add('active-pos');
      $('#bbTabNeg').classList.remove('active-neg');
      renderActions('positive');
    });
    $('#bbTabNeg')?.addEventListener('click', () => {
      showingPos = false;
      $('#bbTabNeg').classList.add('active-neg');
      $('#bbTabPos').classList.remove('active-pos');
      renderActions('negative');
    });
  }

  // ── 초기화 ──
  function initBankbook() {
    if (bbInited) {
      // 재진입 시 인물 목록만 새로고침
      renderPersons();
      return;
    }
    bbInited = true;
    initTabs();
    renderPersons();
  }

  // window.HU에 등록
  const ready = () => {
    if (window.HU) window.HU._initBankbook = initBankbook;
    else setTimeout(ready, 100);
  };
  ready();
})();
