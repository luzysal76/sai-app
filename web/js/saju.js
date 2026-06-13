/**
 * 사이(Sai) — 사주 궁합 엔진
 * 연주(年柱) + 월주(月柱) 기반 오행 궁합 분석
 */
window.SaiSaju = (function () {

  const STEMS = [
    { name: '갑', hanzi: '甲', element: 'wood',  yin: false },
    { name: '을', hanzi: '乙', element: 'wood',  yin: true  },
    { name: '병', hanzi: '丙', element: 'fire',  yin: false },
    { name: '정', hanzi: '丁', element: 'fire',  yin: true  },
    { name: '무', hanzi: '戊', element: 'earth', yin: false },
    { name: '기', hanzi: '己', element: 'earth', yin: true  },
    { name: '경', hanzi: '庚', element: 'metal', yin: false },
    { name: '신', hanzi: '辛', element: 'metal', yin: true  },
    { name: '임', hanzi: '壬', element: 'water', yin: false },
    { name: '계', hanzi: '癸', element: 'water', yin: true  },
  ];

  const BRANCHES = [
    { name: '자', hanzi: '子', animal: '🐭', animalName: '쥐',     element: 'water' },
    { name: '축', hanzi: '丑', animal: '🐮', animalName: '소',     element: 'earth' },
    { name: '인', hanzi: '寅', animal: '🐯', animalName: '호랑이', element: 'wood'  },
    { name: '묘', hanzi: '卯', animal: '🐰', animalName: '토끼',   element: 'wood'  },
    { name: '진', hanzi: '辰', animal: '🐲', animalName: '용',     element: 'earth' },
    { name: '사', hanzi: '巳', animal: '🐍', animalName: '뱀',     element: 'fire'  },
    { name: '오', hanzi: '午', animal: '🐴', animalName: '말',     element: 'fire'  },
    { name: '미', hanzi: '未', animal: '🐑', animalName: '양',     element: 'earth' },
    { name: '신', hanzi: '申', animal: '🐵', animalName: '원숭이', element: 'metal' },
    { name: '유', hanzi: '酉', animal: '🐔', animalName: '닭',     element: 'metal' },
    { name: '술', hanzi: '戌', animal: '🐶', animalName: '개',     element: 'earth' },
    { name: '해', hanzi: '亥', animal: '🐷', animalName: '돼지',   element: 'water' },
  ];

  const ELEMENTS = {
    wood:  { name: '목(木)', emoji: '🌿', color: '#16a34a', bg: 'rgba(22,163,74,.1)',   meaning: '성장·창조·유연함' },
    fire:  { name: '화(火)', emoji: '🔥', color: '#dc2626', bg: 'rgba(220,38,38,.1)',   meaning: '열정·표현·활력' },
    earth: { name: '토(土)', emoji: '⛰️', color: '#b45309', bg: 'rgba(180,83,9,.1)',    meaning: '안정·신뢰·포용력' },
    metal: { name: '금(金)', emoji: '✨', color: '#b8860b', bg: 'rgba(184,134,11,.1)',  meaning: '결단·정의·완벽함' },
    water: { name: '수(水)', emoji: '💧', color: '#1d4ed8', bg: 'rgba(29,78,216,.1)',   meaning: '지혜·유연함·감성' },
  };

  // 상생 wood→fire→earth→metal→water→wood
  const GEN  = { wood:'fire', fire:'earth', earth:'metal', metal:'water', water:'wood' };
  // 상극 wood→earth→water→fire→metal→wood
  const CTRL = { wood:'earth', earth:'water', water:'fire', fire:'metal', metal:'wood' };

  const SAMHAP  = [['인','오','술'],['사','유','축'],['신','자','진'],['해','묘','미']];
  const BANGHAP = [['인','묘','진'],['사','오','미'],['신','유','술'],['해','자','축']];
  const CHUNG   = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']];

  function stemIdx(y)   { return ((y - 4) % 10  + 10)  % 10;  }
  function branchIdx(y) { return ((y - 4) % 12  + 12)  % 12;  }
  function monthStemIdx(y, m) {
    return ([2,4,6,8,0][stemIdx(y) % 5] + m - 1) % 10;
  }
  function monthBranchIdx(m) { return (m + 1) % 12; }

  function getPillar(year, month) {
    return {
      yearStem:    STEMS[stemIdx(year)],
      yearBranch:  BRANCHES[branchIdx(year)],
      monthStem:   STEMS[monthStemIdx(year, month)],
      monthBranch: BRANCHES[monthBranchIdx(month)],
    };
  }

  function branchScore(y1, y2) {
    if (y1 === y2) return 72;
    const n1 = BRANCHES[branchIdx(y1)].name;
    const n2 = BRANCHES[branchIdx(y2)].name;
    for (const g of SAMHAP)  if (g.includes(n1) && g.includes(n2)) return 90;
    for (const g of BANGHAP) if (g.includes(n1) && g.includes(n2)) return 82;
    for (const p of CHUNG)   if (p.includes(n1) && p.includes(n2)) return 42;
    return 65;
  }

  function calculate(year1, month1, year2, month2) {
    const p1 = getPillar(year1, month1);
    const p2 = getPillar(year2, month2);
    const e1 = p1.yearStem.element;
    const e2 = p2.yearStem.element;

    let elemScore = 65, relation = 'neutral', label = '평화';
    if (e1 === e2)                              { elemScore = 72; relation = 'same';        label = '비화(比和)'; }
    else if (GEN[e1]===e2 || GEN[e2]===e1)     { elemScore = 88; relation = 'generating';  label = '상생(相生)'; }
    else if (CTRL[e1]===e2 || CTRL[e2]===e1)   { elemScore = 50; relation = 'controlling'; label = '상극(相剋)'; }

    const bScore = branchScore(year1, year2);
    const score  = Math.round(elemScore * 0.65 + bScore * 0.35);
    return { p1, p2, e1, e2, score, relation, label, ELEMENTS, GEN, CTRL };
  }

  function getMessage(result) {
    const { relation, e1, e2, GEN: G, CTRL: C } = result;
    const E = ELEMENTS;
    if (relation === 'generating') {
      const fwd = G[e1] === e2;
      return {
        summary: `${E[fwd?e1:e2].emoji}이 ${E[fwd?e2:e1].emoji}을 키우는 이상적인 상생`,
        strength: '서로의 에너지가 자연스럽게 보완되어 함께할수록 두 사람 모두 성장해요. 상대방의 장점을 자연스럽게 끌어올려주는 드림팀이에요.',
        caution: '서로에게 너무 의존하면 독립성이 흐려질 수 있어요. 각자만의 시간도 소중히 지켜주세요.',
        tip: '공통 목표나 프로젝트를 함께 추진하면 시너지가 폭발해요 🚀',
      };
    } else if (relation === 'controlling') {
      const fwd = C[e1] === e2;
      return {
        summary: `${E[fwd?e1:e2].emoji}과 ${E[fwd?e2:e1].emoji}의 팽팽한 긴장감`,
        strength: '극과 극이 끌리듯 강렬한 매력을 느낄 수 있어요. 상극 관계는 서로를 단련시키고 더 강하게 만드는 힘이 있어요.',
        caution: '주도권 다툼이나 의견 충돌이 잦을 수 있어요. 상대방의 방식을 틀렸다고 느끼지 말고 다름으로 인정해주세요.',
        tip: '충돌 대신 협상을 먼저 시도하세요. 서로의 다름이 강점이 될 수 있어요 💡',
      };
    } else if (relation === 'same') {
      return {
        summary: `같은 ${E[e1].emoji} ${E[e1].name} 기운 — 깊은 공감대`,
        strength: '비슷한 성향으로 서로를 직관적으로 이해해요. 말하지 않아도 통하는 느낌, 편안한 안정감이 있어요.',
        caution: '너무 비슷해서 서로의 단점도 공유할 수 있어요. 새로운 자극을 함께 만들어가세요.',
        tip: '서로 새로운 취미나 경험에 함께 도전해 자극을 주고받아보세요 🌈',
      };
    } else {
      return {
        summary: `${E[e1].emoji}과 ${E[e2].emoji}의 균형 잡힌 중립 관계`,
        strength: '뚜렷한 충돌 없이 서로의 영역을 존중해요. 안정적이고 실용적인 관계를 만들어갈 수 있어요.',
        caution: '의도하지 않으면 서서히 거리감이 생길 수 있어요. 함께하는 시간을 꾸준히 만들어가세요.',
        tip: '함께하는 루틴을 만들어보세요. 작은 공유가 큰 유대로 이어져요 🌟',
      };
    }
  }

  return { getPillar, calculate, getMessage, ELEMENTS, BRANCHES, STEMS };
})();
