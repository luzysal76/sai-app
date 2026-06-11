/**
 * 사이(Sai) — 관계 통장 엔진
 * 신뢰·호감·관심 잔액을 관리하고, 행동으로 잔액을 증감
 * localStorage key: sai_bankbook
 */
window.SaiBankbook = (function () {

  const STORAGE_KEY = 'sai_bankbook';

  // ── 잔액 유형 ──
  const BALANCE_TYPES = {
    trust:    { label: '신뢰',  emoji: '🔑', color: '#6b4eaa', desc: '믿음과 약속' },
    affinity: { label: '호감',  emoji: '💗', color: '#ff6b9d', desc: '따뜻함과 설렘' },
    care:     { label: '관심',  emoji: '💙', color: '#4a9eff', desc: '배려와 존재감' },
  };

  // ── 행동 DB (긍정/부정) ──
  const ACTIONS = {
    positive: [
      { id:'p1', label:'공감해줬어',      icon:'💬', trust:2,  affinity:6,  care:5  },
      { id:'p2', label:'생일 기억했어',   icon:'🎂', trust:8,  affinity:10, care:8  },
      { id:'p3', label:'선물·서프라이즈', icon:'🎁', trust:4,  affinity:12, care:6  },
      { id:'p4', label:'약속 잘 지켰어',  icon:'✅', trust:10, affinity:4,  care:2  },
      { id:'p5', label:'칭찬해줬어',      icon:'🌟', trust:3,  affinity:7,  care:4  },
      { id:'p6', label:'힘들 때 들어줬어',icon:'🤝', trust:8,  affinity:6,  care:9  },
      { id:'p7', label:'먼저 연락했어',   icon:'📞', trust:2,  affinity:5,  care:7  },
      { id:'p8', label:'비밀 털어놨어',   icon:'🔐', trust:10, affinity:8,  care:5  },
      { id:'p9', label:'같이 시간 보냈어',icon:'☕', trust:5,  affinity:9,  care:7  },
    ],
    negative: [
      { id:'n1', label:'약속 취소했어',   icon:'❌', trust:-10, affinity:-4,  care:-3  },
      { id:'n2', label:'읽씹했어',        icon:'😶', trust:-5,  affinity:-6,  care:-10 },
      { id:'n3', label:'비판·비난했어',   icon:'🗣️', trust:-6,  affinity:-12, care:-5  },
      { id:'n4', label:'늦게 답장했어',   icon:'⏰', trust:-2,  affinity:-2,  care:-4  },
      { id:'n5', label:'갈등·다퉜어',     icon:'😠', trust:-8,  affinity:-10, care:-6  },
      { id:'n6', label:'잊어버렸어',      icon:'😅', trust:-7,  affinity:-5,  care:-8  },
      { id:'n7', label:'거짓말이 들켰어', icon:'🤥', trust:-15, affinity:-8,  care:-5  },
    ],
  };

  // ── 관계 점수 → 상태 텍스트 ──
  const STATUS_MAP = [
    { min:85, icon:'☀️', label:'매우 건강해요', color:'#4ade80' },
    { min:70, icon:'🌤️', label:'좋은 상태예요', color:'#60a5fa' },
    { min:55, icon:'⛅', label:'관리가 필요해요', color:'#f59e0b' },
    { min:40, icon:'🌧️', label:'주의가 필요해요', color:'#fb923c' },
    { min:0,  icon:'⛈️', label:'위험 신호예요', color:'#f43f5e' },
  ];

  // ── 데이터 로드/저장 ──
  function loadAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // ── 특정 인물의 통장 초기화 또는 로드 ──
  function getBook(personId) {
    const all = loadAll();
    if (!all[personId]) {
      all[personId] = { trust: 60, affinity: 60, care: 60, history: [] };
      saveAll(all);
    }
    return all[personId];
  }

  // ── 행동 기록 + 잔액 업데이트 ──
  function recordAction(personId, actionId, dateStr) {
    const action = [...ACTIONS.positive, ...ACTIONS.negative].find(a => a.id === actionId);
    if (!action) return null;

    const all = loadAll();
    const book = getBook(personId);

    // 잔액 업데이트 (0~100 범위 유지)
    const clamp = (v, d) => Math.max(0, Math.min(100, v + d));
    book.trust    = clamp(book.trust,    action.trust    || 0);
    book.affinity = clamp(book.affinity, action.affinity || 0);
    book.care     = clamp(book.care,     action.care     || 0);

    // 히스토리 추가 (최대 50개)
    const date = dateStr || new Date().toLocaleDateString('ko-KR');
    book.history.unshift({
      date,
      label: action.label,
      icon:  action.icon,
      trust: action.trust    || 0,
      affinity: action.affinity || 0,
      care: action.care     || 0,
    });
    if (book.history.length > 50) book.history = book.history.slice(0, 50);

    all[personId] = book;
    saveAll(all);
    return book;
  }

  // ── 관계 총점 계산 ──
  function totalScore(book) {
    return Math.round((book.trust * 0.4 + book.affinity * 0.35 + book.care * 0.25));
  }

  // ── 관계 상태 ──
  function getStatus(score) {
    return STATUS_MAP.find(s => score >= s.min) || STATUS_MAP[STATUS_MAP.length - 1];
  }

  // ── 공개 API ──
  return {
    BALANCE_TYPES, ACTIONS, STATUS_MAP,
    loadAll, getBook, recordAction, totalScore, getStatus,
  };
})();
