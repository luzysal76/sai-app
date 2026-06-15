/**
 * 헤아림 - 표현 사전 페이지 컨트롤러
 * HEARIM_DB(data.js + data-extra.js) 기반 검색 사전
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // 초성 → 대표 글자 매핑
  const CONSONANT_MAP = [
    '가','가','나','다','다','라','마','바','바',
    '사','사','아','자','자','차','카','타','파','하',
  ];
  const INDEX_LABELS = ['전체','가','나','다','라','마','바','사','아','자','차','카','타','파','하'];

  function getInitialGroup(str) {
    if (!str) return '#';
    const ch = (str.trim())[0];
    const code = ch.charCodeAt(0);
    if (code < 0xAC00 || code > 0xD7A3) return '#';
    const idx = Math.floor((code - 0xAC00) / (21 * 28));
    return CONSONANT_MAP[idx] || '#';
  }

  // HEARIM_DB → 사전 엔트리 빌드
  function buildEntries() {
    return (window.HEARIM_DB || []).map((entry, i) => ({
      id: i,
      keyword: entry.keys[0] || '',
      allKeys: (entry.keys || []).join(' / '),
      surface: entry.surface || '',
      hidden: entry.hidden || '',
      emotions: entry.emotions || [],
      action: entry.action || '',
      confidence: entry.confidence || 75,
      tip: entry.tip || '',
      replies: entry.replies || [],
      group: getInitialGroup(entry.keys[0] || ''),
    })).sort((a, b) => a.keyword.localeCompare(b.keyword, 'ko'));
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let allEntries = [];
  let activeGroup = '전체';
  let searchQ = '';

  // ── 목록 렌더 ──
  function renderList() {
    const list = $('#dictList');
    if (!list) return;

    let entries = allEntries;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      entries = entries.filter(e =>
        e.keyword.toLowerCase().includes(q) ||
        e.allKeys.toLowerCase().includes(q) ||
        e.surface.toLowerCase().includes(q) ||
        e.hidden.toLowerCase().includes(q)
      );
    } else if (activeGroup && activeGroup !== '전체') {
      entries = entries.filter(e => e.group === activeGroup);
    }

    if (!entries.length) {
      list.innerHTML = '<div class="dict-empty">검색 결과가 없어요 · No results</div>';
      return;
    }

    list.innerHTML = entries.map(e => `
      <div class="dict-item" data-id="${e.id}">
        <div class="dict-item-head">
          <span class="dict-keyword">"${esc(e.keyword)}"</span>
          <span class="dict-conf-badge" style="background:${confColor(e.confidence)}">${e.confidence}%</span>
        </div>
        <div class="dict-surface">표면: ${esc(e.surface)}</div>
        <div class="dict-hidden">속뜻: ${esc(e.hidden)}</div>
        <div class="dict-emotions">${e.emotions.map(t => `<span class="emotion-tag">${esc(t)}</span>`).join('')}</div>
      </div>
    `).join('');

    $$('.dict-item', list).forEach(item => {
      item.addEventListener('click', () => {
        const entry = allEntries.find(e => e.id === +item.dataset.id);
        if (entry) showDetail(entry);
      });
    });
  }

  function confColor(v) {
    if (v >= 85) return 'linear-gradient(120deg,#ff6b9d,#6b4eaa)';
    if (v >= 70) return 'linear-gradient(120deg,#ff9500,#ffb740)';
    return '#bbb';
  }

  // ── 상세 모달 ──
  function showDetail(entry) {
    const modal = $('#dictModal');
    if (!modal) return;
    const replyHtml = entry.replies.length
      ? `<div class="dict-ms-label" style="margin-top:14px">추천 답장 · Recommended Reply</div>
         ${entry.replies.map(r => `
          <div class="dict-reply-row" data-text="${esc(r.text)}">
            <span class="dict-reply-style">${esc(r.style)}</span>
            <span class="dict-reply-text">${esc(r.text)}</span>
            <button class="dict-reply-copy">복사</button>
          </div>`).join('')}`
      : '';

    modal.innerHTML = `
      <div class="dict-modal-inner">
        <button class="dict-modal-close" id="dictModalClose">×</button>
        <div class="dict-modal-kw">"${esc(entry.keyword)}"</div>
        ${entry.allKeys !== entry.keyword ? `<div class="dict-modal-keys">관련 표현: ${esc(entry.allKeys)}</div>` : ''}
        <div class="dict-modal-section">
          <div class="dict-ms-label">표면 의미 · Surface Meaning</div>
          <p>${esc(entry.surface)}</p>
        </div>
        <div class="dict-modal-section">
          <div class="dict-ms-label">숨은 감정 · Hidden Emotion</div>
          <p>${esc(entry.hidden)}</p>
        </div>
        <div class="dict-modal-emotions">${entry.emotions.map(t=>`<span class="emotion-tag">${esc(t)}</span>`).join('')}</div>
        ${entry.action ? `<div class="dict-modal-section"><div class="dict-ms-label">추천 행동 · Recommended Action</div><p>${esc(entry.action)}</p></div>` : ''}
        ${replyHtml}
        ${entry.tip ? `<div class="dict-modal-tip">💡 ${esc(entry.tip)}</div>` : ''}
        <div class="dict-modal-conf">
          <span>신뢰도 · Confidence</span>
          <div class="dict-conf-bar"><div class="dict-conf-fill" style="width:${entry.confidence}%;background:${confColor(entry.confidence)}"></div></div>
          <span>${entry.confidence}%</span>
        </div>
      </div>`;

    modal.classList.remove('hidden');

    $('#dictModalClose').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

    $$('.dict-reply-copy', modal).forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const row = btn.closest('.dict-reply-row');
        const text = row.dataset.text;
        const copy = cb => {
          if (navigator.clipboard) navigator.clipboard.writeText(text).then(cb).catch(() => fbCopy(text, cb));
          else fbCopy(text, cb);
        };
        copy(() => { btn.textContent = '복사됨 ✓'; setTimeout(() => { btn.textContent = '복사'; }, 1500); });
      });
    });
  }

  function fbCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta); cb && cb();
  }

  // ── 초기화 ──
  function init() {
    allEntries = buildEntries();

    // 인덱스 탭
    const indexBar = $('#dictIndex');
    if (indexBar) {
      indexBar.innerHTML = INDEX_LABELS.map(l =>
        `<button class="dict-idx-btn${l==='전체'?' active':''}" data-g="${l}">${l}</button>`
      ).join('');
      indexBar.addEventListener('click', e => {
        const btn = e.target.closest('.dict-idx-btn');
        if (!btn) return;
        activeGroup = btn.dataset.g;
        searchQ = '';
        const searchEl = $('#dictSearch');
        if (searchEl) searchEl.value = '';
        $$('.dict-idx-btn', indexBar).forEach(b => b.classList.toggle('active', b === btn));
        renderList();
      });
    }

    // 검색창
    const search = $('#dictSearch');
    if (search) {
      search.addEventListener('input', () => {
        searchQ = search.value.trim();
        activeGroup = searchQ ? '' : '전체';
        $$('.dict-idx-btn').forEach(b => b.classList.toggle('active', !searchQ && b.dataset.g === '전체'));
        renderList();
      });
    }

    renderList();
  }

  // HU에 등록 (app.js에서 호출)
  window.HU = window.HU || {};
  window.HU._initDictionary = init;
})();
