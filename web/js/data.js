/**
 * 헤아림 - 데이터 (MVP)
 * 표현 해석 DB + 카톡 신호 사전 + 읽씹 모델 + 성장 미션 풀
 * 엔진(engine.js)이 키워드 매칭으로 사용. 추후 Claude API 폴백.
 *
 * 해석 항목(entry) 구조:
 *  keys        매칭 키워드
 *  relation    적용 관계 [lover some friend family work]
 *  surface     표면 의미
 *  hidden      숨은 감정 한 줄
 *  possibilities [{label, pct}]  가능성 분석 (합 100 권장)
 *  emotions    감정 태그
 *  action      추천 행동(한 문장)
 *  confidence  해석 신뢰도 0~100
 *  replies     [{style, text}] 답장 추천 (style: 공감/다정/유머/썸)
 *  tip         한 줄 조언
 */
window.HEARIM_DB = [
  {
    keys: ['괜찮아', '괜찮아요', '난 괜찮아', '괜찮은데'],
    relation: ['lover', 'some', 'friend', 'family'],
    surface: '괜찮음',
    hidden: '서운함을 참고 있을 가능성',
    possibilities: [
      { label: '진짜 괜찮음', pct: 30 },
      { label: '관심을 원함', pct: 50 },
      { label: '화남', pct: 20 },
    ],
    emotions: ['🥺 참는중', '💗 관심받고싶음'],
    action: '혹시 내가 놓친 게 있으면 말해줘.',
    confidence: 75,
    replies: [
      { style: '공감', text: '괜찮다고 해도 마음 쓰여. 무슨 일 있었어?' },
      { style: '다정', text: '무리하지 마. 내가 챙기고 싶어서 그래' },
      { style: '유머', text: '괜찮긴~ 얼굴에 다 써있는데? ㅎㅎ 말해봐' },
      { style: '썸', text: '네가 괜찮아도 난 안 괜찮은데. 오늘 잠깐 볼래?' },
    ],
    tip: '"그래 알았어" 하고 넘기면 서운함이 쌓여요. 한 번 더 살펴주세요.',
  },
  {
    keys: ['알아서 해', '알아서', '맘대로 해', '마음대로 해', '네 맘대로'],
    relation: ['lover', 'some', 'friend'],
    surface: '네가 정해',
    hidden: '먼저 알아채고 챙겨주길 바람',
    possibilities: [
      { label: '진짜 위임', pct: 20 },
      { label: '챙겨주길 원함', pct: 55 },
      { label: '삐짐/서운함', pct: 25 },
    ],
    emotions: ['😤 삐짐', '🥺 서운함'],
    action: '혹시 내가 서운하게 한 거 있어? 그럼 ○○ 하는 건 어때?',
    confidence: 82,
    replies: [
      { style: '공감', text: '혹시 서운한 거 있어? 있으면 풀고 싶어' },
      { style: '다정', text: '그럼 내가 정할게! 네가 좋아하는 ○○ 가자' },
      { style: '유머', text: '알아서 하라며~ 그럼 평생 내 옆에 있기로 결정 ㅎㅎ' },
      { style: '썸', text: '그럼 오늘은 내가 리드할게. 따라와 봐 :)' },
    ],
    tip: '"그래 내 맘대로 할게"는 최악. 서운함부터 풀어주세요.',
  },
  {
    keys: ['됐어', '신경 쓰지 마', '신경쓰지마', '관심 꺼'],
    relation: ['lover', 'some', 'friend'],
    surface: '신경 쓰지 마',
    hidden: '사실은 더 신경 써주길 바람(반어)',
    possibilities: [
      { label: '진짜 괜찮음', pct: 15 },
      { label: '더 챙겨주길 원함', pct: 55 },
      { label: '화남', pct: 30 },
    ],
    emotions: ['😤 삐짐', '🥺 서운함'],
    action: '됐긴 뭐가 됐어~ 무슨 일인지 말해줘.',
    confidence: 80,
    replies: [
      { style: '공감', text: '됐다고 하지만 마음 상한 거 같아. 풀어주고 싶어' },
      { style: '다정', text: '미안, 내가 놓친 거 있으면 알려줘. 풀자 우리' },
      { style: '유머', text: '신경 끄라니까 더 켜지는데? ㅎㅎ 뭔데 말해봐' },
      { style: '썸', text: '내가 신경 쓰이는 사람인가 보네? ㅎㅎ 얘기해줘' },
    ],
    tip: '여기서 진짜 신경 끄면 악화돼요. 다가가는 게 정답.',
  },
  {
    keys: ['피곤해', '피곤하다', '지친다', '힘들어', '지쳐', '힘들다'],
    relation: ['lover', 'some', 'friend'],
    surface: '몸이 피곤함',
    hidden: '위로와 관심을 받고 싶음',
    possibilities: [
      { label: '단순 피곤', pct: 35 },
      { label: '위로받고싶음', pct: 50 },
      { label: '서운함 표출', pct: 15 },
    ],
    emotions: ['🥺 위로필요', '💗 관심받고싶음'],
    action: '많이 힘들었구나ㅠㅠ 오늘 푹 쉬어. 내가 뭐 해줄까?',
    confidence: 78,
    replies: [
      { style: '공감', text: '오늘 정말 힘들었겠다. 고생했어ㅠㅠ' },
      { style: '다정', text: '수고 많았어. 맛있는 거 먹고 푹 쉬어' },
      { style: '유머', text: '체력 게이지 0이네 ㅎㅎ 충전하게 내가 간식 쏠게' },
      { style: '썸', text: '내가 옆에 있었으면 커피라도 사줬을 텐데' },
    ],
    tip: '"왜?"라고 캐묻기보다 먼저 공감해주세요.',
  },
  {
    keys: ['다음에 보자', '다음에 봐', '나중에 보자', '언제 한번 보자', '언제 봐'],
    relation: ['lover', 'some', 'friend'],
    surface: '다음에 만나자',
    hidden: '진심일 수도, 예의상 인사일 수도',
    possibilities: [
      { label: '진짜 약속 의사', pct: 35 },
      { label: '예의상 인사', pct: 40 },
      { label: '일정 미정/보류', pct: 25 },
    ],
    emotions: ['😐 애매함', '🤔 확인필요'],
    action: '말로만 두지 말고 "이번 주 ○요일 어때?"로 날짜를 던져보세요.',
    confidence: 64,
    replies: [
      { style: '공감', text: '좋아! 근데 우리 진짜 자주 못 봤다 ㅎㅎ' },
      { style: '다정', text: '응 다음에 꼭 보자~ 이번 주말은 어때?' },
      { style: '유머', text: '"다음에"가 벌써 세 번째인데? ㅋㅋ 날짜 잡자' },
      { style: '썸', text: '다음에 말고 이번 주 어때? 보고 싶어서 :)' },
    ],
    tip: '구체적 날짜를 제안하면 상대 진심 여부가 바로 드러나요.',
  },
  {
    keys: ['화 안 났어', '화 안났어', '화난 거 아니야', '안 삐졌어'],
    relation: ['lover', 'some', 'friend'],
    surface: '화 안 남',
    hidden: '대부분 화가 났다는 강한 신호',
    possibilities: [
      { label: '진짜 안 났음', pct: 15 },
      { label: '화남(부정)', pct: 60 },
      { label: '서운함', pct: 25 },
    ],
    emotions: ['😤 화남', '🥺 서운함'],
    action: '화났구나... 미안해. 내가 뭘 잘못했는지 알려줄래?',
    confidence: 84,
    replies: [
      { style: '공감', text: '말 안 해도 느껴져ㅠㅠ 마음 상하게 해서 미안' },
      { style: '다정', text: '화 풀어주고 싶어. 얼굴 보고 얘기하자' },
      { style: '유머', text: '안 났다는데 왜 이렇게 무섭지 ㅎㅎ 미안해 진짜' },
      { style: '썸', text: '내가 잘못했어. 만나서 사과 제대로 할게' },
    ],
    tip: '"화 안 났다며?"라고 따지면 폭발해요. 마음을 먼저 읽어주세요.',
  },
  {
    keys: ['바빠', '바쁘다', '나중에', '이따', '시간 없어'],
    relation: ['lover', 'some'],
    surface: '바쁨',
    hidden: '정말 바쁘거나, 완곡한 거리두기',
    possibilities: [
      { label: '진짜 바쁨', pct: 45 },
      { label: '관심 식음', pct: 30 },
      { label: '대화 회피', pct: 25 },
    ],
    emotions: ['😐 거리두기', '🤔 확인필요'],
    action: '재촉하지 말고 "편할 때 연락해~" 후 만남을 구체 제안.',
    confidence: 62,
    replies: [
      { style: '공감', text: '바쁜데 답해줘서 고마워. 무리하지 마' },
      { style: '다정', text: '일 끝나고 편할 때 연락해~ 기다릴게' },
      { style: '유머', text: '바쁜 사람 인기 많네 ㅎㅎ 틈나면 불러줘' },
      { style: '썸', text: '바빠도 밥은 먹어야지~ 이번 주 한 끼 어때?' },
    ],
    tip: '빈도가 잦다면 주의 신호. 여유를 보이되 약속은 구체적으로.',
  },
  {
    keys: ['잘 지내', '잘 지내지', '잘 지냈어', '연락 안 하네', '오랜만'],
    relation: ['some', 'friend'],
    surface: '안부 인사',
    hidden: '"네 생각났어"라는 관심 표현일 수 있음',
    possibilities: [
      { label: '단순 안부', pct: 35 },
      { label: '관심/그리움', pct: 45 },
      { label: '떠보기', pct: 20 },
    ],
    emotions: ['💗 관심', '👀 떠보기'],
    action: '반가움을 표현하고 자연스럽게 만남으로 이어가기.',
    confidence: 64,
    replies: [
      { style: '공감', text: '오 오랜만이다! 나도 잘 지내~ 너는?' },
      { style: '다정', text: '안 그래도 네 생각 했었는데 :) 곧 한번 볼래?' },
      { style: '유머', text: '갑자기 안부? 내가 보고 싶었구만 ㅋㅋ' },
      { style: '썸', text: '연락 반갑다. 이참에 얼굴 보자, 언제 시간 돼?' },
    ],
    tip: '먼저 온 안부는 좋은 신호. 만남 제안으로 이어가세요.',
  },
];

/** 매칭 실패 시 관계별 기본 폴백 */
window.HEARIM_FALLBACK = {
  _common: {
    surface: '문맥 필요',
    hidden: 'DB에 없는 표현 — 맥락이 더 필요해요',
    possibilities: [
      { label: '긍정/호의', pct: 40 },
      { label: '중립', pct: 35 },
      { label: '부정/거리두기', pct: 25 },
    ],
    emotions: ['🤔 맥락필요'],
    confidence: 42,
    tip: '더 정확한 해석은 곧 추가될 AI 번역(Claude)으로 가능해져요.',
  },
  lover: { action: '지금 기분 어때? 네 얘기 듣고 싶어.' },
  some: { action: 'ㅎㅎ 그렇구나~ 너는 어떻게 생각해?' },
  friend: { action: '무슨 뜻이야? ㅋㅋ 솔직하게 말해도 돼.' },
  family: { action: '걱정해줘서 고마워. 좀 더 자세히 말해줄래?' },
  work: { action: '확인해보고 다시 말씀드리겠습니다.' },
};

/** 카톡 분석용 신호 사전 (휴리스틱) */
window.HEARIM_SIGNALS = {
  positive: ['ㅋㅋ', 'ㅎㅎ', 'ㅎㅋ', '좋아', '좋다', '재밌', '귀여', '보고싶', '보고 싶', '고마', '사랑', '최고', '대박', '예뻐', '멋있', '설레'],
  emoji: ['😊', '😍', '🥰', '❤', '💕', '💗', '😘', '👍', 'ㅎ', 'ㅋ', '~', '!', 'ㅠ', 'ㅜ'],
  question: ['?', '뭐해', '뭐 해', '어때', '할까', '갈까', '봤어', '먹었'],
  negative: ['바빠', '나중에', 'ㅇㅇ', 'ㅇㅋ', '응', '글쎄', '몰라', '됐어', '아니', '그래'],
  initiative: ['우리', '만나', '보자', '볼래', '갈래', '먹자', '약속', '시간 돼', '언제'],
};

/** 읽씹 분석 모델 (시간대별 가능성 보정) */
window.HEARIM_READMODEL = {
  base: [
    { key: 'busy', label: '바쁨', pct: 45 },
    { key: 'low', label: '우선순위 낮음', pct: 30 },
    { key: 'style', label: '연락 스타일 차이', pct: 20 },
    { key: 'distance', label: '거리두기', pct: 5 },
  ],
  caution: '단일 행동만으로 마음을 단정할 수 없어요. 패턴을 함께 보세요.',
};

/** 성장 코치 미션 풀 (관계별) */
window.HEARIM_MISSIONS = {
  lover: ['먼저 안부 묻기', '오늘 고마웠던 점 1가지 표현', '진심 칭찬 1회 하기', '"보고 싶다" 한 번 말하기', '상대 얘기 끝까지 듣기'],
  some: ['가벼운 안부 톡 먼저 보내기', '공통 관심사 질문 1개', '자연스러운 만남 제안', '답장에 이모티콘 1개 추가', '상대 SNS에 반응 남기기'],
  friend: ['먼저 연락하기', '고마웠던 일 표현', '가벼운 약속 제안', '근황 물어보기', '칭찬 1회 하기'],
  family: ['안부 전화/톡 하기', '감사 표현 1회', '식사 같이 하기 제안', '걱정 대신 응원 말하기', '추억 한 가지 떠올려 말하기'],
  work: ['감사 인사 1회', '협업 피드백 정중히 표현', '점심/커피 제안', '상대 노력 인정하기', '명확하게 소통하기'],
};
