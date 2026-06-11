/**
 * 헤아림 - 관계 타임라인 (localStorage)
 * diary 자동 연동 + 직접 입력 + AI 트렌드 분석
 */
(function () {
  const KEY = 'hearim_timeline';
  const loadAll = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const saveAll = (d) => localStorage.setItem(KEY, JSON.stringify(d));
  const pad = (n) => String(n).padStart(2, '0');

  const TYPE = {
    positive:    { emoji: '😊', label: '좋은 일',   color: '#41c46e', dot: '#41c46e' },
    neutral:     { emoji: '😐', label: '일상',       color: '#4a9eff', dot: '#4a9eff' },
    negative:    { emoji: '😢', label: '힘든 일',    color: '#ff6b6b', dot: '#ff6b6b' },
    milestone:   { emoji: '⭐', label: '특별한 날',  color: '#a06bff', dot: '#a06bff' },
    contact_down:{ emoji: '📵', label: '연락 감소',  color: '#aaa',    dot: '#aaa'    },
    recovery:    { emoji: '🌈', label: '회복',        color: '#ff6b9d', dot: '#ff6b9d' },
  };

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  function getEvents(pid) {
    const all = loadAll();
    return (all[pid] || []).sort((a, b) => b.date.localeCompare(a.date));
  }

  function addEvent(pid, ev) {
    const all = loadAll();
    if (!all[pid]) all[pid] = [];
    const t = TYPE[ev.type] || TYPE.neutral;
    const item = {
      id:     String(Date.now()),
      date:   ev.date || todayKey(),
      type:   ev.type || 'neutral',
      emoji:  ev.emoji || t.emoji,
      title:  (ev.title || t.label).trim(),
      note:   (ev.note || '').trim(),
      source: ev.source || 'manual', // 'diary' | 'manual' | 'system'
    };
    all[pid].push(item);
    saveAll(all);
    return item;
  }

  function removeEvent(pid, eventId) {
    const all = loadAll();
    if (all[pid]) all[pid] = all[pid].filter(e => e.id !== eventId);
    saveAll(all);
  }

  /**
   * 일기 저장 시 자동 호출
   * personNames: 언급된 사람 이름 배열
   * mood: 1~5, note: 메모 텍스트
   */
  function autoRecordFromDiary(personNames, mood, note) {
    const relations = (window.HearimRelations?.getAll() || []);
    const date = todayKey();
    (personNames || []).forEach(name => {
      const person = relations.find(r => r.name === name || r.name.includes(name) || name.includes(r.name));
      if (!person) return;
      const events = getEvents(person.id);
      if (events.some(e => e.date === date && e.source === 'diary')) return; // 오늘 이미 기록됨
      const type  = mood >= 4 ? 'positive' : mood <= 2 ? 'negative' : 'neutral';
      const title = mood >= 4 ? '좋은 하루' : mood <= 2 ? '힘든 하루' : '일상 기록';
      addEvent(person.id, { date, type, title, note: (note||'').slice(0, 60), source: 'diary' });
    });
  }

  /** 관계 건강도 + 트렌드 분석 */
  function getSummary(pid) {
    const events = getEvents(pid);
    if (!events.length) return null;
    const posTypes = ['positive','milestone','recovery'];
    const negTypes = ['negative','contact_down'];
    const pos = events.filter(e => posTypes.includes(e.type)).length;
    const neg = events.filter(e => negTypes.includes(e.type)).length;
    const health = Math.round(Math.max(20, Math.min(98, 50 + (pos - neg) * 7)));

    // 최근 3개 이벤트로 트렌드
    const recent = events.slice(0, 3);
    const rPos   = recent.filter(e => posTypes.includes(e.type)).length;
    const rNeg   = recent.filter(e => negTypes.includes(e.type)).length;
    let trend = '😐 안정';
    if (rPos > rNeg + 0) trend = '😊 개선 중';
    if (rNeg >= 2)        trend = '⚠️ 주의 필요';
    if (rPos >= 2 && rNeg === 0) trend = '💗 매우 좋음';

    // 기간(일)
    const oldest = events[events.length - 1]?.date;
    const newest = events[0]?.date;
    const days = oldest && newest ? Math.abs(Math.round((new Date(newest)-new Date(oldest))/86400000)) : 0;

    // AI 인사이트
    let insight;
    if (health >= 80 && trend.includes('개선'))    insight = '꾸준한 소통이 관계를 성장시키고 있어요. 이 흐름을 유지하면 더 깊어질 거예요 💗';
    else if (health >= 70)                         insight = '전반적으로 안정적인 관계예요. 좋은 순간들이 쌓이고 있어요.';
    else if (trend.includes('주의'))               insight = '최근 힘든 일이 있었던 것 같아요. 먼저 다가가거나 솔직하게 대화해보는 게 도움이 될 수 있어요.';
    else if (events.length <= 2)                   insight = '아직 기록이 적어요. 더 많이 쌓일수록 정확한 분석이 가능해요.';
    else                                           insight = '감정 기복이 있지만 지속되는 관계예요. 갈등 후 회복 패턴에 주목해보세요.';

    return { count: events.length, health, trend, days, pos, neg, insight };
  }

  window.HearimTimeline = { getEvents, addEvent, removeEvent, autoRecordFromDiary, getSummary, TYPE };
})();
