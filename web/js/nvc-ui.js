/**
 * 헤아림 - NVC UI 컨트롤러 (메시지 전송용 위주)
 * window.HU._initNVC() 를 노출 — app.js의 showPage()가 첫 진입 시 호출
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let nvcInited = false;

  // ── 메시지 카드 렌더 (공통) ──
  function renderMessageCards(containerEl, messages) {
    if (!containerEl || !messages?.length) return;
    containerEl.innerHTML = messages.map((m, i) => `
      <div class="nvc-msg-card" data-idx="${i}">
        <div class="nvc-msg-head">
          <span class="nvc-msg-tone">${esc(m.tone)}</span>
          ${m.desc ? `<span class="nvc-msg-desc">${esc(m.desc)}</span>` : ''}
          <span class="nvc-msg-copy">탭하여 복사</span>
        </div>
        <p class="nvc-msg-text">${esc(m.text)}</p>
        <div class="nvc-msg-copied hidden">✓ 복사됨</div>
      </div>
    `).join('');

    // 탭 → 복사 이벤트
    $$('.nvc-msg-card', containerEl).forEach((card, i) => {
      card.addEventListener('click', () => {
        const text = messages[i].text;
        const copiedEl = $('.nvc-msg-copied', card);
        const copyHint = $('.nvc-msg-copy', card);

        const done = () => {
          card.classList.add('nvc-msg-copied-state');
          copiedEl.classList.remove('hidden');
          copyHint.classList.add('hidden');
          setTimeout(() => {
            card.classList.remove('nvc-msg-copied-state');
            copiedEl.classList.add('hidden');
            copyHint.classList.remove('hidden');
          }, 2000);
        };

        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
        } else {
          fallbackCopy(text, done);
        }
      });
    });
  }

  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    cb && cb();
  }

  function showLoading(show) {
    const loading = $('#loading');
    if (loading) loading.classList.toggle('hidden', !show);
  }

  function initNVC() {
    if (nvcInited) return;
    nvcInited = true;

    const NVC = window.HearimNVC;
    if (!NVC) { console.warn('[NVC] engine not loaded'); return; }
    const page = document.getElementById('page-nvc');
    if (!page) return;

    // ── 예시 버튼 ──
    $$('[data-nvc-ex]', page).forEach(b => {
      b.addEventListener('click', () => { const inp = $('#nvcInput'); if (inp) inp.value = b.dataset.nvcEx; });
    });
    $$('[data-nvc-h-ex]', page).forEach(b => {
      b.addEventListener('click', () => { const inp = $('#nvcHInput'); if (inp) inp.value = b.dataset.nvcHEx; });
    });

    // ── 탭 전환 ──
    const tab1 = $('#nvcTab1'), tab2 = $('#nvcTab2');
    const mode1 = $('#nvcMode1'), mode2 = $('#nvcMode2');

    tab1?.addEventListener('click', () => {
      tab1.classList.add('active'); tab2.classList.remove('active');
      mode1.classList.remove('hidden'); mode2.classList.add('hidden');
    });
    tab2?.addEventListener('click', () => {
      tab2.classList.add('active'); tab1.classList.remove('active');
      mode2.classList.remove('hidden'); mode1.classList.add('hidden');
    });

    // ── 접기/펼치기 토글 ──
    const reasonToggle = $('#nvcReasonToggle');
    const reasonBody   = $('#nvcReasonBody');
    const toggleArrow  = reasonToggle?.querySelector('.nvc-toggle-arrow');
    reasonToggle?.addEventListener('click', () => {
      const isHidden = reasonBody.classList.toggle('hidden');
      if (toggleArrow) toggleArrow.textContent = isHidden ? '▼' : '▲';
    });

    // ── 모드 1: 내 말 → 전송용 메시지 ──
    $('#nvcBtn')?.addEventListener('click', () => {
      const text = $('#nvcInput')?.value.trim();
      if (!text) { $('#nvcInput')?.focus(); return; }

      const resultEl = $('#nvcResult');
      resultEl?.classList.add('hidden');
      showLoading(true);

      setTimeout(() => {
        const r = NVC.transformNVCSync(text, 'lover');
        showLoading(false);

        // 전송용 메시지 3종
        renderMessageCards($('#nvcMessages'), r.messages || []);

        // NVC 4단계 (접힌 상태)
        $('#nvcObs').textContent  = r.observation || '';
        $('#nvcFeel').textContent = r.feeling      || '';
        $('#nvcNeed').textContent = r.need         || '';
        $('#nvcReq').textContent  = r.request      || '';
        if ($('#nvcNeedLabel')) {
          $('#nvcNeedLabel').textContent = `${r.needEmoji || ''} ${r.needLabel || ''}`;
        }

        // 팁
        $('#nvcTip').textContent = r.tip || '';

        // 접기 초기화 (결과 새로 보여줄 때 접힌 상태로 리셋)
        reasonBody?.classList.add('hidden');
        if (toggleArrow) toggleArrow.textContent = '▼';

        resultEl?.classList.remove('hidden');
        resultEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    });

    // ── 모드 2: 상대 말 → 답장 메시지 ──
    $('#nvcHBtn')?.addEventListener('click', () => {
      const text = $('#nvcHInput')?.value.trim();
      if (!text) { $('#nvcHInput')?.focus(); return; }

      const resultEl = $('#nvcHResult');
      resultEl?.classList.add('hidden');
      showLoading(true);

      setTimeout(() => {
        const r = NVC.analyzeHiddenNeedsSync(text);
        showLoading(false);

        // 숨겨진 욕구
        $('#nvcHHidden').textContent = r.hidden || '';

        // 욕구 태그
        const needsEl = $('#nvcHNeeds');
        if (needsEl && r.needs?.length) {
          needsEl.innerHTML = r.needs.map(n =>
            `<span class="nvc-need-tag">${n.emoji} ${esc(n.label)}</span>`
          ).join('');
        }

        // 답장 메시지 3종
        renderMessageCards($('#nvcHMessages'), r.replyMessages || []);

        // 팁
        $('#nvcHTip').textContent = r.tip || '';

        resultEl?.classList.remove('hidden');
        resultEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    });
  }

  // window.HU에 등록
  const ready = () => {
    if (window.HU) window.HU._initNVC = initNVC;
    else setTimeout(ready, 100);
  };
  ready();
})();
