/**
 * 헤아림 - 감정 일기 CRUD + 패턴 분석 (localStorage)
 */
(function () {
  const KEY = 'hearim_diary';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
  const pad  = (n) => String(n).padStart(2, '0');

  const MOOD_EMOJI = ['','😫','😔','😐','😊','🥰'];
  const MOOD_LABEL = ['','많이 힘듦','조금 힘듦','보통','좋음','아주 좋음'];
  const DAY_KR     = '일월화수목금토';

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  function todayFormatted() {
    const d = new Date();
    return `${d.getMonth()+1}월 ${d.getDate()}일 ${DAY_KR[d.getDay()]}요일`;
  }
  function formatDate(key) {
    const [, m, dd] = (key || '').split('-');
    return m && dd ? `${+m}월 ${+dd}일` : key;
  }

  function getToday() { return load().find(e => e.date === todayKey()) || null; }

  function saveEntry(entry) {
    const list = load();
    const key  = todayKey();
    const idx  = list.findIndex(e => e.date === key);
    const item = { ...entry, date: key, updatedAt: Date.now() };
    if (idx >= 0) list[idx] = item; else list.unshift(item);
    save(list);
    return item;
  }

  function getRecent(n) { return load().slice(0, n ?? 7); }

  /** 최근 14일 패턴 분석 */
  function analyzePattern() {
    const entries = load().slice(0, 14);
    if (entries.length < 3) return null;
    const moods    = entries.map(e => e.mood || 3);
    const avg      = moods.reduce((s, m) => s + m, 0) / moods.length;
    const lowCnt   = moods.filter(m => m <= 2).length;
    const highCnt  = moods.filter(m => m >= 4).length;
    const pCnt     = {};
    entries.forEach(e => (e.people || []).forEach(p => { pCnt[p] = (pCnt[p] || 0) + 1; }));
    const topPerson = Object.entries(pCnt).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    let insight;
    if (lowCnt >= 5)      insight = `최근 ${lowCnt}일간 힘든 날이 많았어요. 회복 시간이 필요해요 💙`;
    else if (highCnt >= 8) insight = '최근 2주 대체로 긍정적인 감정을 유지하고 있어요 💗';
    else if (topPerson)    insight = `"${topPerson}"와의 관계가 최근 감정에 큰 영향을 주고 있어요.`;
    else                   insight = '감정 기복이 있지만 전반적으로 안정적이에요.';

    return { avg: Math.round(avg * 10) / 10, lowCnt, highCnt, insight, topPerson, days: entries.length };
  }

  window.HearimDiary = { getToday, saveEntry, getRecent, analyzePattern, todayKey, todayFormatted, formatDate, MOOD_EMOJI, MOOD_LABEL };
})();
