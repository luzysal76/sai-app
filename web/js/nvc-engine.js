/**
 * 헤아림 - NVC(비폭력 대화) 엔진
 * 로젠버그 NVC 4단계: 관찰 → 감정 → 욕구 → 부탁
 *
 * exportedfunction:
 *   transformNVC(text, relation)    → { observation, feeling, need, request, tip, needTags, feelingTags }
 *   analyzeHiddenNeeds(text)        → { surface, hidden, needs, feelings, tip, advice }
 */
window.HearimNVC = (function () {

  // ── 욕구 카테고리 (로젠버그 기반 한국화) ──
  const NEEDS = {
    connection:    { label: '연결·친밀감',   emoji: '💗', desc: '가까이 있고 싶고, 함께 있다는 느낌을 원해요' },
    respect:       { label: '존중·인정',     emoji: '🌟', desc: '나의 말과 감정이 소중하게 여겨지길 원해요' },
    safety:        { label: '안전·안정감',   emoji: '🛡️', desc: '이 관계가 안전하다는 확신이 필요해요' },
    understanding: { label: '이해받음',      emoji: '🤝', desc: '내 입장을 알아주는 사람이 필요해요' },
    autonomy:      { label: '자율성',        emoji: '🌿', desc: '스스로 결정하고 선택하는 공간이 필요해요' },
    care:          { label: '돌봄·배려',     emoji: '🌸', desc: '먼저 챙겨주는 따뜻함이 필요해요' },
    meaning:       { label: '의미·기여',     emoji: '✨', desc: '내가 이 관계에서 의미 있는 존재가 되길 원해요' },
    honesty:       { label: '솔직함·신뢰',   emoji: '🔑', desc: '속마음을 안전하게 나눌 수 있길 원해요' },
    support:       { label: '지지·응원',     emoji: '💪', desc: '내 편이 있다는 느낌이 필요해요' },
    fun:           { label: '즐거움·재미',   emoji: '😊', desc: '함께 웃고 즐길 시간이 필요해요' },
  };

  // ── NVC 번역 패턴 DB ──
  const NVC_PATTERNS = [
    {
      trigger: /맨날|항상|매번|늘|언제나/,
      emotion: '지치고 답답함',
      feeling: '지쳐 있고 답답해',
      needKey: 'understanding',
      observeHint: '~한 상황이 반복될 때',
      requestHint: '한 번씩 ~해줄 수 있을까?',
    },
    {
      trigger: /무시|듣지 않|말을 안 들|귀 기울|경청/,
      emotion: '서운함과 외로움',
      feeling: '존중받지 못하는 것 같아 서운해',
      needKey: 'respect',
      observeHint: '내가 말할 때 다른 곳에 집중하면',
      requestHint: '내가 말할 때 눈을 봐줄 수 있을까?',
    },
    {
      trigger: /당신만|네 생각만|자기 생각만|이기적|자기중심/,
      emotion: '소외감과 외로움',
      feeling: '혼자인 것 같아 외로워',
      needKey: 'connection',
      observeHint: '결정할 때 내 의견이 반영되지 않으면',
      requestHint: '결정할 때 나도 같이 이야기해줄 수 있을까?',
    },
    {
      trigger: /화가 나|짜증|열받|미치겠|돌겠/,
      emotion: '좌절감과 화',
      feeling: '매우 좌절스럽고 화가 나',
      needKey: 'understanding',
      observeHint: '상황이 반복될 때',
      requestHint: '이 부분에 대해 같이 이야기해볼 수 있을까?',
    },
    {
      trigger: /왜 그래|뭐가 문제|왜 이러|이해 못해/,
      emotion: '답답함과 거리감',
      feeling: '서로 이해가 되지 않아 답답해',
      needKey: 'understanding',
      observeHint: '서로 다른 방식으로 행동할 때',
      requestHint: '서로의 입장을 차분히 나눌 시간을 가질 수 있을까?',
    },
    {
      trigger: /관심 없|신경 안|관심도 없|아무래도 상관/,
      emotion: '슬픔과 외로움',
      feeling: '나에게 관심이 없는 것 같아 슬퍼',
      needKey: 'care',
      observeHint: '내가 무언가를 말해도 반응이 없을 때',
      requestHint: '내 이야기에 작은 반응이라도 보내줄 수 있을까?',
    },
    {
      trigger: /차갑|냉정|거리감|멀어진|딴사람 같/,
      emotion: '외로움과 불안감',
      feeling: '우리 사이에 거리가 생긴 것 같아 외로워',
      needKey: 'connection',
      observeHint: '예전보다 대화가 줄어들었을 때',
      requestHint: '오늘 잠깐이라도 이야기할 수 있을까?',
    },
    {
      trigger: /약속을 안|약속을 어|신뢰가 없|믿을 수가/,
      emotion: '실망과 불안',
      feeling: '실망하고 우리 사이가 불안해',
      needKey: 'safety',
      observeHint: '약속한 것이 지켜지지 않을 때',
      requestHint: '앞으로 약속은 서로 지킬 수 있도록 같이 노력해볼 수 있을까?',
    },
    {
      trigger: /지적|비판|잔소리|틀렸|잘못했|네 잘못/,
      emotion: '방어적 감정과 상처',
      feeling: '상처받고 위축되는 것 같아',
      needKey: 'respect',
      observeHint: '내 행동에 대해 비판을 들을 때',
      requestHint: '내가 잘한 것도 함께 이야기해줄 수 있을까?',
    },
    {
      trigger: /도와주지 않|혼자 다|나만|혼자 해야/,
      emotion: '지침과 외로움',
      feeling: '혼자 다 해야 하는 것 같아 지쳐',
      needKey: 'support',
      observeHint: '내가 힘들 때 도움을 받지 못할 때',
      requestHint: '이 부분은 같이 해줄 수 있을까?',
    },
    {
      trigger: /네가 없으면|없어도 돼|귀찮|부담/,
      emotion: '깊은 외로움과 서운함',
      feeling: '내가 짐이 되는 것 같아 너무 서운해',
      needKey: 'meaning',
      observeHint: '내 존재가 환영받지 못하는 것처럼 느껴질 때',
      requestHint: '나도 이 관계에서 중요한 사람이라는 걸 알려줄 수 있을까?',
    },
    {
      trigger: /좋은 말 한 적|칭찬|격려|위로해준 적 없/,
      emotion: '인정받지 못하는 슬픔',
      feeling: '내가 하는 것들이 보이지 않는 것 같아 슬퍼',
      needKey: 'respect',
      observeHint: '내가 노력하는 것에 대해 아무 반응이 없을 때',
      requestHint: '가끔은 내가 잘하고 있다는 말을 해줄 수 있을까?',
    },
    {
      trigger: /대화가 없|말이 없|얘기를 안|소통이 없/,
      emotion: '단절감과 그리움',
      feeling: '우리 사이에 거리가 생긴 것 같아 그리워',
      needKey: 'connection',
      observeHint: '하루에 나누는 대화가 점점 줄어들 때',
      requestHint: '저녁에 잠깐이라도 오늘 어땠는지 이야기해줄 수 있을까?',
    },
    {
      trigger: /무관심|쳐다보지도|쳐다도 안|눈도 안 마주/,
      emotion: '보이지 않는 느낌과 슬픔',
      feeling: '내가 투명 인간이 된 것 같아 슬퍼',
      needKey: 'connection',
      observeHint: '같은 공간에 있어도 연결되지 않는 느낌이 들 때',
      requestHint: '하루에 한 번이라도 나를 안아줄 수 있을까?',
    },
    {
      trigger: /결정을 혼자|혼자 결정|상의 없이|물어보지도/,
      emotion: '소외감과 답답함',
      feeling: '중요한 결정에서 빠진 것 같아 소외감을 느껴',
      needKey: 'autonomy',
      observeHint: '중요한 결정이 나 없이 이루어질 때',
      requestHint: '이런 결정은 같이 상의해줄 수 있을까?',
    },
  ];

  // ── 숨은 욕구 분석 패턴 DB ──
  const HIDDEN_NEED_PATTERNS = [
    {
      trigger: /됐어|알아서 해|신경 쓰지 마|관심 꺼/,
      surface: '밀어내는 표현',
      hidden: '사실은 더 많이 관심을 받고 싶어요',
      needs: ['care', 'understanding'],
      feelings: ['서운함', '상처'],
      advice: '"나 신경 써. 무슨 일 있어?"라고 물어보세요.',
      replies: [
        { tone:'🤗 공감형', text:'나 신경 써. 무슨 일 있어? 말해줘 💗' },
        { tone:'💬 솔직형', text:'솔직히 말해줘. 내가 뭘 잘못한 건지 알고 싶어.' },
        { tone:'🌸 다정형', text:'야, 화났어? 나한테 화내도 돼. 들을게.' },
      ],
    },
    {
      trigger: /괜찮아|나 괜찮아|별거 아니야/,
      surface: '괜찮다는 표현',
      hidden: '괜찮지 않아요. 누군가 알아채줬으면 해요',
      needs: ['understanding', 'care'],
      feelings: ['참음', '외로움'],
      advice: '"정말 괜찮아? 아닌 것 같은데"라고 한 번 더 물어봐 주세요.',
      replies: [
        { tone:'🤗 공감형', text:'정말 괜찮아? 아닌 것 같은데. 말해줘 💗' },
        { tone:'💬 솔직형', text:'나 네 얼굴 보면 괜찮아 보이지 않아. 솔직하게 말해줘.' },
        { tone:'🌸 다정형', text:'괜찮다고 해도 나는 네 편이야. 이야기하고 싶으면 언제든.' },
      ],
    },
    {
      trigger: /그냥|뭐|모르겠어|아무거나/,
      surface: '무관심해 보이는 표현',
      hidden: '말로 표현하기 어려운 감정이 있어요',
      needs: ['understanding', 'honesty'],
      feelings: ['막막함', '표현하기 어려움'],
      advice: '"그냥이 뭔지 궁금해. 편하게 말해줘"라고 열어주세요.',
      replies: [
        { tone:'🤗 공감형', text:'그냥이 뭔지 궁금해. 편하게 말해줘 💗' },
        { tone:'💬 솔직형', text:'말하기 어려운 거 알아. 근데 나 들을 준비 됐어.' },
        { tone:'🌸 다정형', text:'아무 말 안 해도 돼. 그냥 같이 있어줄게.' },
      ],
    },
    {
      trigger: /나 요즘 힘들어|많이 힘들어|너무 힘들어/,
      surface: '힘들다는 표현',
      hidden: '위로와 공감을 원해요. 혼자 있기 싫어요',
      needs: ['support', 'connection'],
      feelings: ['지침', '외로움'],
      advice: '조언하지 말고 "많이 힘들었겠다"로 먼저 공감해주세요.',
      replies: [
        { tone:'🤗 공감형', text:'많이 힘들었겠다. 옆에 있어줄게 💗' },
        { tone:'💬 솔직형', text:'힘들면 말해. 나 네 편이야. 뭐든 들을게.' },
        { tone:'🌸 다정형', text:'고생했다. 오늘 맛있는 거 먹으러 가자. 내가 살게 😊' },
      ],
    },
    {
      trigger: /너는 몰라|이해 못해|어차피|설명해도/,
      surface: '포기한 듯한 표현',
      hidden: '이해받고 싶은데 포기하고 있어요',
      needs: ['understanding', 'connection'],
      feelings: ['포기감', '고립감'],
      advice: '"설명해줘. 이해하고 싶어"라고 다시 열어보세요.',
      replies: [
        { tone:'🤗 공감형', text:'설명해줘. 이해하고 싶어. 진짜로 💗' },
        { tone:'💬 솔직형', text:'내가 모를 수도 있어. 근데 알고 싶어. 말해줘.' },
        { tone:'🌸 다정형', text:'어차피 말해봤자라고 생각하지 마. 나 들을게, 진심으로.' },
      ],
    },
    {
      trigger: /자꾸 잊어|기억도 못|기억이나 해|또 잊었어/,
      surface: '비난하는 표현',
      hidden: '내가 당신에게 중요한 존재인지 확인하고 싶어요',
      needs: ['meaning', 'respect'],
      feelings: ['서운함', '불안'],
      advice: '"미안해, 중요한데 잊었어. 다시 말해줘"라고 진심으로 사과해주세요.',
      replies: [
        { tone:'🤗 공감형', text:'미안해, 중요한데 잊었어. 다시 말해줄 수 있어? 💗' },
        { tone:'💬 솔직형', text:'내 잘못이야. 앞으로 더 신경 쓸게. 정말 미안해.' },
        { tone:'🌸 다정형', text:'너 나한테 중요한 사람이야. 잊어서 미안해 💗' },
      ],
    },
    {
      trigger: /왜 나한테만|나만 이렇게|나만 희생|나만 노력/,
      surface: '억울함 표현',
      hidden: '나의 노력을 알아봐주길 원해요',
      needs: ['respect', 'meaning'],
      feelings: ['억울함', '지침'],
      advice: '"많이 힘들었겠다. 네가 얼마나 노력하는지 알아"라고 인정해주세요.',
      replies: [
        { tone:'🤗 공감형', text:'많이 힘들었겠다. 네가 얼마나 노력하는지 알아 💗' },
        { tone:'💬 솔직형', text:'그동안 고마웠어. 내가 더 잘 챙겼어야 했는데.' },
        { tone:'🌸 다정형', text:'너 진짜 수고했다. 이번엔 내가 더 할게.' },
      ],
    },
    {
      trigger: /어차피|해도 소용없어|달라지겠어|기대 안 해/,
      surface: '체념한 표현',
      hidden: '상처를 너무 많이 받아 자신을 보호하고 있어요',
      needs: ['safety', 'understanding'],
      feelings: ['무기력', '포기감'],
      advice: '"그렇게 느꼈다면 미안해. 이번엔 다를게"라고 말하고 행동으로 보여주세요.',
      replies: [
        { tone:'🤗 공감형', text:'그렇게 느꼈다면 미안해. 이번엔 달라질게 💗' },
        { tone:'💬 솔직형', text:'포기하지 마. 나 진지하게 바꾸려고 해. 기회 한 번만 줘.' },
        { tone:'🌸 다정형', text:'나도 알아, 말만 했던 거. 이번엔 행동으로 보여줄게.' },
      ],
    },
    {
      trigger: /혼자 있고 싶어|내버려 둬|혼자 생각|공간이 필요/,
      surface: '거리 두기 요청',
      hidden: '감정을 정리할 시간이 필요해요. 포기가 아니에요',
      needs: ['autonomy', 'safety'],
      feelings: ['과부하', '정리 필요'],
      advice: '"알겠어, 천천히 생각해. 언제든 얘기하고 싶으면 여기 있을게"라고 해주세요.',
      replies: [
        { tone:'🤗 공감형', text:'알겠어. 천천히 생각해. 언제든 얘기하고 싶으면 여기 있을게 💗' },
        { tone:'💬 솔직형', text:'괜찮아, 혼자 있어도 돼. 나 기다릴게.' },
        { tone:'🌸 다정형', text:'공간 줄게. 근데 나 여기 있다는 거 잊지 마 💗' },
      ],
    },
    {
      trigger: /피곤해|지쳐|힘없어|의욕이 없|무기력/,
      surface: '소진 표현',
      hidden: '지금 많이 지쳐있어요. 응원이 필요해요',
      needs: ['support', 'care'],
      feelings: ['소진', '고갈'],
      advice: '"정말 수고했어. 오늘 쉬어"라고 위로해주세요.',
      replies: [
        { tone:'🤗 공감형', text:'정말 수고했어. 오늘 쉬어. 내가 다 할게 💗' },
        { tone:'💬 솔직형', text:'많이 지쳤지? 뭐가 제일 힘들어? 나눠서 해결하자.' },
        { tone:'🌸 다정형', text:'오늘 치킨 어때? 나 시켜줄게. 그냥 쉬어 😊' },
      ],
    },
    {
      trigger: /뭘 원하는 거야|뭘 원해|원하는 게 뭐|어떻게 해줘야/,
      surface: '방어적·답답한 표현',
      hidden: '상대를 이해하고 싶지만 어떻게 해야 할지 몰라요',
      needs: ['understanding', 'honesty'],
      feelings: ['당혹감', '무력감'],
      advice: '"어떻게 하면 내가 도움이 될 수 있을까?"라고 물어보세요.',
      replies: [
        { tone:'🤗 공감형', text:'어떻게 하면 내가 도움이 될 수 있을까? 말해줘 💗' },
        { tone:'💬 솔직형', text:'내가 뭘 해줘야 할지 솔직하게 말해. 최선을 다해볼게.' },
        { tone:'🌸 다정형', text:'내가 부족한 거 알아. 근데 노력할게. 가르쳐줘 💗' },
      ],
    },
    {
      trigger: /사랑하는 것 맞아|나 좋아해|나한테 관심 있어/,
      surface: '확인 요청',
      hidden: '불안해서 안심이 필요해요',
      needs: ['safety', 'connection'],
      feelings: ['불안', '그리움'],
      advice: '말로만 답하지 말고 행동으로 보여주세요. 안아주거나 눈 맞춰주세요.',
      replies: [
        { tone:'🤗 공감형', text:'당연하지. 왜 그런 생각 했어? 나 여기 있어 💗' },
        { tone:'💬 솔직형', text:'좋아해. 많이. 불안했어? 말했어야지.' },
        { tone:'🌸 다정형', text:'바보야, 당연하지. 이리 와, 안아줄게 💗' },
      ],
    },
  ];

  // ── NVC 감정 사전 ──
  const FEELING_WORDS = {
    negative: ['서운해','외로워','두려워','슬퍼','불안해','답답해','지쳐','화가 나','상처받았어','소외감을 느껴','무기력해','억울해'],
    positive: ['기뻐','안심돼','연결된 느낌이야','따뜻해','감사해','설레'],
  };

  // ── 입력 텍스트에서 NVC 패턴 매칭 ──
  function matchNVC(text) {
    for (const p of NVC_PATTERNS) {
      if (p.trigger.test(text)) return p;
    }
    return null;
  }

  function matchHiddenNeed(text) {
    for (const p of HIDDEN_NEED_PATTERNS) {
      if (p.trigger.test(text)) return p;
    }
    return null;
  }

  // ── 텍스트에서 감정 키워드 추출 ──
  function extractEmotionKeywords(text) {
    const found = [];
    const emotionMap = [
      { pattern: /화|짜증|열받|분노/, word: '화남' },
      { pattern: /슬프|슬픔|눈물/, word: '슬픔' },
      { pattern: /외로|혼자|고립/, word: '외로움' },
      { pattern: /불안|걱정|두려|무서/, word: '불안' },
      { pattern: /서운|섭섭|상처/, word: '서운함' },
      { pattern: /지쳐|피곤|힘들/, word: '지침' },
      { pattern: /답답|막막|좌절/, word: '좌절감' },
      { pattern: /무시|경멸|하찮/, word: '무시당함' },
    ];
    emotionMap.forEach(e => { if (e.pattern.test(text)) found.push(e.word); });
    return found.length ? found : ['복합 감정'];
  }

  // ── 전송용 메시지 3종 생성 (카카오에 바로 보낼 수 있는 형태) ──
  function buildSendMessages(obs, feel, needLabel, req) {
    return [
      {
        tone: '💬 부드럽게',
        desc: '진심을 따뜻하게',
        text: `${obs}, 나는 ${feel}. 나에게는 ${needLabel}이(가) 필요해. ${req} 💗`,
      },
      {
        tone: '💪 솔직하게',
        desc: '감정과 부탁 직접 전달',
        text: `솔직히 말할게. 나 ${feel}. 그러니까 ${req}`,
      },
      {
        tone: '✨ 간결하게',
        desc: '핵심만 짧게',
        text: `나 ${feel}. ${req} 💗`,
      },
    ];
  }

  // ── NVC 번역 (로컬 DB) ──
  function transformNVCLocal(text, relation) {
    const pattern = matchNVC(text);
    const emotions = extractEmotionKeywords(text);
    const needKey = pattern?.needKey || 'understanding';
    const need = NEEDS[needKey];

    // 관찰 문장
    const observation = pattern
      ? `당신이 ${pattern.observeHint}`
      : `이런 상황이 계속될 때`;

    // 감정 문장
    const feeling = pattern?.feeling ||
      (emotions.length ? `${emotions.join(', ')}을 느껴` : '힘든 감정을 느껴');

    // 부탁 문장
    const request = pattern
      ? `${pattern.requestHint}`
      : `이 부분에 대해 같이 이야기해볼 수 있을까?`;

    // 전송용 메시지 3종
    const messages = buildSendMessages(observation, feeling, need.label, request);

    return {
      observation,
      feeling,
      need: need.desc,
      needLabel: need.label,
      needEmoji: need.emoji,
      request,
      messages,
      needTags: [need.label, ...emotions.slice(0,2)],
      feelingTags: emotions,
      tip: `NVC는 비난 없이 내 감정을 전달하는 방법이에요. "${observation}"처럼 사실만 이야기하고, 내 감정을 솔직하게 표현해보세요.`,
      source: 'db',
    };
  }

  // ── 숨은 욕구 분석 (로컬 DB) ──
  function analyzeHiddenNeedsLocal(text) {
    const pattern = matchHiddenNeed(text);
    const emotions = extractEmotionKeywords(text);

    if (pattern) {
      return {
        surface: pattern.surface,
        hidden: pattern.hidden,
        needs: pattern.needs.map(k => NEEDS[k]),
        feelings: pattern.feelings,
        advice: pattern.advice,
        replyMessages: pattern.replies || [],
        tip: '이 말의 이면에는 충족되지 못한 욕구가 있어요. 비난이 아닌 신호로 받아들여보세요.',
        source: 'db',
      };
    }

    // 기본 분석
    return {
      surface: '감정이 담긴 표현',
      hidden: '이 말에는 이해받고 싶은 마음이 담겨 있어요',
      needs: [NEEDS.understanding, NEEDS.connection],
      feelings: emotions,
      advice: '방어하지 말고 먼저 "많이 힘들었겠다"라고 공감해주세요.',
      replyMessages: [
        { tone: '🤗 공감형', text: '많이 힘들었겠다. 나 여기 있어 💗' },
        { tone: '💬 솔직형', text: '솔직히 말해줘. 나 들을게.' },
        { tone: '🌸 다정형', text: '내 편이야. 언제든 말해 💗' },
      ],
      tip: '상대의 공격적인 말 뒤에는 항상 충족되지 못한 욕구가 있어요.',
      source: 'db',
    };
  }

  // ── Claude API 폴백 ──
  async function callClaudeNVC(text, mode) {
    try {
      const cfg = window.HEARIM_CONFIG;
      if (!cfg) return null;
      const url = cfg.baseUrl + '/translate';
      const prompt = mode === 'transform'
        ? `다음 한국어 문장을 NVC(비폭력대화) 4단계(관찰/감정/욕구/부탁)로 변환해주세요. JSON으로 반환: {observation, feeling, need, request, tip}\n문장: "${text}"`
        : `다음 한국어 문장에 숨겨진 욕구를 NVC 관점으로 분석해주세요. JSON: {surface, hidden, needs(배열), advice, tip}\n문장: "${text}"`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt, relation: 'lover', mode: 'nvc' }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch (e) { return null; }
  }

  // ── 공개 API ──
  return {
    NEEDS,

    async transformNVC(text, relation) {
      const local = transformNVCLocal(text, relation);
      // 로컬 결과가 충분하면 그대로 사용 (DB 히트한 경우)
      if (local.source === 'db') return local;
      // Claude API 폴백
      const ai = await callClaudeNVC(text, 'transform');
      return ai || local;
    },

    async analyzeHiddenNeeds(text) {
      const local = analyzeHiddenNeedsLocal(text);
      return local;
    },

    // 동기 버전 (즉시 사용)
    transformNVCSync: transformNVCLocal,
    analyzeHiddenNeedsSync: analyzeHiddenNeedsLocal,

    FEELING_WORDS,
    matchNVC,
    matchHiddenNeed,
  };
})();
