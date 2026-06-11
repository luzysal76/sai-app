/**
 * 헤아림 - 해석 엔진
 * 1) DB 키워드 매칭 (관계 가중치 포함)
 * 2) 매칭 실패 시 관계별 폴백
 * 3) (추후) Claude API 폴백 자리 마련 — translateWithAPI()
 *
 * 클라이언트 공통 로직: 웹/Flutter/토스에서 같은 규칙을 재사용할 수 있도록
 * 순수 함수 형태로 작성.
 */
(function () {
  /** 입력 정규화: 공백 정리, 소문자(영문) */
  function normalize(text) {
    return (text || '').trim().replace(/\s+/g, ' ');
  }

  /** 한 항목의 매칭 점수 계산 */
  function scoreEntry(entry, text, relation) {
    let hits = 0;
    let longest = 0;
    for (const k of entry.keys) {
      if (text.includes(k)) {
        hits += 1;
        if (k.length > longest) longest = k.length;
      }
    }
    if (hits === 0) return 0;
    // 기본 점수: 매칭 수 + 가장 긴 키워드 길이 보너스
    let score = hits * 10 + longest;
    // 관계 일치 시 가중치
    if (entry.relation && entry.relation.includes(relation)) score += 8;
    return score;
  }

  /** 메인 해석 함수 (동기, DB 기반) */
  function interpret(rawText, relation) {
    const text = normalize(rawText);
    if (!text) return null;

    const db = window.HEARIM_DB || [];
    let best = null;
    let bestScore = 0;

    for (const entry of db) {
      const s = scoreEntry(entry, text, relation);
      if (s > bestScore) {
        bestScore = s;
        best = entry;
      }
    }

    if (best) {
      // 관계 불일치면 신뢰도 약간 하향
      const relMatch = best.relation && best.relation.includes(relation);
      const confidence = relMatch
        ? best.confidence
        : Math.max(45, best.confidence - 15);
      return {
        source: 'db',
        meaning: best.meaning,
        emotions: best.emotions,
        confidence,
        replies: best.replies,
        tip: best.tip,
      };
    }

    // 폴백
    const fb = (window.HEARIM_FALLBACK || {})[relation] ||
      window.HEARIM_FALLBACK.friend;
    return {
      source: 'fallback',
      meaning: fb.meaning,
      emotions: fb.emotions,
      confidence: fb.confidence,
      replies: fb.replies,
      tip: fb.tip,
    };
  }

  /**
   * (추후) Claude API 폴백.
   * 백엔드(Firebase Functions)의 /translate 엔드포인트를 호출하도록 구성.
   * 지금은 자리만 마련 — 설정 없으면 DB 결과를 그대로 사용.
   */
  async function translate(rawText, relation, options) {
    const opts = options || {};
    const dbResult = interpret(rawText, relation);

    // DB 신뢰도가 충분하면 API 호출 없이 반환
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
      // 실패 시 DB/폴백 결과로 graceful degrade
      console.warn('[헤아림] API 폴백 실패, DB 결과 사용:', e.message);
      return dbResult;
    }
  }

  window.HearimEngine = { interpret, translate, normalize };
})();
