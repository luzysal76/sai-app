/**
 * 사이(Sai) — MBTI 궁합 분석 UI
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const DIMS = [
    { key: 0, left: 'E', right: 'I', lLabel: '외향형', rLabel: '내향형' },
    { key: 1, left: 'N', right: 'S', lLabel: '직관형', rLabel: '감각형' },
    { key: 2, left: 'T', right: 'F', lLabel: '사고형', rLabel: '감정형' },
    { key: 3, left: 'J', right: 'P', lLabel: '판단형', rLabel: '인식형' },
  ];

  let myType    = ['E','N','T','J'];
  let theirType = ['E','N','F','P'];

  function init() {
    buildSelector('mbtiMine', myType, v => { myType = v; });
    buildSelector('mbtiTheirs', theirType, v => { theirType = v; });

    $('#mbtiAnalyzeBtn')?.addEventListener('click', runAnalysis);

    // 예시 커플 칩 클릭
    $$('.mbti-ex-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const [me, them] = (btn.dataset.pair || '').split('-');
        if (!me || !them) return;
        setType('mbtiMine', me.split(''));
        setType('mbtiTheirs', them.split(''));
        myType = me.split('');
        theirType = them.split('');
      });
    });
  }

  /** 타입 선택기 렌더링 */
  function buildSelector(wrapperId, initialType, onChange) {
    const wrap = $(`#${wrapperId}`);
    if (!wrap) return;

    wrap.innerHTML = DIMS.map((d, idx) => `
      <div class="mbti-dim-row" data-wrapper="${wrapperId}" data-idx="${idx}">
        <button class="mbti-dim-btn${initialType[idx] === d.left ? ' active' : ''}"
                data-val="${d.left}" data-wrapper="${wrapperId}" data-idx="${idx}">
          ${d.left}<span class="mbti-dim-label">${d.lLabel}</span>
        </button>
        <button class="mbti-dim-btn${initialType[idx] === d.right ? ' active' : ''}"
                data-val="${d.right}" data-wrapper="${wrapperId}" data-idx="${idx}">
          ${d.right}<span class="mbti-dim-label">${d.rLabel}</span>
        </button>
      </div>
    `).join('');

    // 현재 선택값 표시
    updateTypeDisplay(wrapperId, initialType);

    wrap.addEventListener('click', e => {
      const btn = e.target.closest('.mbti-dim-btn');
      if (!btn) return;
      const idx = +btn.dataset.idx;
      const val = btn.dataset.val;

      // 해당 row 내 버튼 활성화 토글
      const row = wrap.querySelectorAll(`.mbti-dim-row[data-idx="${idx}"] .mbti-dim-btn`);
      row.forEach(b => b.classList.toggle('active', b.dataset.val === val));

      // 현재 타입 배열 업데이트
      const current = Array.from(wrap.querySelectorAll('.mbti-dim-row')).map((r, i) => {
        const active = r.querySelector('.mbti-dim-btn.active');
        return active ? active.dataset.val : initialType[i];
      });
      onChange(current);
      updateTypeDisplay(wrapperId, current);
    });
  }

  function updateTypeDisplay(wrapperId, type) {
    const tag = $(`#${wrapperId}Tag`);
    if (tag) {
      const typeStr = type.join('');
      const desc = window.SaiMBTI.TYPE_DESC[typeStr] || '';
      tag.textContent = typeStr;
      const descEl = $(`#${wrapperId}Desc`);
      if (descEl) descEl.textContent = desc;
    }
  }

  function setType(wrapperId, typeArr) {
    const wrap = $(`#${wrapperId}`);
    if (!wrap) return;
    DIMS.forEach((d, idx) => {
      const row = wrap.querySelectorAll(`.mbti-dim-row[data-idx="${idx}"] .mbti-dim-btn`);
      row.forEach(b => b.classList.toggle('active', b.dataset.val === typeArr[idx]));
    });
    updateTypeDisplay(wrapperId, typeArr);
  }

  function runAnalysis() {
    const me    = myType.join('');
    const them  = theirType.join('');
    const data  = window.SaiMBTI.analyze(me, them);
    if (!data) return;
    renderResult(me, them, data);
  }

  function renderResult(me, them, d) {
    const el = $('#mbtiResult');
    if (!el) return;

    // 하트 렌더링
    const hearts = Array.from({ length: 5 }, (_, i) =>
      `<span class="mbti-heart${i < d.hearts ? ' filled' : ''}">${i < d.hearts ? '💗' : '🤍'}</span>`
    ).join('');

    // 점수 색상
    const scoreColor = d.score >= 90 ? '#ff6b9d' : d.score >= 80 ? '#a06bff' :
                       d.score >= 70 ? '#4a9eff' : '#aaa';

    el.innerHTML = `
      ${d.isGolden ? '<div class="mbti-golden-banner">✨ 황금 페어 조합! ✨</div>' : ''}

      <div class="card mbti-result-header">
        <div class="mbti-type-pair">
          <span class="mbti-type-tag">${me}</span>
          <span class="mbti-heart-icon">💕</span>
          <span class="mbti-type-tag">${them}</span>
        </div>
        <div class="mbti-score-ring" style="--score-color:${scoreColor}">
          <span class="mbti-score-num">${d.score}<span class="mbti-score-pct">%</span></span>
        </div>
        <div class="mbti-hearts">${hearts}</div>
        <div class="mbti-couple-name">${d.name}</div>
      </div>

      <div class="card">
        <div class="mbti-section-label">💪 이 관계의 강점</div>
        <ul class="mbti-list">
          ${d.strengths.map(s => `<li>✅ ${s}</li>`).join('')}
        </ul>
      </div>

      ${d.challenges.length ? `
      <div class="card">
        <div class="mbti-section-label">⚡ 주의할 점</div>
        <ul class="mbti-list">
          ${d.challenges.map(c => `<li>⚠️ ${c}</li>`).join('')}
        </ul>
      </div>` : ''}

      <div class="card mbti-tip-card">
        <span class="tip-emoji">💡</span>
        <p>${d.tip}</p>
      </div>

      <button class="btn-primary" id="mbtiShareBtn" style="margin-top:4px">
        🔗 결과 공유하기
      </button>
    `;

    el.classList.remove('hidden');
    setTimeout(() => el.scrollIntoView({ behavior:'smooth', block:'start' }), 80);

    // 공유 버튼
    $('#mbtiShareBtn')?.addEventListener('click', () => {
      const text = `[사이 MBTI 궁합] ${me} ♥ ${them}\n궁합 ${d.score}% — ${d.name}\n\n${d.tip}`;
      if (navigator.share) {
        navigator.share({ title:'MBTI 궁합', text }).catch(() => fbCopy(text));
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
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    const toast = document.getElementById('bbToast');
    if (toast) { toast.textContent = '클립보드에 복사됐어요!'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2000); }
  }

  window.HU = window.HU || {};
  window.HU._initMBTI = init;
})();
