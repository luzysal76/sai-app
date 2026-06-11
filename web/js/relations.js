/**
 * 헤아림 - 관계 지도 CRUD + 점수 계산 (localStorage)
 */
(function () {
  const KEY = 'hearim_relations';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, +n || 0));

  const EMOJI_DEFAULT = { lover:'💑', some:'💗', friend:'🧑', family:'👨‍👩‍👧', work:'💼' };
  const TYPE_LABEL    = { lover:'연인', some:'썸', friend:'친구', family:'가족', work:'직장' };
  const FREQ_LABEL    = ['낮음','보통','높음'];
  const CONFL_LABEL   = ['낮음','보통','높음'];

  function getAll() { return load(); }

  function upsert(p, id) {
    const list = load();
    const existing = id ? list.find(x => x.id === id) : null;
    const item = {
      id:        id || String(Date.now()),
      name:      (p.name || '').trim() || '이름없음',
      type:      p.type || 'friend',
      emoji:     p.emoji || EMOJI_DEFAULT[p.type] || '🧑',
      affinity:  clamp(p.affinity  ?? 50, 0, 100),
      frequency: clamp(p.frequency ?? 1,  0, 2),
      conflict:  clamp(p.conflict  ?? 0,  0, 2),
      note:      p.note || '',
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    const idx = list.findIndex(x => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    save(list);
    return item;
  }

  function remove(id) { save(load().filter(p => p.id !== id)); }

  /** RPG 등급 정보 반환 */
  function rank(aff) {
    if (aff >= 85) return { label:'S', color:'#a06bff', glow:'rgba(160,107,255,.4)', desc:'절친' };
    if (aff >= 70) return { label:'A', color:'#ff6b9d', glow:'rgba(255,107,157,.4)', desc:'친밀' };
    if (aff >= 50) return { label:'B', color:'#4a9eff', glow:'rgba(74,158,255,.35)', desc:'보통' };
    if (aff >= 30) return { label:'C', color:'#41c46e', glow:'rgba(65,196,110,.3)',  desc:'거리감' };
    return               { label:'D', color:'#aaaaaa', glow:'rgba(0,0,0,.08)',       desc:'소원' };
  }

  function avgAffinity() {
    const list = load();
    if (!list.length) return null;
    return Math.round(list.reduce((s, p) => s + p.affinity, 0) / list.length);
  }

  window.HearimRelations = { getAll, upsert, remove, rank, avgAffinity, TYPE_LABEL, FREQ_LABEL, CONFL_LABEL };
})();
