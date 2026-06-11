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

  async function translate(rawText, relation, options) {
    const opts = options || {};
    const dbResult = interpret(rawText, relation);
    const useApi = opts.apiEndpoint && (!dbResult || dbResult.source === 'fallback');
    if (!useApi) return dbResult;
    try {
      const res = await fetch(opts.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, relation }),
      });
      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      return { source: 'api', ...data };
    } catch (e) {
      console.warn('[헤아림] API 폴백 실패, DB 사용:', e.message);
      return dbResult;
    }
  }

  window.HearimEngine = { normalize, interpret, temperature, translate };
})();
