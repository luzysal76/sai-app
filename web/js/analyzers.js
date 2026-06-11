/**
 * 헤아림 - 분석기 모음 (순수 함수, 휴리스틱)
 * window.HearimAnalyzers:
 *  analyzeKakao(text)              2. 카톡 분석기
 *  diagnose(relation, answers)     3. 관계 진단
 *  analyzeReadCheck(hours, rel)    4. 읽씹·안읽씹 분석
 *  generateReply(text, relation)   5. 답장 생성기
 *  dailyMissions(relation)         성장 코치 미션
 */
(function () {
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const count = (text, arr) => arr.reduce((a, t) => a + (text.split(t).length - 1), 0);

  /** 2. 카톡 분석기 */
  function analyzeKakao(raw) {
    const text = (raw || '').trim();
    if (!text) return null;
    const S = window.HEARIM_SIGNALS;
    const lines = text.split(/\n+/).filter((l) => l.trim()).length || 1;

    const pos = count(text, S.positive);
    const emo = count(text, S.emoji);
    const q = count(text, S.question);
    const init = count(text, S.initiative);
    const neg = count(text, S.negative);

    // 관심도 점수 (0~100) 휴리스틱
    let score = 45 + pos * 5 + emo * 2 + q * 4 + init * 7 - neg * 4;
    // 짧고 성의없는 답(라인 대비 신호 적음) 보정
    if (pos + emo + q + init === 0) score -= 12;
    score = Math.round(clamp(score, 5, 98));

    const emotions = [];
    if (pos + emo >= 4) emotions.push('😊 편안함');
    if (q >= 2) emotions.push('💬 대화 유지 의지');
    if (init >= 1) emotions.push('💗 호감 있음');
    if (emo >= 5) emotions.push('🥰 친밀함');
    if (neg >= 3) emotions.push('😐 시큰둥');
    if (emotions.length === 0) emotions.push('🤔 중립');

    const replies = buildReplies(score, 'some');
    return {
      score,
      hearts: hearts(score),
      emotions,
      replies,
      signals: { pos, emo, q, init, neg, lines },
      tip: score >= 60
        ? '좋은 신호예요. 너무 들이대기보다 페이스 유지하며 만남을 제안해보세요.'
        : score >= 35
          ? '신호가 섞여 있어요. 상대 답장 속도와 이모티콘을 함께 관찰하세요.'
          : '지금은 거리감이 느껴져요. 부담 주지 말고 가벼운 안부부터.',
    };
  }

  function hearts(score) {
    const full = Math.round(score / 20);
    return '❤️'.repeat(full) + '🤍'.repeat(5 - full);
  }

  function buildReplies(score, rel) {
    if (score >= 60) {
      return [
        { style: '다정', text: '오늘 너랑 얘기하니까 기분 좋다 :)' },
        { style: '유머', text: '대화 케미 보소 ㅋㅋ 우리 잘 맞는 듯?' },
        { style: '썸', text: '이렇게 톡만 하기 아쉬운데~ 곧 얼굴 볼래?' },
      ];
    }
    if (score >= 35) {
      return [
        { style: '공감', text: '오 그렇구나~ 더 듣고 싶다' },
        { style: '다정', text: '얘기 나눠서 좋았어. 또 연락하자' },
        { style: '썸', text: '다음엔 직접 만나서 얘기하면 더 재밌겠다 ㅎㅎ' },
      ];
    }
    return [
      { style: '공감', text: '응 알겠어~ 편할 때 또 얘기하자' },
      { style: '다정', text: '바쁜가 보다. 무리하지 말고 푹 쉬어' },
      { style: '유머', text: '답장 아껴 쓰는 스타일? ㅎㅎ 천천히 해도 돼' },
    ];
  }

  /** 3. 관계 진단
   * answers: { reply: 0~2(느림~빠름), meet: 0~2(드묾~잦음), first: 0~2(내가먼저~상대가먼저) }
   */
  function diagnose(relation, answers) {
    const a = answers || { reply: 1, meet: 1, first: 1 };
    const raw = (a.reply + a.meet + a.first) / 6; // 0~1
    const score = Math.round(clamp(20 + raw * 75, 10, 95));

    const relName = { lover: '연인', some: '썸', friend: '친구', family: '가족', work: '직장' }[relation] || '관계';
    let stage, advice, potential;
    if (score >= 70) {
      stage = `${relName} · 안정 단계`;
      potential = '높음';
      advice = relation === 'some'
        ? '감정 확인보다 만남 횟수를 늘리는 것이 유리해요. 곧 고백 타이밍.'
        : '지금처럼 표현을 꾸준히 이어가면 관계가 더 깊어져요.';
    } else if (score >= 45) {
      stage = `${relName} · 발전 가능 단계`;
      potential = '보통';
      advice = '먼저 연락·만남 제안 빈도를 살짝 높여보세요. 작은 표현이 분위기를 바꿔요.';
    } else {
      stage = `${relName} · 거리감 단계`;
      potential = '낮음~보통';
      advice = '부담 주지 말고 가벼운 공통 관심사부터. 조급함이 가장 큰 적이에요.';
    }
    return { score, stage, potential, advice, temp: window.HearimEngine.temperature(score) };
  }

  /** 4. 읽씹·안읽씹 분석 */
  function analyzeReadCheck(hours, relation) {
    const h = clamp(Number(hours) || 0, 0, 168);
    const m = window.HEARIM_READMODEL;
    // 시간이 길수록 우선순위 낮음/거리두기 가중
    const t = clamp(h / 24, 0, 1.5);
    const dist = m.base.map((b) => ({ ...b }));
    const adj = (key, d) => { const x = dist.find((o) => o.key === key); if (x) x.pct += d; };
    adj('busy', -18 * t);
    adj('low', 10 * t);
    adj('distance', 12 * t);
    adj('style', -2 * t);
    // 정규화
    dist.forEach((o) => (o.pct = Math.max(2, o.pct)));
    const sum = dist.reduce((s, o) => s + o.pct, 0);
    dist.forEach((o) => (o.pct = Math.round((o.pct / sum) * 100)));
    fixTo100(dist);
    dist.sort((a, b) => b.pct - a.pct);

    let level = '낮음';
    if (h >= 24) level = '높음';
    else if (h >= 8) level = '보통';

    return {
      hours: h,
      possibilities: dist,
      worryLevel: level,
      caution: m.caution,
      tip: h < 6
        ? '아직 충분히 기다릴 시간이에요. 연속 톡은 자제하세요.'
        : h < 24
          ? '하루 이내는 흔해요. 한 번 더 보내되 가볍게.'
          : '하루 이상이면 패턴을 보세요. 매달리기보다 여유 있게 한 번만.',
    };
  }

  /** 5. 답장 생성기 — DB 매칭 우선, 없으면 톤별 템플릿 */
  function generateReply(rawText, relation) {
    const r = window.HearimEngine.interpret(rawText, relation);
    if (r && r.replies && r.replies.length) {
      return { source: r.source, replies: r.replies, note: r.action };
    }
    const text = (rawText || '').trim();
    return {
      source: 'template',
      note: '딱 맞는 표현이 DB에 없어 기본 톤으로 생성했어요.',
      replies: [
        { style: '공감', text: `그랬구나, ${snippet(text)} 충분히 그럴 수 있어` },
        { style: '다정', text: '얘기해줘서 고마워. 내가 옆에 있을게' },
        { style: '유머', text: '오 흥미로운데? ㅎㅎ 더 자세히 말해봐' },
        { style: '썸', text: '네 얘기 들으니까 더 보고 싶어지는데 :)' },
      ],
    };
  }

  function snippet(t) {
    const s = (t || '').slice(0, 14);
    return s ? `"${s}${t.length > 14 ? '…' : ''}" ` : '';
  }

  /** 성장 코치 — 관계별 오늘의 미션 3개 (seed로 회전) */
  function dailyMissions(relation, seed) {
    const pool = (window.HEARIM_MISSIONS[relation] || window.HEARIM_MISSIONS.friend).slice();
    const s = (seed || 0) % pool.length;
    const rotated = pool.slice(s).concat(pool.slice(0, s));
    return rotated.slice(0, 3);
  }

  function fixTo100(dist) {
    const diff = 100 - dist.reduce((s, o) => s + o.pct, 0);
    if (diff !== 0 && dist.length) dist[0].pct += diff;
  }

  /** 6. AI 관계 진단 — 텍스트 키워드 기반 휴리스틱 */
  function analyzeAiDiag(recentChat, concern, relation) {
    const text  = ((recentChat || '') + ' ' + (concern || '')).toLowerCase();
    const pos   = ['좋아','행복','감사','사랑','재밌','설레','기쁘','웃','귀여','보고싶'].reduce((s,w)=>s+(text.split(w).length-1),0);
    const neg   = ['싫어','화','답답','불안','서운','외로','힘들','갈등','싸움','짜증','지쳐','무서'].reduce((s,w)=>s+(text.split(w).length-1),0);
    const base  = { lover:68, some:55, friend:63, family:60, work:48 }[relation] || 58;
    const len   = text.trim().length;
    const bonus = len > 80 ? 5 : len > 30 ? 2 : -3;
    const c     = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(n)));
    return {
      affinity:    c(base + pos*4 - neg*5 + bonus, 20, 96),
      trust:       c(base + 8 + pos*3 - neg*4 + bonus, 20, 96),
      stability:   c(62 - neg*7 + pos*3, 15, 92),
      satisfaction:c(base - 5 + pos*5 - neg*6 + bonus, 15, 90),
    };
  }

  /** 7. 캡처 분석 — 시뮬레이션 (AI 연동 전 데모) */
  function analyzeCaptureSimulated(seed) {
    const idx = ((seed || 0) % 5 + 5) % 5;
    const templates = [
      { emotions:[{label:'😊 긍정',pct:45},{label:'😐 중립',pct:35},{label:'😢 서운함',pct:12},{label:'😡 화남',pct:8}],  risks:['단답형 응답이 다소 많아요'] },
      { emotions:[{label:'😊 긍정',pct:62},{label:'😐 중립',pct:25},{label:'😢 서운함',pct:9}, {label:'😡 화남',pct:4}],  risks:[] },
      { emotions:[{label:'😊 긍정',pct:28},{label:'😐 중립',pct:32},{label:'😢 서운함',pct:25},{label:'😡 화남',pct:15}], risks:['방어적 표현이 증가하고 있어요','감정 표현이 줄어들고 있어요'] },
      { emotions:[{label:'😊 긍정',pct:55},{label:'😐 중립',pct:28},{label:'😢 서운함',pct:12},{label:'😡 화남',pct:5}],  risks:['대화 주도권이 한쪽에 치우쳐 있어요'] },
      { emotions:[{label:'😊 긍정',pct:72},{label:'😐 중립',pct:18},{label:'😢 서운함',pct:7}, {label:'😡 화남',pct:3}],  risks:[] },
    ];
    return { ...templates[idx], note:'AI 연동 시 실제 대화 내용을 분석해 더 정확한 결과를 제공해요.' };
  }

  window.HearimAnalyzers = {
    analyzeKakao, diagnose, analyzeReadCheck, generateReply, dailyMissions,
    analyzeAiDiag, analyzeCaptureSimulated,
  };
})();
