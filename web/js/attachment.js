/**
 * 사이(Sai) — 애착 유형 분석 엔진
 * 12문항 → 4가지 애착 유형 (Bowlby/Ainsworth 이론)
 */
window.SaiAttachment = (function () {

  const QUESTIONS = [
    // secure (안정형)
    { text: '나는 사람들과 자연스럽게 가까워지는 것이 어렵지 않다', type: 'secure' },
    { text: '파트너와 잠시 연락이 없어도 관계에 대해 크게 걱정하지 않는다', type: 'secure' },
    { text: '내 감정과 필요를 상대방에게 솔직하게 말할 수 있다', type: 'secure' },
    // anxious (불안형)
    { text: '상대방의 연락이 없으면 점점 불안해지고 최악을 상상하게 된다', type: 'anxious' },
    { text: '나만 더 많이 사랑하는 것 같아 자주 불안해진다', type: 'anxious' },
    { text: '상대방의 작은 반응 하나가 내 하루 기분을 크게 좌우한다', type: 'anxious' },
    // avoidant (회피형)
    { text: '누군가와 너무 가까워지면 숨이 막히는 느낌이 든다', type: 'avoidant' },
    { text: '감정적인 대화보다는 혼자 해결하는 것이 더 편하다', type: 'avoidant' },
    { text: '연인이나 친한 친구에게도 속마음을 꺼내기가 어렵다', type: 'avoidant' },
    // disorganized (혼란형)
    { text: '가까워지고 싶지만 막상 가까워지면 도망치고 싶어진다', type: 'disorganized' },
    { text: '관계에서 감정이 극단적으로 오가며 스스로도 혼란스럽다', type: 'disorganized' },
    { text: '상대를 믿고 싶지만 깊이 의지했다가 상처받을까 봐 두렵다', type: 'disorganized' },
  ];

  const TYPES = {
    secure: {
      name: '안정형', emoji: '🌿',
      color: '#16a34a', bg: 'rgba(22,163,74,.1)',
      sub: '자신과 관계를 편안하게 신뢰하는',
      desc: '관계에서 자연스럽게 친밀감을 형성하고 신뢰를 잘 쌓아요. 갈등이 생겨도 건강하게 대화로 풀어가며, 혼자서도 잘 지낼 수 있지만 연결도 소중히 여겨요. 상대방을 신뢰하고, 자신도 신뢰받을 수 있다고 믿어요.',
      strength: '신뢰 형성이 자연스럽고 감정을 솔직하게 표현해요. 갈등을 건강하게 해결하는 능력이 뛰어나요.',
      growth: '다른 유형의 파트너가 보내는 신호를 오해할 수 있어요. 상대의 불안이나 회피가 나의 잘못이 아님을 기억하세요.',
      tip: '안정형의 강점을 유지하면서, 상대방의 애착 유형도 이해하려는 노력이 관계를 더 깊게 해줘요 💚',
    },
    anxious: {
      name: '불안형', emoji: '💕',
      color: '#ec4899', bg: 'rgba(236,72,153,.1)',
      sub: '깊이 사랑하고 연결을 갈망하는',
      desc: '사랑을 깊이 주고받고 싶지만 버림받거나 거부당할까 봐 두려움이 커요. 상대방의 반응에 민감하고 지속적인 확인과 안심이 필요해요. 그 풍부한 감정은 큰 강점이기도 해요.',
      strength: '감정이 풍부하고 헌신적이며 공감 능력이 뛰어나요. 관계에 깊이 투자하는 사람이에요.',
      growth: '불안이 클 때 즉각적인 행동보다 자기 조절 연습이 필요해요. 지금의 불안이 현재 상대 때문인지, 과거 경험인지 구분해보세요.',
      tip: '불안할 때 즉시 연락하기보다 잠깐 자신을 진정시키는 루틴을 만들어보세요. 자기 확신이 관계를 더 튼튼하게 해요 💗',
    },
    avoidant: {
      name: '회피형', emoji: '🌊',
      color: '#0891b2', bg: 'rgba(8,145,178,.1)',
      sub: '독립성과 자유를 소중히 여기는',
      desc: '자립적이고 독립심이 강해요. 친밀함이 불편하게 느껴지고 감정 표현이 어색할 수 있지만, 그것이 사랑하지 않아서가 아니에요. 깊은 내면에는 연결에 대한 욕구가 있어요.',
      strength: '자립적이고 침착하며, 감정적인 상황에서도 이성을 유지하는 능력이 있어요.',
      growth: '파트너가 감정적 거리감을 거부로 오해할 수 있어요. 작은 취약함을 공유하는 연습이 관계를 깊게 해줘요.',
      tip: '"나는 지금 혼자 정리가 필요해" 한 마디가 파트너의 불안을 크게 줄여줄 수 있어요. 거리가 필요할 때 이유를 짧게 공유해보세요 🌊',
    },
    disorganized: {
      name: '혼란형', emoji: '🌀',
      color: '#7c3aed', bg: 'rgba(124,58,237,.1)',
      sub: '연결을 원하면서도 두려움이 공존하는',
      desc: '가까워지고 싶은 마음과 두려움이 동시에 존재해요. 과거의 상처나 불안정한 경험이 현재 관계에 영향을 주고 있을 수 있어요. 이 유형은 치유와 성장의 잠재력이 가장 크기도 해요.',
      strength: '감정의 깊이가 있고, 자신을 이해하려는 의지가 강해요. 성장 가능성이 가장 큰 유형이에요.',
      growth: '감정이 극단적으로 오갈 때 스스로도 힘들고 파트너도 혼란스러울 수 있어요. 전문적인 심리 상담이 큰 도움이 돼요.',
      tip: '감정이 크게 요동칠 때 "지금 내가 과거의 두려움에 반응하고 있나?" 물어보세요. 작은 자기 인식이 변화의 시작이에요 🌀',
    },
  };

  // 유형 쌍 궁합 (알파벳순 정렬 key)
  const PAIR = {
    'secure-secure':            { score: 95, label: '최고의 궁합 💚', desc: '두 사람 모두 건강한 방식으로 사랑해 가장 이상적인 조합이에요.' },
    'anxious-secure':           { score: 78, label: '치유적 만남 💕', desc: '안정형의 침착함이 불안형을 안심시켜줄 수 있어요.' },
    'avoidant-secure':          { score: 72, label: '인내가 필요한 관계 🌊', desc: '회피형이 조금씩 마음을 열 때 아름다운 관계가 돼요.' },
    'disorganized-secure':      { score: 70, label: '성장 동반자 🌀', desc: '안정형이 혼란형에게 안전한 기반이 되어줄 수 있어요.' },
    'anxious-anxious':          { score: 55, label: '감정의 폭풍 💫', desc: '두 사람의 불안이 서로를 자극해 격렬한 관계가 될 수 있어요.' },
    'anxious-avoidant':         { score: 48, label: '끌림 그러나 도전 🔥', desc: '강하게 끌리지만 추격·도피 사이클에 빠질 위험이 있어요.' },
    'anxious-disorganized':     { score: 52, label: '복잡한 에너지 🌀', desc: '두 사람 모두 치유 작업이 선행되면 좋아요.' },
    'avoidant-avoidant':        { score: 60, label: '편안하지만 거리감 🌊', desc: '각자의 공간은 존중되지만 진정한 연결이 부족할 수 있어요.' },
    'avoidant-disorganized':    { score: 50, label: '어려운 조합 🌀', desc: '회피 패턴이 혼란형의 불안을 심화할 수 있어요.' },
    'disorganized-disorganized':{ score: 45, label: '함께 치유가 필요해 💜', desc: '두 사람 모두 자신을 먼저 이해하는 과정이 중요해요.' },
  };

  function calcScore(answers) {
    const totals = { secure: 0, anxious: 0, avoidant: 0, disorganized: 0 };
    const counts = { secure: 0, anxious: 0, avoidant: 0, disorganized: 0 };
    QUESTIONS.forEach((q, i) => { totals[q.type] += (answers[i] || 0); counts[q.type]++; });
    const avgs = {};
    for (const k in totals) avgs[k] = counts[k] ? (totals[k] / counts[k]) : 0;
    const sorted = Object.entries(avgs).sort((a, b) => b[1] - a[1]);
    return { avgs, primary: sorted[0][0], secondary: sorted[1][0] };
  }

  function getPairCompat(t1, t2) {
    const key = [t1, t2].sort().join('-');
    return PAIR[key] || { score: 65, label: '독특한 조합', desc: '서로를 이해하며 성장할 수 있는 관계예요.' };
  }

  return { QUESTIONS, TYPES, calcScore, getPairCompat };
})();
