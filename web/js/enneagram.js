/**
 * 사이(Sai) — 에니어그램 궁합 엔진
 * 9가지 성격 유형 × 궁합 분석
 */
window.SaiEnneagram = (function () {

  const TYPES = [
    { n:1, name:'개혁가',      emoji:'⚖️',  center:'gut',
      desc:'원칙·완벽·정직을 추구하며 세상을 더 나은 곳으로 만들려 해요.',
      keyword:['원칙','정직','완벽','책임감'], growth:7, stress:4 },
    { n:2, name:'조력자',      emoji:'🤗',  center:'heart',
      desc:'따뜻한 사랑과 배려로 주변을 돌보며 인정받고 싶어해요.',
      keyword:['배려','헌신','친절','공감'], growth:4, stress:8 },
    { n:3, name:'성취자',      emoji:'🏆',  center:'heart',
      desc:'목표 지향적이며 성공과 효율을 통해 가치를 증명하려 해요.',
      keyword:['목표','효율','자신감','성과'], growth:6, stress:9 },
    { n:4, name:'예술가',      emoji:'🎨',  center:'heart',
      desc:'독창성과 깊은 감성으로 자신만의 정체성을 탐구해요.',
      keyword:['창의','감수성','독특함','진정성'], growth:1, stress:2 },
    { n:5, name:'탐구자',      emoji:'🔍',  center:'head',
      desc:'지식과 통찰을 추구하며 독립적으로 세상을 관찰해요.',
      keyword:['분석','독립','지식','관찰'], growth:8, stress:7 },
    { n:6, name:'충성가',      emoji:'🛡️',  center:'head',
      desc:'안전과 신뢰를 중시하며 공동체에 헌신하는 유형이에요.',
      keyword:['충성','신뢰','책임','안전'], growth:9, stress:3 },
    { n:7, name:'열정가',      emoji:'🌟',  center:'head',
      desc:'긍정 에너지와 호기심으로 새로운 경험을 추구해요.',
      keyword:['자유','모험','낙관','호기심'], growth:5, stress:1 },
    { n:8, name:'도전자',      emoji:'🦁',  center:'gut',
      desc:'강하고 결단력 있으며 약자를 보호하는 리더십을 지닌 유형이에요.',
      keyword:['자신감','직설','보호','결단'], growth:2, stress:5 },
    { n:9, name:'평화주의자',  emoji:'☮️',  center:'gut',
      desc:'평화와 조화를 사랑하며 갈등을 부드럽게 중재해요.',
      keyword:['평온','포용','조화','인내'], growth:3, stress:6 },
  ];

  // 9×9 궁합 점수 행렬 (1-indexed → 0-indexed)
  const COMPAT = [
  //  1    2    3    4    5    6    7    8    9
    [ 72,  78,  75,  65,  80,  88,  60,  70,  85 ], // 1
    [ 78,  68,  72,  82,  62,  85,  75,  68,  90 ], // 2
    [ 75,  72,  65,  70,  80,  75,  88,  82,  70 ], // 3
    [ 65,  82,  70,  60,  88,  65,  72,  62,  80 ], // 4
    [ 80,  62,  80,  88,  58,  80,  70,  65,  75 ], // 5
    [ 88,  85,  75,  65,  80,  62,  72,  80,  90 ], // 6
    [ 60,  75,  88,  72,  70,  72,  60,  80,  82 ], // 7
    [ 70,  68,  82,  62,  65,  80,  80,  62,  88 ], // 8
    [ 85,  90,  70,  80,  75,  90,  82,  88,  68 ], // 9
  ];

  // 특별 궁합 메모
  const NOTES = {
    '1-6': '원칙과 신뢰를 함께 중시해 강한 신뢰를 쌓아요.',
    '1-9': '1유형의 개혁 의지와 9유형의 포용이 균형을 이뤄요.',
    '2-9': '서로를 깊이 배려하는 따뜻한 천생연분이에요.',
    '4-5': '서로의 깊이와 독창성을 이해하는 드문 명콤비예요.',
    '6-9': '안정과 평화를 함께 추구하는 편안한 관계예요.',
    '3-7': '에너지와 목표지향이 함께 시너지를 만들어요.',
    '8-9': '강함과 평화의 조화 — 서로의 부족함을 채워줘요.',
    '2-6': '신뢰와 헌신으로 깊은 유대를 형성해요.',
    '5-4': '지성과 감성이 만나 서로를 깊이 자극해요.',
    '3-8': '성취와 리더십이 강한 파워 커플이에요.',
    '7-9': '낙관과 평화로 늘 즐거운 관계를 만들어요.',
  };

  const CENTER_KR = { gut:'본능형 (장)', heart:'감정형 (심)', head:'사고형 (두)' };
  const CENTER_COLOR = { gut:'#dc2626', heart:'#ec4899', head:'#3b82f6' };
  const CENTER_BG    = { gut:'rgba(220,38,38,.1)', heart:'rgba(236,72,153,.1)', head:'rgba(59,130,246,.1)' };

  function scoreLevel(s) {
    if (s >= 87) return { label: '천생연분 ✨', color: '#d97706' };
    if (s >= 78) return { label: '좋은 궁합 💚', color: '#10b981' };
    if (s >= 68) return { label: '보통 궁합 💙', color: '#6366f1' };
    return { label: '노력이 필요해요 💪', color: '#f43f5e' };
  }

  function getNote(t1, t2) {
    const key = `${Math.min(t1, t2)}-${Math.max(t1, t2)}`;
    if (NOTES[key]) return NOTES[key];
    const c1 = TYPES[t1 - 1].center, c2 = TYPES[t2 - 1].center;
    if (c1 === c2) return `같은 ${CENTER_KR[c1]}에 속해 서로를 직관적으로 이해해요.`;
    return `${CENTER_KR[c1]}과 ${CENTER_KR[c2]}의 만남 — 다름이 서로를 성장시킬 수 있어요.`;
  }

  function calcCompat(t1, t2) {
    const score  = COMPAT[t1 - 1][t2 - 1];
    const note   = getNote(t1, t2);
    const sameCenter = TYPES[t1 - 1].center === TYPES[t2 - 1].center;
    return { score, note, sameCenter, level: scoreLevel(score) };
  }

  return { TYPES, calcCompat, CENTER_KR, CENTER_COLOR, CENTER_BG };
})();
