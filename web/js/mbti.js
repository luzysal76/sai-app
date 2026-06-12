/**
 * 사이(Sai) — MBTI 궁합 분석 엔진
 * 16x16 조합 → 궁합 점수 · 닉네임 · 인사이트
 */
(function () {
  const TYPES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
                 'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];

  // 황금 페어 (가장 보완적인 조합)
  const GOLDEN = new Set([
    'INTJ-ENFP','ENFP-INTJ','INTP-ENTJ','ENTJ-INTP',
    'INFJ-ENTP','ENTP-INFJ','INFP-ENFJ','ENFJ-INFP',
    'ISTJ-ESFP','ESFP-ISTJ','ISFJ-ESTP','ESTP-ISFJ',
    'ESTJ-ISFP','ISFP-ESTJ','ESFJ-ISTP','ISTP-ESFJ',
  ]);

  // 좋은 페어 (자주 잘 맞는 조합)
  const GOOD = new Set([
    'INTJ-INFJ','INFJ-INTJ','INTP-INFP','INFP-INTP',
    'ENTJ-ENFJ','ENFJ-ENTJ','ENTP-ENFP','ENFP-ENTP',
    'ISTJ-ISFJ','ISFJ-ISTJ','ESTJ-ESFJ','ESFJ-ESTJ',
    'ISTP-ISFP','ISFP-ISTP','ESTP-ESFP','ESFP-ESTP',
    'INTJ-INTP','INTP-INTJ','INFJ-INFP','INFP-INFJ',
    'ENTJ-ENTP','ENTP-ENTJ','ENFJ-ENFP','ENFP-ENFJ',
  ]);

  // 차원별 궁합 점수
  function dimScore(a, b) {
    let score = 60;
    // E/I: 반대면 보완 (외향 에너지 + 내향 깊이)
    if (a[0] !== b[0]) score += 10;
    else score += 3; // 같은 방향이라 편함
    // N/S: 같으면 세계관 공유
    if (a[1] === b[1]) score += 8;
    else score += 4; // 다르면 현실+상상 균형
    // T/F: 반대면 감성-논리 균형
    if (a[2] !== b[2]) score += 8;
    else score += 3;
    // J/P: 반대면 생활에 활력
    if (a[3] !== b[3]) score += 6;
    else score += 2;
    return score;
  }

  // 특별 보너스
  function bonusScore(a, b) {
    const key = `${a}-${b}`;
    if (GOLDEN.has(key)) return 15;
    if (GOOD.has(key)) return 8;
    // 완전 동일 타입
    if (a === b) return 5;
    return 0;
  }

  // NF 이상주의자 그룹
  const NF = new Set(['INFJ','INFP','ENFJ','ENFP']);
  const NT = new Set(['INTJ','INTP','ENTJ','ENTP']);
  const SJ = new Set(['ISTJ','ISFJ','ESTJ','ESFJ']);
  const SP = new Set(['ISTP','ISFP','ESTP','ESFP']);

  function getGroup(t) {
    if (NF.has(t)) return 'NF';
    if (NT.has(t)) return 'NT';
    if (SJ.has(t)) return 'SJ';
    if (SP.has(t)) return 'SP';
    return '';
  }

  // 커플 닉네임 생성
  function coupleName(a, b, score) {
    if (score >= 90) {
      const names = ['소울메이트 커플', '운명 커플', '천생연분', '찰떡궁합'];
      return names[Math.floor((a.charCodeAt(0) + b.charCodeAt(0)) % names.length)];
    }
    if (score >= 80) {
      const names = ['최고의 파트너', '이상적인 커플', '든든한 동반자', '환상의 듀오'];
      return names[Math.floor((a.charCodeAt(1) + b.charCodeAt(1)) % names.length)];
    }
    if (score >= 70) {
      const names = ['성장하는 커플', '배움을 주는 관계', '서로를 완성시키는 사이', '밸런스 커플'];
      return names[Math.floor((a.charCodeAt(2) + b.charCodeAt(2)) % names.length)];
    }
    if (score >= 60) {
      const names = ['노력이 필요한 관계', '차이를 극복하는 커플', '서로 맞춰가는 사이'];
      return names[Math.floor((a.charCodeAt(0) + b.charCodeAt(3)) % names.length)];
    }
    return '도전적인 관계';
  }

  // 강점 설명 (차원 기반)
  function getStrengths(a, b) {
    const strengths = [];
    const gA = getGroup(a), gB = getGroup(b);

    if (a[0] !== b[0]) {
      strengths.push(a[0] === 'E'
        ? '활발한 에너지로 일상을 풍요롭게, 깊은 사색으로 관계에 깊이를 더해요'
        : '섬세한 배려와 활동적인 에너지가 서로를 채워줘요');
    } else {
      strengths.push(a[0] === 'E'
        ? '둘 다 사교적이라 함께 있으면 항상 즐겁고 에너지가 넘쳐요'
        : '서로의 공간을 존중하며 깊이 있는 대화를 즐겨요');
    }

    if (a[1] === b[1]) {
      strengths.push(a[1] === 'N'
        ? '같은 상상력과 비전으로 대화가 끝없이 이어져요'
        : '현실적이고 실용적인 관점을 공유해 함께 안정감이 있어요');
    } else {
      strengths.push('현실과 가능성 사이에서 서로 균형을 잡아줘요');
    }

    if (a[2] !== b[2]) {
      strengths.push('논리적 판단과 감성적 공감이 합쳐져 최고의 결정을 내려요');
    } else if (a[2] === 'F') {
      strengths.push('서로의 감정을 잘 이해하고 공감하는 따뜻한 관계예요');
    } else {
      strengths.push('목표 지향적이고 합리적인 판단을 함께해요');
    }

    // 같은 그룹이면 추가 강점
    if (gA === gB) {
      const grpStr = {
        NF: '이상과 가치관을 공유하며 서로에게 영감을 줘요',
        NT: '지적 호기심과 전략적 사고를 함께 즐겨요',
        SJ: '책임감 있고 안정적인 관계를 함께 만들어가요',
        SP: '자유롭고 즉흥적인 모험을 함께 즐길 수 있어요',
      };
      strengths.push(grpStr[gA]);
    }

    return strengths.slice(0, 3);
  }

  // 주의사항
  function getChallenges(a, b) {
    const challenges = [];

    if (a[0] === b[0] && a[0] === 'E') {
      challenges.push('둘 다 말이 많아 가끔 서로 듣기보다 말하는 상황이 생길 수 있어요');
    } else if (a[0] === b[0] && a[0] === 'I') {
      challenges.push('새로운 활동이나 사교 활동을 함께 적극적으로 만들 노력이 필요해요');
    }

    if (a[1] !== b[1]) {
      challenges.push('대화 스타일이 달라 가끔 "현실적으로 말해줘" vs "왜 꿈을 좁히려 해?" 충돌이 생길 수 있어요');
    }

    if (a[2] !== b[2]) {
      challenges.push('감정 표현 방식이 달라 "왜 차갑게 반응해?" vs "왜 이렇게 감정적이야?" 오해가 생길 수 있어요');
    }

    if (a[3] !== b[3]) {
      challenges.push('계획 vs 즉흥 스타일 차이로 약속이나 일정에서 갈등이 생길 수 있어요');
    } else if (a[3] === 'J') {
      challenges.push('둘 다 자기 방식이 강해 주도권 다툼이 생길 수 있어요');
    }

    return challenges.slice(0, 2);
  }

  // 관계 팁
  function getTip(a, b, score) {
    if (score >= 90) return '이 조합은 서로를 자연스럽게 이해해요. 서로의 성장을 응원하며 더 깊어질 수 있어요 💫';
    if (score >= 80) return '작은 차이를 "단점"이 아닌 "매력"으로 바라보면 완벽한 파트너가 될 수 있어요 💗';
    if (score >= 70) return '서로 다른 점이 많아 처음엔 어색할 수 있지만, 그 차이가 성장의 기회예요 🌱';
    return '이 조합은 노력이 필요하지만, 서로를 깊이 이해하면 누구보다 강한 팀이 돼요 💪';
  }

  // 메인 분석 함수
  function analyze(myType, theirType) {
    if (!TYPES.includes(myType) || !TYPES.includes(theirType)) return null;

    const base    = dimScore(myType, theirType);
    const bonus   = bonusScore(myType, theirType);
    const raw     = Math.min(98, base + bonus);
    const score   = raw;
    const hearts  = score >= 90 ? 5 : score >= 80 ? 4 : score >= 70 ? 3 : score >= 60 ? 2 : 1;
    const name    = coupleName(myType, theirType, score);
    const isGolden = GOLDEN.has(`${myType}-${theirType}`);

    return {
      score,
      hearts,
      name,
      isGolden,
      strengths:  getStrengths(myType, theirType),
      challenges: getChallenges(myType, theirType),
      tip:        getTip(myType, theirType, score),
    };
  }

  // 타입 설명
  const TYPE_DESC = {
    INTJ:'전략가 — 독립적이고 분석적', INTP:'논리술사 — 창의적인 이론가',
    ENTJ:'통솔자 — 대담한 리더',      ENTP:'변론가 — 열정적인 혁신가',
    INFJ:'옹호자 — 조용한 이상주의자', INFP:'중재자 — 따뜻한 몽상가',
    ENFJ:'선도자 — 카리스마 있는 교사', ENFP:'활동가 — 열정적인 활력 자체',
    ISTJ:'청렴결백 — 책임감 있는 관리자', ISFJ:'수호자 — 따뜻한 보호자',
    ESTJ:'경영자 — 질서와 원칙의 수호자', ESFJ:'집정관 — 배려 넘치는 사교가',
    ISTP:'만능재주꾼 — 대담한 실용주의자', ISFP:'모험가 — 자유로운 예술가',
    ESTP:'사업가 — 활기찬 현실주의자',   ESFP:'연예인 — 즉흥적인 에너지',
  };

  window.SaiMBTI = { analyze, TYPES, TYPE_DESC };
})();
