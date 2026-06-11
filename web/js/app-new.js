/**
 * 헤아림 - 관계 지도 + 감정 일기 컨트롤러
 * window.HU (shared utils), window.HN (nav), HearimRelations, HearimDiary 사용
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const R = window.HearimRelations, D = window.HearimDiary;
  const { esc, shake } = window.HU;
  const { showPage, goBack } = window.HN;

  const FREQ_PCT  = [20, 55, 85];
  const CONFL_PCT = [15, 45, 80];

  // ==================== 관계 지도 탭 ====================
  function renderRelmap() {
    const list = R.getAll();
    const empty = $('#relmapEmpty'), cards = $('#relCards'), summary = $('#relmapSummary');

    if (!list.length) {
      empty.classList.remove('hidden'); cards.innerHTML = ''; summary.classList.add('hidden'); return;
    }
    empty.classList.add('hidden');
    const avg = R.avgAffinity();
    summary.classList.remove('hidden');
    summary.textContent = `${list.length}명 등록됨 · 평균 친밀도 ${avg}%`;

    cards.innerHTML = list.map(p => {
      const rk = R.rank(p.affinity);
      const freqPct   = FREQ_PCT[p.frequency] ?? 55;
      const conflPct  = CONFL_PCT[p.conflict] ?? 15;
      const freqLabel = R.FREQ_LABEL[p.frequency] ?? '보통';
      const conflLabel= R.FREQ_LABEL[p.conflict] ?? '낮음';
      const conflClass= p.conflict >= 2 ? 'red' : p.conflict === 1 ? 'green' : 'green';
      return `
        <div class="rel-card" style="--rank-color:${rk.color};--rank-glow:${rk.glow}">
          <div class="rel-card-head">
            <span class="rel-emoji">${esc(p.emoji)}</span>
            <div><div class="rel-name">${esc(p.name)}</div><div class="rel-type">${esc(R.TYPE_LABEL[p.type]||p.type)}</div></div>
            <div style="text-align:center">
              <div class="rank-badge" style="--rb-color:${rk.color}">${rk.label}</div>
              <div class="rank-desc">${rk.desc}</div>
            </div>
          </div>
          <div class="rel-stats">
            <div class="rel-stat"><span class="stat-l">친밀도</span><div class="stat-track"><div class="stat-fill pink" style="width:${p.affinity}%"></div></div><span class="stat-v">${p.affinity}%</span></div>
            <div class="rel-stat"><span class="stat-l">대화량</span><div class="stat-track"><div class="stat-fill blue" style="width:${freqPct}%"></div></div><span class="stat-v">${freqLabel}</span></div>
            <div class="rel-stat"><span class="stat-l">갈등</span><div class="stat-track"><div class="stat-fill ${conflClass}" style="width:${conflPct}%"></div></div><span class="stat-v">${conflLabel}</span></div>
          </div>
          <div class="rel-actions">
            <button class="rel-action-btn" data-id="${p.id}" data-action="edit">편집</button>
            <button class="rel-action-btn danger" data-id="${p.id}" data-action="delete">삭제</button>
          </div>
        </div>`;
    }).join('');

    $$('.rel-action-btn', cards).forEach(btn => {
      btn.addEventListener('click', e => {
        const { id, action } = e.currentTarget.dataset;
        if (action === 'delete') { if (confirm('삭제할까요?')) { R.remove(id); renderRelmap(); window.HU._refreshHome?.(); } }
        if (action === 'edit')   { openRelForm(id); }
      });
    });
  }
  window.HU._renderRelmap = renderRelmap;

  // ---------- 추가/편집 폼 ----------
  let selectedEmoji = '🧑';
  const RELS = [{v:'lover',t:'💑 연인'},{v:'some',t:'💗 썸'},{v:'friend',t:'🧑 친구'},{v:'family',t:'👨‍👩‍👧 가족'},{v:'work',t:'💼 직장'}];

  function initRelTypeChips() {
    const g = $('.rel-type-group');
    if (!g || g._init) return; g._init = true;
    g.dataset.relation = 'friend';
    g.innerHTML = RELS.map((r,i)=>`<button class="chip${i===2?' active':''}" data-relation="${r.v}">${r.t}</button>`).join('');
    g.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if(!b) return;
      $$('.chip', g).forEach(c=>c.classList.remove('active')); b.classList.add('active');
      g.dataset.relation = b.dataset.relation;
    });
  }

  function initRelForm() {
    // emoji picker
    $$('.epick').forEach(b => b.addEventListener('click', () => {
      $$('.epick').forEach(x=>x.classList.remove('active')); b.classList.add('active');
      selectedEmoji = b.dataset.e;
    }));
    // seg buttons
    $$('#page-relmap-add .seg').forEach(seg => {
      seg.dataset.value = seg.dataset.q === 'conf' ? '0' : '1';
      seg.addEventListener('click', e => {
        const b=e.target.closest('button'); if(!b)return;
        $$('button',seg).forEach(x=>x.classList.remove('active')); b.classList.add('active');
        seg.dataset.value=b.dataset.v;
      });
    });
    // slider
    const slider = $('#relAffinity'), val = $('#affinityVal');
    slider.addEventListener('input', () => { val.textContent = slider.value + '%'; });
    // save
    $('#relSaveBtn').addEventListener('click', () => {
      const name = $('#relName').value.trim(); if(!name) return shake($('#relName'));
      const typeEl = $('.rel-type-group');
      const person = {
        name, emoji: selectedEmoji,
        type: typeEl?.dataset.relation || 'friend',
        affinity: +$('#relAffinity').value,
        frequency: +$('#page-relmap-add .seg[data-q="freq"]').dataset.value,
        conflict:  +$('#page-relmap-add .seg[data-q="conf"]').dataset.value,
      };
      R.upsert(person, $('#relEditId').value || null);
      goBack(); renderRelmap(); window.HU._refreshHome?.();
    });
  }

  function openRelForm(editId) {
    initRelTypeChips();
    const p = editId ? R.getAll().find(x=>x.id===editId) : null;
    $('#relEditId').value = editId || '';
    $('#relName').value = p?.name || '';
    selectedEmoji = p?.emoji || '🧑';
    $$('.epick').forEach(b=>{ b.classList.toggle('active', b.dataset.e===selectedEmoji); });
    const typeGrp=$('.rel-type-group');
    if(typeGrp){ const t=p?.type||'friend'; $$('.chip',typeGrp).forEach(c=>{ c.classList.toggle('active',c.dataset.relation===t); }); typeGrp.dataset.relation=t; }
    $('#relAffinity').value = p?.affinity ?? 50; $('#affinityVal').textContent=(p?.affinity??50)+'%';
    ['freq','conf'].forEach(q=>{
      const seg=$(`#page-relmap-add .seg[data-q="${q}"]`);
      const defaultVal = q==='conf' ? '0' : '1';
      const val = String(q==='freq' ? (p?.frequency??1) : (p?.conflict??0));
      $$('button',seg).forEach(b=>b.classList.toggle('active',b.dataset.v===val));
      seg.dataset.value=val;
    });
    showPage('relmap-add');
  }

  // 관계 추가 버튼 이벤트
  ['#addRelBtn','#addRelBtnEmpty'].forEach(id=>{
    $(id)?.addEventListener('click',()=>{ initRelTypeChips(); openRelForm(null); });
  });

  // ==================== 감정 일기 탭 ====================
  let selectedMood = 3;

  function initDiary() {
    $('#diaryTodayDate').textContent = D.todayFormatted();
    const today = D.getToday();
    if(today) { loadDiaryEntry(today); }

    // mood selector
    $$('#moodRow .mood-btn').forEach(b=>{
      b.addEventListener('click',()=>{
        $$('#moodRow .mood-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active'); selectedMood=+b.dataset.mood;
      });
    });
    if(today) {
      const mb=$(`#moodRow .mood-btn[data-mood="${today.mood}"]`);
      mb?.classList.add('active'); selectedMood=today.mood||3;
    } else {
      $(`#moodRow .mood-btn[data-mood="3"]`)?.classList.add('active');
    }

    // save
    $('#diarySaveBtn').addEventListener('click',()=>{
      const people=$('#diaryPeople').value.split(/[,，\s]+/).map(s=>s.trim()).filter(Boolean);
      D.saveEntry({ mood:selectedMood, people, note:$('#diaryNote').value.trim() });
      $('#diarySavedBadge').classList.remove('hidden');
      setTimeout(()=>$('#diarySavedBadge').classList.add('hidden'),2000);
      renderDiaryHistory(); renderDiaryPattern(); window.HU._refreshHome?.();
    });

    renderDiaryHistory(); renderDiaryPattern();
  }

  function loadDiaryEntry(entry) {
    $('#diaryPeople').value=(entry.people||[]).join(', ');
    $('#diaryNote').value=entry.note||'';
  }

  function renderDiaryHistory() {
    const entries=D.getRecent(7);
    const hist=$('#diaryHistory');
    if(!entries.length){ hist.innerHTML=''; return; }
    hist.innerHTML=entries.map(e=>`
      <div class="diary-entry">
        <span class="de-mood">${D.MOOD_EMOJI[e.mood]||'😐'}</span>
        <div class="de-body">
          <div class="de-date">${D.formatDate(e.date)}</div>
          <div class="de-note">${esc(e.note||'기록 없음')}</div>
          ${e.people?.length?`<div class="de-people">👥 ${esc(e.people.join(', '))}</div>`:''}
        </div>
      </div>`).join('');
  }

  function renderDiaryPattern() {
    const p=D.analyzePattern();
    const el=$('#diaryPattern');
    if(!p){ el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    $('#diaryPatternText').textContent=p.insight;
  }

  // ==================== init ====================
  initRelForm();
  initDiary();
  renderRelmap();
})();
