/**
 * 헤아림 - 핵심 해석 엔진 (순수 함수)
 * 웹/Flutter/토스 공통 규칙으로 재사용 가능하도록 작성.
 *
 * 제공 함수 (window.HearimEngine):
 *  normalize(text)
 *  interpret(text, relation)         1. 대화 번역기 / AI 속마음 시뮬레이터
 *  temperature(score)                감정 온도계 (점수 → 단계)
 *  translate(text, relation, opts)   DB → (추후) API 폴백
 */
(function () {
  function normalize(text) {
    return (text || '').trim().replace(/\s+/g, ' ');
  }

  function scoreEntry(entry, text, relation) {
    let hits = 0, longest = 0;
    for (const k of entry.keys) {
      if (text.includes(k)) { hits++; if (k.length > longest) longest = k.length; }
    }
    if (hits === 0) return 0;
    let score = hits * 10 + longest;
    if (entry.relation && entry.relation.includes(relation)) score += 8;
    return score;
  }

  function fallback(relation) {
    const c = window.HEARIM_FALLBACK._common;
    const r = window.HEARIM_FALLBACK[relation] || window.HEARIM_FALLBACK.friend;
    return {
      source: 'fallback',
      surface: c.surface, hidden: c.hidden,
      possibilities: c.possibilities.slice(),
      emotions: c.emotions.slice(),
      action: r.action, confidence: c.confidence,
      replies: [], tip: c.tip,
    };
  }

  /** 1. 대화 번역기 / 속마음 시뮬레이터 */
  function interpret(rawText, relation) {
    const text = normalize(rawText);
    if (!text) return null;

    const db = window.HEARIM_DB || [];
    let best = null, bestScore = 0;
    for (const e of db) {
      const s = scoreEntry(e, text, relation);
      if (s > bestScore) { bestScore = s; best = e; }
    }
    if (!best) return fallback(relation);

    const relMatch = best.relation && best.relation.includes(relation);
    const confidence = relMatch ? best.confidence : Math.max(45, best.confidence - 15);
    return {
      source: 'db',
      surface: best.surface,
      hidden: best.hidden,
      possibilities: best.possibilities.slice(),
      emotions: best.emotions.slice(),
      action: best.action,
      confidence,
      replies: best.replies.slice(),
      tip: best.tip,
    };
  }

  /** 감정 온도계: 0~100 점수 → 단계 */
  function temperature(score) {
    if (score >= 75) return { icon: '🔥', label: '뜨거움', desc: '호감·관심이 매우 높아요', level: 4 };
    if (score >= 55) return { icon: '🌤', label: '안정적', desc: '편안하고 우호적인 분위기', level: 3 };
    if (score >= 35) return { icon: '🌥', label: '애매함', desc: '신호가 섞여 있어요', level: 2 };
    return { icon: '❄', label: '거리감', desc: '거리두기 신호에 주의', level: 1 };
  }

  async function callApi(endpoint, body) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('API ' + res.status);
    return res.json();
  }

  /**
   * translate: DB 매칭 → (폴백 시) Claude API 호출
   * opts.apiEndpoint 가 있으면 그걸 우선. 없으면 window.HEARIM_CONFIG 참조.
   */
  async function translate(rawText, relation, options) {
    const opts = options || {};
    const cfg  = window.HEARIM_CONFIG;
    const dbResult = interpret(rawText, relation);

    // DB 매칭 성공 + AI 꺼진 경우 → DB 결과 즉시 반환
    const useAI = cfg ? cfg.useAI : false;
    if (!useAI && dbResult && dbResult.source === 'db') return dbResult;

    // API 엔드포인트 결정
    const endpoint = opts.apiEndpoint || cfg?.api?.translate;
    if (!endpoint) return dbResult;

    // DB 폴백이면 항상 AI 호출. DB 매칭도 AI 보완 가능(opts.always 시).
    const shouldCall = !dbResult || dbResult.source !== 'db' || opts.always;
    if (!shouldCall) return dbResult;

    try {
      const data = await callApi(endpoint, { text: rawText, relation });
      return { source: 'claude', ...data };
    } catch (e) {
      console.warn('[헤아림] Claude API 실패, DB 사용:', e.message);
      return dbResult;
    }
  }

  /** 카톡 분석 AI 호출 */
  async function translateKakao(text, relation) {
    const cfg = window.HEARIM_CONFIG;
    if (!cfg?.useAI || !cfg?.api?.analyzeKakao) return null;
    try {
      return await callApi(cfg.api.analyzeKakao, { text, relation });
    } catch (e) {
      console.warn('[헤아림] Kakao AI 실패:', e.message);
      return null;
    }
  }

  /** AI 관계 진단 호출 */
  async function translateDiag(chat, concern, relation) {
    const cfg = window.HEARIM_CONFIG;
    if (!cfg?.useAI || !cfg?.api?.diagRelation) return null;
    try {
      return await callApi(cfg.api.diagRelation, { chat, concern, relation });
    } catch (e) {
      console.warn('[헤아림] Diag AI 실패:', e.message);
      return null;
    }
  }

  window.HearimEngine = { normalize, interpret, temperature, translate, translateKakao, translateDiag };
})();
