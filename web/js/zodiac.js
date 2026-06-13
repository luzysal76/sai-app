/**
 * 사이(Sai) — 별자리 궁합 엔진
 * 12 Zodiac Signs + 원소/각도 기반 궁합 분석
 */
window.SaiZodiac = (function () {

  const SIGNS = [
    { name: '양자리',    symbol: '♈', emoji: '🔥', element: 'fire',  quality: 'cardinal', dates: '3/21-4/19',  trait: '열정적이고 리더십이 강한',   keyword: ['용기','열정','추진력'] },
    { name: '황소자리',  symbol: '♉', emoji: '🌿', element: 'earth', quality: 'fixed',    dates: '4/20-5/20',  trait: '안정적이고 감각이 풍부한',   keyword: ['인내','안정','감각'] },
    { name: '쌍둥이자리',symbol: '♊', emoji: '💨', element: 'air',   quality: 'mutable',  dates: '5/21-6/20',  trait: '호기심 많고 재치 있는',       keyword: ['소통','유연','지성'] },
    { name: '게자리',    symbol: '♋', emoji: '🌊', element: 'water', quality: 'cardinal', dates: '6/21-7/22',  trait: '감성적이고 보호 본능이 강한',  keyword: ['감성','보호','가족'] },
    { name: '사자자리',  symbol: '♌', emoji: '🔥', element: 'fire',  quality: 'fixed',    dates: '7/23-8/22',  trait: '카리스마 넘치고 창의적인',     keyword: ['자신감','창의','리더십'] },
    { name: '처녀자리',  symbol: '♍', emoji: '🌿', element: 'earth', quality: 'mutable',  dates: '8/23-9/22',  trait: '섬세하고 분석적인',           keyword: ['완벽','분석','세심'] },
    { name: '천칭자리',  symbol: '♎', emoji: '💨', element: 'air',   quality: 'cardinal', dates: '9/23-10/22', trait: '균형 감각이 뛰어나고 매력적인', keyword: ['균형','조화','매력'] },
    { name: '전갈자리',  symbol: '♏', emoji: '🌊', element: 'water', quality: 'fixed',    dates: '10/23-11/21',trait: '강렬하고 직관이 예리한',       keyword: ['강렬','직관','변화'] },
    { name: '사수자리',  symbol: '♐', emoji: '🔥', element: 'fire',  quality: 'mutable',  dates: '11/22-12/21',trait: '자유롭고 모험을 즐기는',       keyword: ['자유','모험','철학'] },
    { name: '염소자리',  symbol: '♑', emoji: '🌿', element: 'earth', quality: 'cardinal', dates: '12/22-1/19', trait: '성실하고 목표 의식이 강한',    keyword: ['성실','책임','야망'] },
    { name: '물병자리',  symbol: '♒', emoji: '💨', element: 'air',   quality: 'fixed',    dates: '1/20-2/18',  trait: '독창적이고 인류애가 넘치는',   keyword: ['독창','혁신','자유'] },
    { name: '물고기자리',symbol: '♓', emoji: '🌊', element: 'water', quality: 'mutable',  dates: '2/19-3/20',  trait: '공감 능력이 뛰어나고 직관적인', keyword: ['공감','상상','영성'] },
  ];

  // 원소 궁합 기본 점수
  const ELEM_SCORE = {
    fire:  { fire: 85, earth: 52, air: 88, water: 45 },
    earth: { fire: 52, earth: 85, air: 50, water: 80 },
    air:   { fire: 88, earth: 50, air: 85, water: 55 },
    water: { fire: 45, earth: 80, air: 55, water: 85 },
  };

  const ELEM_KR = { fire: '불(火)', earth: '흙(地)', air: '바람(風)', water: '물(水)' };
  const ELEM_EMOJI = { fire: '🔥', earth: '🌿', air: '💨', water: '🌊' };

  function getSign(month, day) {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 0;
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 1;
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 2;
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 3;
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 4;
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 5;
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 6;
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 7;
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 8;
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 9;
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 10;
    return 11; // Pisces
  }

  function calculate(m1, d1, m2, d2) {
    const i1 = getSign(m1, d1), i2 = getSign(m2, d2);
    const s1 = SIGNS[i1], s2 = SIGNS[i2];

    let base = ELEM_SCORE[s1.element][s2.element];

    // 각도 보정 (trines +8, sextiles +4, squares -8, oppositions ±0)
    const dist = Math.min(Math.abs(i1 - i2), 12 - Math.abs(i1 - i2));
    const adjust = { 0: 0, 1: -2, 2: 5, 3: -10, 4: 9, 5: -3, 6: 3 }[dist] ?? 0;
    const score = Math.max(42, Math.min(95, base + adjust));

    const aspectLabel =
      dist === 0 ? '합(合)' :
      dist === 4 ? '삼각(Trine)' :
      dist === 2 ? '육각(Sextile)' :
      dist === 6 ? '대각(Opposition)' :
      dist === 3 ? '직각(Square)' : '기타';

    return { s1, s2, i1, i2, score, dist, aspectLabel, ELEM_KR, ELEM_EMOJI };
  }

  function getMessage(result) {
    const { s1, s2, dist, score } = result;
    const e1 = s1.element, e2 = s2.element;
    const pair = [e1, e2].sort().join('-');

    if (e1 === e2) return {
      summary: `같은 ${ELEM_KR[e1]} 에너지 — 깊은 공명`,
      strength: `${s1.name}과 ${s2.name}은 같은 원소의 에너지를 공유해요. 서로를 직관적으로 이해하며 편안한 공감대를 형성해요. 함께할수록 자연스럽게 조화를 이뤄요.`,
      caution: '비슷한 성향이라 서로의 단점도 공유할 수 있어요. 의도적으로 다른 시각을 가져와 균형을 맞춰주세요.',
      tip: dist === 4 ? '같은 원소 삼각 관계 — 최고의 궁합 중 하나예요. 함께하는 모든 것이 시너지를 낼 거예요 🌟' : '공통 관심사를 깊게 파고들되 서로 다른 경험도 나누며 자극을 주고받으세요 ✨',
    };

    if (pair === 'air-fire') return {
      summary: `${ELEM_EMOJI.fire} 불과 ${ELEM_EMOJI.air} 바람의 시너지`,
      strength: '바람이 불을 더 크게 피우듯, 서로를 고양시키는 이상적인 조합이에요. 아이디어와 열정이 만나 폭발적인 에너지를 만들어내요.',
      caution: '두 사람 모두 에너지가 넘쳐 집중력이 흐트러질 수 있어요. 함께 목표를 세우고 현실적으로 접근하는 연습이 필요해요.',
      tip: '창의적인 프로젝트나 모험을 함께 기획해보세요. 그 과정에서 엄청난 시너지가 나와요 🚀',
    };

    if (pair === 'earth-water') return {
      summary: `${ELEM_EMOJI.earth} 흙과 ${ELEM_EMOJI.water} 물의 풍요로운 결합`,
      strength: '물이 땅을 적시고 꽃을 피우듯, 깊이 있고 지속적인 관계를 만들어요. 현실적인 안정감과 감성적인 유대가 동시에 충족돼요.',
      caution: '흙이 물을 너무 막으면 고이게 되듯, 서로의 변화 욕구를 무시하지 말아주세요.',
      tip: '일상 속 작은 감사를 표현하고, 함께 성장하는 루틴을 만들어보세요 🌱',
    };

    if (pair === 'fire-water') return {
      summary: `${ELEM_EMOJI.fire} 불과 ${ELEM_EMOJI.water} 물의 강렬한 긴장`,
      strength: '정반대의 에너지가 만들어내는 강렬한 끌림이 있어요. 서로 부족한 부분을 채워주며 각자를 더 완전하게 만들어줘요.',
      caution: '서로의 방식이 충돌할 때 깊이 상처받을 수 있어요. 상대방의 다름을 적으로 보지 말고 보완자로 바라보는 연습이 필요해요.',
      tip: '감정이 격해질 때는 타임아웃을 선언하고 각자 진정할 시간을 가져보세요 💧🔥',
    };

    if (pair === 'air-earth') return {
      summary: `${ELEM_EMOJI.air} 바람과 ${ELEM_EMOJI.earth} 흙의 이상과 현실`,
      strength: '이상적인 아이디어와 현실적인 실행력이 만나는 조합이에요. 서로 다른 강점으로 균형을 맞출 수 있어요.',
      caution: '속도와 방식의 차이로 답답함을 느낄 수 있어요. 서로의 페이스를 존중하며 맞춰가는 과정이 중요해요.',
      tip: '상대방의 의사결정 방식을 비판하지 말고 함께 문제를 풀어가는 접근을 해보세요 🤝',
    };

    return {
      summary: `${s1.name}과 ${s2.name}의 신비로운 만남`,
      strength: '서로 다른 에너지가 만들어내는 독특한 매력이 있어요. 상대방에게서 내가 가지지 못한 부분을 발견하며 성장할 수 있어요.',
      caution: '서로 이해하는 데 더 많은 시간과 노력이 필요해요. 상대방의 다름을 인정하는 것이 관계의 핵심이에요.',
      tip: '서로에 대한 호기심을 잃지 말고, 상대방을 계속 알아가는 과정 자체를 즐겨보세요 🔭',
    };
  }

  return { SIGNS, getSign, calculate, getMessage, ELEM_KR, ELEM_EMOJI };
})();
