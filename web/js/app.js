/**
 * 헤아림 - 앱 컨트롤러 (네비게이션 + 각 기능 이벤트/렌더)
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const E = window.HearimEngine;
  const A = window.HearimAnalyzers;
  const CONFIG = { apiEndpoint: '' }; // Firebase Functions 붙이면 자동 폴백

  const RELATIONS = [
    { v: 'lover', t: '💑 연인' }, { v: 'some', t: '💗 썸' },
    { v: 'friend', t: '🧑‍🤝‍🧑 친구' }, { v: 'family', t: '👨‍👩‍👧 가족' },
    { v: 'work', t: '💼 직장' },
  ];
  const META = {
    home: { title: '헤아림', sub: '연애·인간관계 커뮤니케이션 번역기' },
    translator: { title: '대화 번역기', sub: '상대 말의 진짜 속뜻' },
    kakao: { title: '카톡 분석기', sub: '관심도·답장 추천' },
    diagnosis: { title: '관계 진단', sub: '현재 상태·발전 가능성' },
    readcheck: { title: '읽씹 분석', sub: '무응답 가능성 해석' },
    reply: { title: '답장 생성기', sub: '톤별 답장 추천' },
    coach: { title: '성장 코치', sub: '오늘의 관계 미션' },
  };

  // ---------- 공통: 관계 칩 생성 ----------
  function initRelationGroups() {
    $$('.relation-group').forEach((g, i) => {
      g.dataset.relation = 'lover';
      g.innerHTML = RELATIONS.map((r, idx) =>
        `<button class="chip${idx === 0 ? ' active' : ''}" data-relation="${r.v}">${r.t}</button>`
      ).join('');
      g.addEventListener('click', (e) => {
        const b = e.target.closest('.chip');
        if (!b) return;
        $$('.chip', g).forEach((c) => c.classList.remove('active'));
        b.classList.add('active');
        g.dataset.relation = b.dataset.relation;
      });
    });
  }
  const relOf = (view) => ($('.relation-group', $('#view-' + view)) || {}).dataset?.relation || 'lover';

  // ---------- 네비게이션 ----------
  const backBtn = $('#backBtn');
  function showView(name) {
    $$('.view').forEach((v) => v.classList.add('hidden'));
    $('#view-' + name).classList.remove('hidden');
    $('#headerTitle').textContent = META[name].title;
    $('#headerSub').textContent = META[name].sub;
    backBtn.classList.toggle('hidden', name === 'home');
    $('#loading').classList.add('hidden');
    window.scrollTo({ top: 0 });
  }
  $('#featureGrid').addEventListener('click', (e) => {
    const c = e.target.closest('.feature-card');
    if (c) showView(c.dataset.go);
  });
  backBtn.addEventListener('click', () => showView('home'));

  // ---------- 로딩 연출 ----------
  function withLoading(targetResultId, fn) {
    const result = $('#' + targetResultId);
    result.classList.add('hidden');
    const loading = $('#loading');
    loading.classList.remove('hidden');
    setTimeout(() => {
      loading.classList.add('hidden');
      fn();
      result.classList.remove('hidden');
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 600);
  }

  // ---------- 공통 렌더 헬퍼 ----------
  function renderTags(el, tags) {
    el.innerHTML = (tags || []).map((t) => `<span class="emotion-tag">${esc(t)}</span>`).join('');
  }
  function renderPoss(el, list) {
    el.innerHTML = (list || []).map((p) => `
      <div class="poss-row">
        <span class="poss-label">${esc(p.label)}</span>
        <div class="poss-track"><div class="poss-fill" style="width:0%"></div></div>
        <span class="poss-pct">${p.pct}%</span>
      </div>`).join('');
    requestAnimationFrame(() => {
      $$('.poss-fill', el).forEach((f, i) => { f.style.width = list[i].pct + '%'; });
    });
  }
  function renderReplies(el, replies) {
    el.innerHTML = '';
    (replies || []).forEach((rep) => {
      const item = document.createElement('div');
      item.className = 'reply-item';
      item.innerHTML = `<span class="reply-style">${esc(rep.style)}형</span>
        <span class="reply-text">${esc(rep.text)}</span><span class="reply-copy">복사</span>`;
      item.addEventListener('click', () => copy(item, rep.text));
      el.appendChild(item);
    });
  }
  function renderThermo(el, temp) {
    el.innerHTML = `<span class="thermo-icon">${temp.icon}</span>
      <div class="thermo-text"><b>${temp.label}</b><span>${esc(temp.desc)}</span></div>`;
    el.className = 'thermo thermo-' + temp.level;
  }

  // ---------- 1. 대화 번역기 ----------
  function initTranslator() {
    bindExamples();
    $('#trBtn').addEventListener('click', () => {
      const text = $('#trInput').value.trim();
      if (!text) return shake($('#trInput'));
      withLoading('trResult', async () => {
        const r = await E.translate(text, relOf('translator'), CONFIG) || E.interpret(text, relOf('translator'));
        $('#trSurface').textContent = r.surface;
        $('#trHidden').textContent = r.hidden;
        renderTags($('#trEmotions'), r.emotions);
        renderPoss($('#trPoss'), r.possibilities);
        $('#trAction').textContent = r.action;
        $('#trTip').textContent = r.tip;
        const c = $('#trConf'); requestAnimationFrame(() => (c.style.width = r.confidence + '%'));
        $('#trConfVal').textContent = r.confidence + '%';
      });
    });
  }

  // ---------- 2. 카톡 분석기 ----------
  function initKakao() {
    $('#kkBtn').addEventListener('click', () => {
      const text = $('#kkInput').value.trim();
      if (!text) return shake($('#kkInput'));
      withLoading('kkResult', () => {
        const r = A.analyzeKakao(text);
        $('#kkScore').textContent = r.score + '점';
        $('#kkHearts').textContent = r.hearts;
        renderThermo($('#kkThermo'), E.temperature(r.score));
        renderTags($('#kkEmotions'), r.emotions);
        renderReplies($('#kkReplies'), r.replies);
        $('#kkTip').textContent = r.tip;
      });
    });
  }

  // ---------- 3. 관계 진단 ----------
  function initDiagnosis() {
    $$('#view-diagnosis .seg').forEach((seg) => {
      seg.dataset.value = '1';
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        $$('button', seg).forEach((x) => x.classList.remove('active'));
        b.classList.add('active'); seg.dataset.value = b.dataset.v;
      });
    });
    $('#dgBtn').addEventListener('click', () => {
      const ans = {
        reply: +$('#view-diagnosis .seg[data-q="reply"]').dataset.value,
        meet: +$('#view-diagnosis .seg[data-q="meet"]').dataset.value,
        first: +$('#view-diagnosis .seg[data-q="first"]').dataset.value,
      };
      withLoading('dgResult', () => {
        const r = A.diagnose(relOf('diagnosis'), ans);
        $('#dgStage').textContent = r.stage;
        renderThermo($('#dgThermo'), r.temp);
        $('#dgScore').textContent = r.score + '%';
        $('#dgPotential').textContent = r.potential;
        $('#dgAdvice').textContent = r.advice;
      });
    });
  }

  // ---------- 4. 읽씹 분석 ----------
  function initReadCheck() {
    $$('#view-readcheck .quick-hours .ex').forEach((b) =>
      b.addEventListener('click', () => { $('#rcInput').value = b.dataset.h; }));
    $('#rcBtn').addEventListener('click', () => {
      const h = $('#rcInput').value;
      withLoading('rcResult', () => {
        const r = A.analyzeReadCheck(h, relOf('readcheck'));
        $('#rcHours').textContent = r.hours + '시간째 무응답';
        const w = $('#rcWorry'); w.textContent = '우려도 ' + r.worryLevel;
        w.className = 'worry worry-' + r.worryLevel;
        renderPoss($('#rcPoss'), r.possibilities);
        $('#rcCaution').textContent = r.caution;
        $('#rcTip').textContent = r.tip;
      });
    });
  }

  // ---------- 5. 답장 생성기 ----------
  function initReply() {
    $('#rpBtn').addEventListener('click', () => {
      const text = $('#rpInput').value.trim();
      if (!text) return shake($('#rpInput'));
      withLoading('rpResult', () => {
        const r = A.generateReply(text, relOf('reply'));
        renderReplies($('#rpReplies'), r.replies);
        $('#rpNote').textContent = r.note;
      });
    });
  }

  // ---------- 6. 성장 코치 ----------
  let coachSeed = 0;
  function initCoach() {
    const group = $('.relation-group', $('#view-coach'));
    group.addEventListener('click', () => renderMissions());
    $('#coachRefresh').addEventListener('click', () => { coachSeed++; renderMissions(); });
    renderMissions();
  }
  function renderMissions() {
    const rel = relOf('coach');
    const missions = A.dailyMissions(rel, coachSeed);
    const list = $('#missionList');
    list.innerHTML = missions.map((m, i) => `
      <label class="mission">
        <input type="checkbox" data-i="${i}" />
        <span class="mission-check">✓</span>
        <span class="mission-text">${esc(m)}</span>
      </label>`).join('');
    $$('input', list).forEach((c) => c.addEventListener('change', updateCoachProgress));
    updateCoachProgress();
  }
  function updateCoachProgress() {
    const boxes = $$('#missionList input');
    const done = boxes.filter((b) => b.checked).length;
    $('#coachCount').textContent = done + '/' + boxes.length;
    $('#coachFill').style.width = (boxes.length ? (done / boxes.length) * 100 : 0) + '%';
    boxes.forEach((b) => b.closest('.mission').classList.toggle('done', b.checked));
  }

  // ---------- 예시/복사/유틸 ----------
  function bindExamples() {
    $$('.examples[data-target]').forEach((wrap) => {
      const target = '#' + wrap.dataset.target;
      $$('.ex', wrap).forEach((b) =>
        b.addEventListener('click', () => { $(target).value = b.dataset.ex; $(target).focus(); }));
    });
  }
  function copy(item, text) {
    const done = () => {
      item.classList.add('copied');
      $('.reply-copy', item).textContent = '복사됨 ✓';
      setTimeout(() => { item.classList.remove('copied'); $('.reply-copy', item).textContent = '복사'; }, 1500);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    else fallbackCopy(text, done);
  }
  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta); cb && cb();
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function shake(el) {
    el.focus();
    el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 250 });
  }

  // ---------- init ----------
  initRelationGroups();
  initTranslator();
  initKakao();
  initDiagnosis();
  initReadCheck();
  initReply();
  initCoach();
  showView('home');
})();
