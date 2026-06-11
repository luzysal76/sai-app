/**
 * 헤아림 - UI 컨트롤러
 * DOM 이벤트 처리 + 엔진 호출 + 결과 렌더링
 */
(function () {
  const $ = (sel) => document.querySelector(sel);

  const state = { relation: 'lover' };

  // 설정: API 엔드포인트가 있으면 폴백 시 호출 (지금은 비어있음 → DB만 사용)
  const CONFIG = {
    apiEndpoint: '', // 예: 'https://<region>-<project>.cloudfunctions.net/translate'
  };

  // --- 관계 선택 ---
  const relationGroup = $('#relationGroup');
  relationGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    relationGroup.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    btn.classList.add('active');
    state.relation = btn.dataset.relation;
  });

  // --- 입력 글자수 ---
  const inputText = $('#inputText');
  const charHint = $('#charHint');
  inputText.addEventListener('input', () => {
    charHint.textContent = `${inputText.value.length}자`;
  });

  // --- 예시 클릭 ---
  document.querySelectorAll('.ex').forEach((b) => {
    b.addEventListener('click', () => {
      inputText.value = b.dataset.ex;
      charHint.textContent = `${inputText.value.length}자`;
      inputText.focus();
    });
  });

  // --- 번역 실행 ---
  const translateBtn = $('#translateBtn');
  const loading = $('#loading');
  const resultSection = $('#resultSection');

  async function runTranslate() {
    const text = inputText.value.trim();
    if (!text) {
      inputText.focus();
      shake(inputText);
      return;
    }
    resultSection.classList.add('hidden');
    loading.classList.remove('hidden');
    translateBtn.disabled = true;

    // 약간의 연출 딜레이 (마음을 헤아리는 느낌)
    await sleep(650);

    let result;
    try {
      result = await window.HearimEngine.translate(text, state.relation, {
        apiEndpoint: CONFIG.apiEndpoint,
      });
    } catch (e) {
      result = window.HearimEngine.interpret(text, state.relation);
    }

    loading.classList.add('hidden');
    translateBtn.disabled = false;
    if (result) {
      renderResult(result);
      resultSection.classList.remove('hidden');
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  translateBtn.addEventListener('click', runTranslate);
  inputText.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runTranslate();
  });

  // --- 결과 렌더링 ---
  function renderResult(r) {
    $('#resultMeaning').textContent = r.meaning;

    const tags = $('#emotionTags');
    tags.innerHTML = '';
    (r.emotions || []).forEach((em) => {
      const span = document.createElement('span');
      span.className = 'emotion-tag';
      span.textContent = em;
      tags.appendChild(span);
    });

    // 신뢰도
    const fill = $('#confidenceFill');
    const val = $('#confidenceVal');
    requestAnimationFrame(() => { fill.style.width = `${r.confidence}%`; });
    val.textContent = `${r.confidence}%`;

    // 답장 추천
    const list = $('#replyList');
    list.innerHTML = '';
    (r.replies || []).forEach((rep) => {
      const item = document.createElement('div');
      item.className = 'reply-item';
      item.innerHTML = `
        <span class="reply-style">${rep.style}</span>
        <span class="reply-text">${escapeHtml(rep.text)}</span>
        <span class="reply-copy">복사</span>`;
      item.addEventListener('click', () => copyReply(item, rep.text));
      list.appendChild(item);
    });

    // 팁
    $('#tipText').textContent = r.tip || '';
    $('#tipCard').classList.toggle('hidden', !r.tip);
  }

  // --- 답장 복사 ---
  function copyReply(item, text) {
    const done = () => {
      item.classList.add('copied');
      item.querySelector('.reply-copy').textContent = '복사됨 ✓';
      setTimeout(() => {
        item.classList.remove('copied');
        item.querySelector('.reply-copy').textContent = '복사';
      }, 1500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    cb && cb();
  }

  // --- 유틸 ---
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  function shake(el) {
    el.animate([
      { transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' }, { transform: 'translateX(0)' },
    ], { duration: 250 });
  }
})();
