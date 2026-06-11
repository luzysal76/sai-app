/**
 * 헤아림 - 코어 + 탭 네비게이션 + 도구 컨트롤러
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const E = window.HearimEngine, A = window.HearimAnalyzers;

  const TABS = ['home','relmap','tools','diary'];
  const META = {
    home:     { title:'헤아림', sub:'연애·인간관계 번역기 · 恋爱关系沟通解析' },
    relmap:   { title:'관계 지도 · 关系图谱', sub:'내 주변 사람들을 RPG처럼' },
    tools:    { title:'도구 · 工具', sub:'8가지 관계 분석 도구 · 8种关系分析工具' },
    diary:    { title:'감정 일기 · 情感日记', sub:'오늘의 관계 감정 기록' },
    translator:  { title:'대화 번역기 · 对话解析器', sub:'상대 말의 진짜 속뜻 · 言下之意' },
    kakao:       { title:'카톡 분석기 · 聊天分析器', sub:'관심도·답장 추천 · 关注度分析' },
    diagnosis:   { title:'관계 진단 · 关系诊断', sub:'현재 상태·발전 가능성 · 现状分析' },
    readcheck:   { title:'읽씹 분석 · 不回消息分析', sub:'무응답 가능성 해석' },
    reply:       { title:'답장 생성기 · 回复生成器', sub:'톤별 답장 추천 · 风格化回复' },
    coach:       { title:'성장 코치 · 关系成长', sub:'오늘의 관계 미션 · 今日任务' },
    aidiag:      { title:'AI 관계 진단 · AI关系诊断', sub:'친밀도·신뢰도 분석' },
    capture:     { title:'대화 캡처 분석 · 截图分析', sub:'감정·위험 신호 탐지 · 情感检测' },
    'relmap-add':{ title:'관계 추가·편집 · 添加/编辑', sub:'' },
    'timeline':  { title:'관계 타임라인 · 关系时间线', sub:'우리 관계의 변화 흐름 · 关系变化历程' },
  };

  let NAV = { tab: 'home', page: null };

  // ---------- 공유 유틸 (window.HU 노출, app-new.js에서 사용) ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shake = (el) => { el?.focus(); el?.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:250}); };
  const sleep = (ms) => new Promise(r=>setTimeout(r,ms));

  function renderTags(el, tags) { el.innerHTML=(tags||[]).map(t=>`<span class="emotion-tag">${esc(t)}</span>`).join(''); }
  function renderPoss(el, list) {
    el.innerHTML=(list||[]).map(p=>`<div class="poss-row"><span class="poss-label">${esc(p.label)}</span><div class="poss-track"><div class="poss-fill" style="width:0%"></div></div><span class="poss-pct">${p.pct}%</span></div>`).join('');
    requestAnimationFrame(()=>{ $$('.poss-fill',el).forEach((f,i)=>{f.style.width=list[i].pct+'%';}); });
  }
  function renderThermo(el, temp) {
    el.innerHTML=`<span class="thermo-icon">${temp.icon}</span><div class="thermo-text"><b>${temp.label}</b><span>${esc(temp.desc)}</span></div>`;
    el.className='thermo thermo-'+temp.level;
  }
  function renderReplies(el, replies) {
    el.innerHTML='';
    (replies||[]).forEach(rep=>{
      const item=document.createElement('div'); item.className='reply-item';
      item.innerHTML=`<span class="reply-style">${esc(rep.style)}형</span><span class="reply-text">${esc(rep.text)}</span><span class="reply-copy">복사</span>`;
      item.addEventListener('click',()=>copy(item,rep.text)); el.appendChild(item);
    });
  }
  function copy(item, text) {
    const done=()=>{ item.classList.add('copied'); $('.reply-copy',item).textContent='복사됨 ✓'; setTimeout(()=>{ item.classList.remove('copied'); $('.reply-copy',item).textContent='복사'; },1500); };
    if(navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(()=>fbCopy(text,done)); else fbCopy(text,done);
  }
  function fbCopy(text,cb){ const ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); cb&&cb(); }
  function withLoading(resultId, fn) {
    const result=$('#'+resultId); result.classList.add('hidden');
    const loading=$('#loading'); loading.classList.remove('hidden');
    setTimeout(()=>{ loading.classList.add('hidden'); fn(); result.classList.remove('hidden'); result.scrollIntoView({behavior:'smooth',block:'start'}); }, 650);
  }

  window.HU = { esc, shake, sleep, renderTags, renderPoss, renderThermo, renderReplies, copy, withLoading };

  // ---------- 네비게이션 ----------
  const backBtn = $('#backBtn');

  function updateUI() {
    const activeId = NAV.page ? `page-${NAV.page}` : `tab-${NAV.tab}`;
    $$('.page').forEach(p=>p.classList.add('hidden'));
    $('#'+activeId)?.classList.remove('hidden');
    const m = META[NAV.page||NAV.tab] || META.home;
    $('#headerTitle').textContent = m.title;
    $('#headerSub').textContent   = m.sub;
    backBtn.classList.toggle('hidden', !NAV.page);
    $$('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===NAV.tab));
    window.scrollTo({top:0});
  }

  function showTab(tab) { NAV={tab,page:null}; updateUI(); }
  function showPage(page) { NAV={...NAV, page}; updateUI(); }
  function goBack() { NAV={...NAV, page:null}; updateUI(); if(NAV.tab==='relmap') window.HU._renderRelmap?.(); }

  window.HN = { showTab, showPage, goBack };

  backBtn.addEventListener('click', goBack);
  $$('.tab-btn').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));

  // ---------- 홈: 도구 그리드 클릭 ----------
  function bindToolGrid(gridEl) {
    gridEl?.addEventListener('click', e=>{
      const c=e.target.closest('[data-go]'); if(!c) return;
      NAV.tab='tools'; showPage(c.dataset.go);
    });
  }
  bindToolGrid($('#homeGrid'));
  bindToolGrid($('#tab-tools'));

  // 관계지도 CTA
  $('#relmapCta')?.addEventListener('click',()=>showTab('relmap'));

  // ---------- 홈: 오늘의 관계 리포트 ----------
  function initHome() {
    const D = window.HearimDiary, R = window.HearimRelations;
    const dateStr = D.todayFormatted();
    $('#reportDate').textContent = dateStr;

    function refreshHome() {
      const relScore = R.avgAffinity();
      const diary    = D.getToday();
      const diaryNum = diary ? (diary.mood-1)*25 : null;
      let score;
      if(relScore!==null && diaryNum!==null) score=Math.round(relScore*.7+diaryNum*.3);
      else if(relScore!==null) score=relScore;
      else if(diaryNum!==null) score=Math.round(diaryNum*.5+50*.5);
      else score=null;

      if(score!==null) {
        const temp=E.temperature(score);
        $('#reportIcon').textContent=temp.icon;
        $('#reportScore').textContent=score+'점';
        requestAnimationFrame(()=>{ $('#reportBarFill').style.width=score+'%'; });
        $('#reportHint').textContent=temp.desc;
      } else {
        $('#reportScore').textContent='측정 중';
        $('#reportHint').textContent='관계 지도에 사람을 등록하거나 일기를 써보세요';
      }

      // 오늘의 미션 3개
      const seed = new Date().getDate();
      const missions = A.dailyMissions('friend', seed);
      const mContainer = $('#reportMissions');
      mContainer.innerHTML='';
      missions.forEach(m=>{
        const el=document.createElement('div'); el.className='report-mission';
        el.innerHTML=`<div class="report-mission-cb">✓</div><span>${esc(m)}</span>`;
        el.addEventListener('click',()=>el.classList.toggle('done'));
        mContainer.appendChild(el);
      });
    }
    refreshHome();
    window.HU._refreshHome = refreshHome;
  }

  // ---------- 관계 그룹 초기화 ----------
  const RELATIONS = [{v:'lover',t:'💑 연인'},{v:'some',t:'💗 썸'},{v:'friend',t:'🧑 친구'},{v:'family',t:'👨‍👩‍👧 가족'},{v:'work',t:'💼 직장'}];
  function initRelationGroups() {
    $$('.relation-group:not(.rel-type-group)').forEach(g=>{
      g.dataset.relation='lover';
      g.innerHTML=RELATIONS.map((r,i)=>`<button class="chip${i===0?' active':''}" data-relation="${r.v}">${r.t}</button>`).join('');
      g.addEventListener('click',e=>{ const b=e.target.closest('.chip'); if(!b)return; $$('.chip',g).forEach(c=>c.classList.remove('active')); b.classList.add('active'); g.dataset.relation=b.dataset.relation; });
    });
  }
  const relOf = (pgId) => ($('.relation-group',$(pgId)||document)||{}).dataset?.relation || 'lover';

  // ---------- 도구: 대화 번역기 ----------
  function initTranslator() {
    $$('#page-translator .ex').forEach(b=>b.addEventListener('click',()=>{ $('#trInput').value=b.dataset.ex; }));
    $('#trBtn').addEventListener('click',()=>{
      const text=$('#trInput').value.trim(); if(!text)return shake($('#trInput'));
      withLoading('trResult', async()=>{
        const r=await E.translate(text, relOf('#page-translator'));
        $('#trSurface').textContent=r.surface||''; $('#trHidden').textContent=r.hidden||'';
        renderTags($('#trEmotions'),r.emotions||[]); renderPoss($('#trPoss'),r.possibilities||[]);
        $('#trAction').textContent=r.action||''; $('#trTip').textContent=r.tip||'';
        const conf=r.confidence||75;
        const c=$('#trConf'); requestAnimationFrame(()=>c.style.width=conf+'%');
        $('#trConfVal').textContent=conf+'%';
        if(r.replies?.length) renderReplies($('#trResult .reply-list')||document.createElement('div'),r.replies);
        // AI 사용 여부 표시
        const badge=r.source==='claude'?'🤖 Claude AI 분석':'📚 DB 분석';
        $('#trTip').textContent=(r.tip||'')+' ('+badge+')';
      });
    });
  }

  // ---------- 도구: 카톡 분석기 ----------
  function initKakao() {
    $('#kkBtn').addEventListener('click',()=>{
      const text=$('#kkInput').value.trim(); if(!text)return shake($('#kkInput'));
      withLoading('kkResult', async()=>{
        // Claude AI 우선 시도, 실패 시 DB fallback
        let r = await E.translateKakao(text, relOf('#page-kakao'));
        if (!r) r = A.analyzeKakao(text);
        $('#kkScore').textContent=r.score+'점';
        const hearts='❤️'.repeat(Math.min(5,Math.round((r.hearts||r.score/20)))).padEnd(0,'🤍')||'';
        $('#kkHearts').textContent=hearts;
        renderThermo($('#kkThermo'),E.temperature(r.score));
        renderTags($('#kkEmotions'),r.emotions||[]);
        renderReplies($('#kkReplies'),r.replies||[]); $('#kkTip').textContent=r.tip||'';
      });
    });
  }

  // ---------- 도구: 관계 진단 ----------
  function initDiagnosis() {
    $$('#page-diagnosis .seg').forEach(seg=>{ seg.dataset.value='1'; seg.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b)return; $$('button',seg).forEach(x=>x.classList.remove('active')); b.classList.add('active'); seg.dataset.value=b.dataset.v; }); });
    $('#dgBtn').addEventListener('click',()=>{
      const ans={ reply:+$('#page-diagnosis .seg[data-q="reply"]').dataset.value, meet:+$('#page-diagnosis .seg[data-q="meet"]').dataset.value, first:+$('#page-diagnosis .seg[data-q="first"]').dataset.value };
      withLoading('dgResult',()=>{
        const r=A.diagnose(relOf('#page-diagnosis'),ans);
        $('#dgStage').textContent=r.stage; renderThermo($('#dgThermo'),r.temp);
        $('#dgScore').textContent=r.score+'%'; $('#dgPotential').textContent=r.potential;
        $('#dgAdvice').textContent=r.advice;
      });
    });
  }

  // ---------- 도구: 읽씹 분석 ----------
  function initReadCheck() {
    $$('#page-readcheck .quick-hours .ex').forEach(b=>b.addEventListener('click',()=>{ $('#rcInput').value=b.dataset.h; }));
    $('#rcBtn').addEventListener('click',()=>{
      withLoading('rcResult',()=>{
        const r=A.analyzeReadCheck($('#rcInput').value,relOf('#page-readcheck'));
        $('#rcHours').textContent=r.hours+'시간째 무응답';
        const w=$('#rcWorry'); w.textContent='우려도 '+r.worryLevel; w.className='worry worry-'+r.worryLevel;
        renderPoss($('#rcPoss'),r.possibilities);
        $('#rcCaution').textContent=r.caution; $('#rcTip').textContent=r.tip;
      });
    });
  }

  // ---------- 도구: 답장 생성기 ----------
  function initReply() {
    $('#rpBtn').addEventListener('click',()=>{
      const text=$('#rpInput').value.trim(); if(!text)return shake($('#rpInput'));
      withLoading('rpResult',()=>{
        const r=A.generateReply(text,relOf('#page-reply'));
        renderReplies($('#rpReplies'),r.replies); $('#rpNote').textContent=r.note;
      });
    });
  }

  // ---------- 도구: 성장 코치 ----------
  let coachSeed=0;
  function initCoach() {
    const grp=$('.relation-group',document.getElementById('page-coach'));
    grp?.addEventListener('click',()=>renderMissions());
    $('#coachRefresh').addEventListener('click',()=>{ coachSeed++; renderMissions(); });
    renderMissions();
  }
  function renderMissions() {
    const rel=relOf('#page-coach'), missions=A.dailyMissions(rel,coachSeed);
    const list=$('#missionList');
    list.innerHTML=missions.map(m=>`<label class="mission"><input type="checkbox"/><span class="mission-check">✓</span><span class="mission-text">${esc(m)}</span></label>`).join('');
    $$('input',list).forEach(c=>c.addEventListener('change',updateCoachProgress));
    updateCoachProgress();
  }
  function updateCoachProgress() {
    const boxes=$$('#missionList input'), done=boxes.filter(b=>b.checked).length;
    $('#coachCount').textContent=done+'/'+boxes.length;
    $('#coachFill').style.width=(boxes.length?(done/boxes.length)*100:0)+'%';
    boxes.forEach(b=>b.closest('.mission').classList.toggle('done',b.checked));
  }

  // ---------- 도구: AI 관계 진단 ----------
  function initAiDiag() {
    $('#adBtn').addEventListener('click',()=>{
      const chat=$('#adChat').value.trim(), concern=$('#adConcern').value.trim();
      if(!chat&&!concern)return shake($('#adChat'));
      withLoading('adResult', async()=>{
        // Claude AI 우선, 실패 시 로컬 분석
        let r = await E.translateDiag(chat, concern, relOf('#page-aidiag'));
        if (!r) r = A.analyzeAiDiag(chat, concern, relOf('#page-aidiag'));
        const metrics=[
          {icon:'💗',label:'친밀도 / 亲密度',val:r.affinity,color:'#ff6b9d'},
          {icon:'🤝',label:'신뢰도 / 信任度',val:r.trust,color:'#6b4eaa'},
          {icon:'💙',label:'감정 안정성 / 稳定性',val:r.stability,color:'#4a9eff'},
          {icon:'💬',label:'소통 만족도 / 沟通满意度',val:r.satisfaction,color:'#41c46e'},
        ];
        const grid=$('#adGrid');
        grid.innerHTML=metrics.map(m=>`
          <div class="ai-metric">
            <div class="am-head"><span class="am-icon">${m.icon}</span><span class="am-val" data-v="${m.val}">0%</span></div>
            <div class="am-track"><div class="am-fill" style="width:0%;background:linear-gradient(90deg,${m.color},${m.color}99)"></div></div>
            <span class="am-label">${esc(m.label)}</span>
          </div>`).join('');
        requestAnimationFrame(()=>{
          $$('.am-val',grid).forEach((el,i)=>{ el.textContent=metrics[i].val+'%'; });
          $$('.am-fill',grid).forEach((el,i)=>{ el.style.width=metrics[i].val+'%'; });
        });
        // AI 인사이트 표시
        if(r.insight) { $('#adNote').textContent=r.insight; }
        else if(r.source==='claude') { $('#adNote').textContent='Claude AI 분석 결과예요. 数据来自AI分析。'; }
      });
    });
  }

  // ---------- 도구: 대화 캡처 분석 ----------
  function initCapture() {
    const fileInput=$('#captureFile'), zone=$('#captureZone'), btn=$('#captureBtn'), preview=$('#capturePreview');
    zone.addEventListener('click',()=>fileInput.click());
    fileInput.addEventListener('change',()=>{
      const file=fileInput.files[0]; if(!file)return;
      const reader=new FileReader();
      reader.onload=e=>{ preview.src=e.target.result; preview.classList.remove('hidden'); $('.capture-icon',zone).style.display='none'; $('.capture-hint',zone).style.display='none'; btn.classList.remove('hidden'); };
      reader.readAsDataURL(file);
    });
    btn.addEventListener('click',()=>{
      const file=fileInput.files[0];
      const seed=(file?.name?.length||0)+(file?.size||0);
      withLoading('captureResult',()=>{
        const r=A.analyzeCaptureSimulated(seed);
        renderPoss($('#capturePoss'),r.emotions);
        const rc=$('#captureRiskCard'), risks=$('#captureRisks');
        if(r.risks&&r.risks.length){ rc.classList.remove('hidden'); risks.innerHTML=r.risks.map(x=>`<div class="risk-item">⚠️ ${esc(x)}</div>`).join(''); }
        else rc.classList.add('hidden');
        $('#captureTip').textContent=r.note;
      });
    });
  }

  // ---------- init ----------
  function init() {
    initRelationGroups();
    initHome();
    initTranslator(); initKakao(); initDiagnosis(); initReadCheck();
    initReply(); initCoach(); initAiDiag(); initCapture();
    updateUI();
  }
  init();
})();
