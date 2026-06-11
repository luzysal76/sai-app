/**
 * 헤아림 - NVC UI 컨트롤러
 * window.HU._initNVC() 를 노출 — app.js의 showPage()가 첫 진입 시 호출
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let nvcInited = false;

  function initNVC() {
    if (nvcInited) return;
    nvcInited = true;

    const NVC = window.HearimNVC;
    if (!NVC) { console.warn('[NVC] engine not loaded'); return; }

    // ── 예시 버튼 ──
    $$('[data-nvc-ex]', document.getElementById('page-nvc')).forEach(b => {
      b.addEventListener('click', () => {
        const inp = $('#nvcInput');
        if (inp) inp.value = b.dataset.nvcEx;
      });
    });
    $$('[data-nvc-h-ex]', document.getElementById('page-nvc')).forEach(b => {
      b.addEventListener('click', () => {
        const inp = $('#nvcHInput');
        if (inp) inp.value = b.dataset.nvcHEx;
      });
    });

    // ── 탭 전환 ──
    const tab1 = $('#nvcTab1');
    const tab2 = $('#nvcTab2');
    const mode1 = $('#nvcMode1');
    const mode2 = $('#nvcMode2');

    tab1?.addEventListener('click', () => {
      tab1.classList.add('active'); tab2.classList.remove('active');
      mode1.classList.remove('hidden'); mode2.classList.add('hidden');
    });
    tab2?.addEventListener('click', () => {
      tab2.classList.add('active'); tab1.classList.remove('active');
      mode2.classList.remove('hidden'); mode1.classList.add('hidden');
    });

    // ── 모드 1: 내 말 NVC 번역 ──
    $('#nvcBtn')?.addEventListener('click', async () => {
      const text = $('#nvcInput')?.value.trim();
      if (!text) { $('#nvcInput')?.focus(); return; }

      const result = $('#nvcResult');
      result?.classList.add('hidden');
      const loading = $('#loading');
      loading?.classList.remove('hidden');

      try {
        const r = NVC.transformNVCSync(text, 'lover');
        loading?.classList.add('hidden');

        $('#nvcObs').textContent  = r.observation || '';
        $('#nvcFeel').textContent = r.feeling      || '';
        $('#nvcNeed').textContent = r.need         || '';
        $('#nvcReq').textContent  = r.request      || '';

        // 욕구 이모지 + 태그
        const needEmoji = r.needEmoji || '';
        const needLabel = r.needLabel || '';
        if ($('#nvcNeedLabel')) {
          $('#nvcNeedLabel').textContent = `${needEmoji} ${needLabel}`;
        }

        // 완성 문장 조합
        const full = `"${r.observation}(관찰), 나는 ${r.feeling}(감정). 나는 ${r.need}(욕구). ${r.request}(부탁)"`;
        const fullEl = $('#nvcFull');
        if (fullEl) fullEl.textContent = full;

        // 감정 태그
        const tagsEl = $('#nvcFeelTags');
        if (tagsEl && r.feelingTags?.length) {
          tagsEl.innerHTML = r.feelingTags.map(t => `<span class="emotion-tag">${esc(t)}</span>`).join('');
        }

        // 팁
        $('#nvcTip').textContent = r.tip || '';

        // 복사 버튼
        $('#nvcCopyBtn')?.addEventListener('click', () => {
          const copyFn = window.HU?.copy;
          const btn = $('#nvcCopyBtn');
          if (navigator.clipboard) {
            navigator.clipboard.writeText(full).then(() => {
              btn.textContent = '복사됨 ✓';
              setTimeout(() => { btn.textContent = '📋 복사하기'; }, 2000);
            });
          } else {
            const ta = document.createElement('textarea');
            ta.value = full; ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } catch(e) {}
            document.body.removeChild(ta);
            btn.textContent = '복사됨 ✓';
            setTimeout(() => { btn.textContent = '📋 복사하기'; }, 2000);
          }
        }, { once: true });

        result?.classList.remove('hidden');
        result?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch(e) {
        loading?.classList.add('hidden');
        console.error('[NVC] transform error', e);
      }
    });

    // ── 모드 2: 상대 말 숨은 욕구 분석 ──
    $('#nvcHBtn')?.addEventListener('click', async () => {
      const text = $('#nvcHInput')?.value.trim();
      if (!text) { $('#nvcHInput')?.focus(); return; }

      const result = $('#nvcHResult');
      result?.classList.add('hidden');
      const loading = $('#loading');
      loading?.classList.remove('hidden');

      try {
        const r = NVC.analyzeHiddenNeedsSync(text);
        loading?.classList.add('hidden');

        // 표면 표현
        $('#nvcHSurface').textContent = r.surface || '';
        // 숨은 욕구
        $('#nvcHHidden').textContent  = r.hidden  || '';
        // 조언
        $('#nvcHAdvice').textContent  = r.advice  || '';
        // 팁
        $('#nvcHTip').textContent     = r.tip     || '';

        // 욕구 태그 렌더
        const needsEl = $('#nvcHNeeds');
        if (needsEl && r.needs?.length) {
          needsEl.innerHTML = r.needs.map(n =>
            `<span class="nvc-need-tag">${n.emoji} ${esc(n.label)}</span>`
          ).join('');
        }

        // 감정 태그
        const feelEl = $('#nvcHFeelings');
        if (feelEl && r.feelings?.length) {
          feelEl.innerHTML = r.feelings.map(f =>
            `<span class="emotion-tag">${esc(f)}</span>`
          ).join('');
        }

        result?.classList.remove('hidden');
        result?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch(e) {
        loading?.classList.add('hidden');
        console.error('[NVC] hidden needs error', e);
      }
    });
  }

  // window.HU에 등록 (app.js showPage에서 호출)
  const ready = () => { if (window.HU) window.HU._initNVC = initNVC; else setTimeout(ready, 100); };
  ready();
})();
