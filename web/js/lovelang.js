/**
 * 사이(Sai) — 사랑의 언어 테스트 엔진
 * Gary Chapman 5 Love Languages 기반 10문항 A/B 선택
 */
window.SaiLoveLang = (function () {

  const LANGS = {
    words:   { name: '긍정의 말',    emoji: '💬', color: '#ec4899', bg: 'rgba(236,72,153,.1)',  desc: '칭찬·격려·"사랑해" 표현이 가장 큰 사랑으로 느껴지는 유형이에요.' },
    service: { name: '봉사',         emoji: '🤝', color: '#f59e0b', bg: 'rgba(245,158,11,.1)',  desc: '도움과 배려, 행동으로 보여주는 사랑을 가장 깊이 받아들이는 유형이에요.' },
    gifts:   { name: '선물',         emoji: '🎁', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)',  desc: '작은 선물과 기억에 담긴 마음이 사랑으로 전해지는 유형이에요.' },
    time:    { name: '함께하는 시간', emoji: '⏰', color: '#10b981', bg: 'rgba(16,185,129,.1)', desc: '온전히 함께하는 집중된 시간이 가장 큰 사랑으로 느껴지는 유형이에요.' },
    touch:   { name: '스킨십',       emoji: '🤗', color: '#ef4444', bg: 'rgba(239,68,68,.1)',   desc: '포옹·손잡기·신체적 접촉이 사랑과 안정을 전달하는 유형이에요.' },
  };

  const DETAILS = {
    words: {
      feel:     '"사랑해", "고마워", "잘했어"라는 말 한마디가 하루를 바꿔줘요.',
      unloved:  '비판, 무시, 무관심한 말투에 크게 상처받아요.',
      howto:    '매일 진심 어린 칭찬과 감사 표현을 꾸준히 해주세요. 문자 한 통도 큰 힘이 돼요.',
    },
    service: {
      feel:     '파트너가 내 할 일을 먼저 나서서 도와줄 때 사랑이 느껴져요.',
      unloved:  '말만 하고 행동이 없거나, 부탁해도 미루는 것에 서운함을 느껴요.',
      howto:    '요청 전에 먼저 알아채고 행동으로 보여주세요. 작은 배려가 큰 사랑이에요.',
    },
    gifts: {
      feel:     '작은 선물이나 깜짝 이벤트에서 "나를 생각해줬구나"라는 감동이 와요.',
      unloved:  '기념일을 잊거나 아무것도 준비하지 않을 때 소중히 여겨지지 않는다고 느껴요.',
      howto:    '가격보다 마음이 담긴 것이 중요해요. 작은 것도 "생각했어"와 함께 건네세요.',
    },
    time: {
      feel:     '폰 없이 온전히 함께하는 시간이 세상 어떤 것보다 소중해요.',
      unloved:  '함께 있어도 딴짓을 하거나 집중하지 않을 때 외로움을 느껴요.',
      howto:    '양보다 질! 짧아도 온전히 집중해주세요. 눈을 마주치며 대화하는 시간이 선물이에요.',
    },
    touch: {
      feel:     '포옹, 손잡기, 가볍게 어깨를 짚는 것만으로 연결된 느낌이 와요.',
      unloved:  '스킨십이 줄어들면 심리적으로 멀어지는 느낌이 들어요.',
      howto:    '안아주기, 손잡기처럼 일상 속 가벼운 스킨십을 자연스럽게 늘려주세요.',
    },
  };

  // 10쌍 A/B 문항 (각 언어 4회 등장, 균형 유지)
  const QUESTIONS = [
    { a: { text: '파트너가 "사랑해", "잘했어" 같은 말을 자주 해줄 때 가장 행복하다',       lang: 'words'   },
      b: { text: '파트너와 온전히 집중하며 함께 시간을 보낼 때 가장 행복하다',              lang: 'time'    } },
    { a: { text: '파트너가 내가 힘들 때 먼저 도와주고 처리해줄 때 사랑이 느껴진다',         lang: 'service' },
      b: { text: '파트너가 작은 선물이나 깜짝 이벤트를 해줄 때 사랑이 느껴진다',            lang: 'gifts'   } },
    { a: { text: '파트너에게 안겨있거나 손을 잡을 때 가장 연결된 느낌이 든다',              lang: 'touch'   },
      b: { text: '파트너가 나를 인정하고 칭찬해줄 때 자존감이 올라간다',                    lang: 'words'   } },
    { a: { text: '파트너와 폰 없이 온전히 함께하는 시간이 부족하면 서운하다',               lang: 'time'    },
      b: { text: '파트너가 내 부탁이나 집안일을 먼저 나서서 해주면 감동받는다',             lang: 'service' } },
    { a: { text: '파트너가 기념일, 사소한 날에 선물을 준비해줄 때 마음이 따뜻해진다',       lang: 'gifts'   },
      b: { text: '힘들 때 파트너가 안아주거나 손을 잡아줄 때 위로가 된다',                  lang: 'touch'   } },
    { a: { text: '파트너가 말로 자주 표현해주지 않으면 사랑받는 느낌이 줄어든다',           lang: 'words'   },
      b: { text: '파트너가 내 일을 도와주거나 대신 처리해줄 때 사랑을 느낀다',              lang: 'service' } },
    { a: { text: '파트너와 함께하는 시간의 질이 관계에서 가장 중요하다',                    lang: 'time'    },
      b: { text: '가볍게 어깨를 짚거나 안아주는 스킨십이 관계를 더 친밀하게 만든다',        lang: 'touch'   } },
    { a: { text: '파트너가 "고마워", "덕분이야" 같은 감사 표현을 해줄 때 보람을 느낀다',   lang: 'words'   },
      b: { text: '파트너가 나를 위해 직접 뭔가를 사다주거나 만들어줄 때 특별함을 느낀다',  lang: 'gifts'   } },
    { a: { text: '파트너가 내 할 일을 미리 챙겨주는 것이 가장 든든한 사랑이다',            lang: 'service' },
      b: { text: '파트너와의 스킨십이 줄면 뭔가 멀어진 것 같은 느낌이 든다',               lang: 'touch'   } },
    { a: { text: '파트너와 함께 보내는 시간이 어떤 선물보다 더 의미 있다',                  lang: 'time'    },
      b: { text: '파트너가 깜짝 선물을 줄 때 "나를 생각해줬구나"라는 감동이 온다',          lang: 'gifts'   } },
  ];

  function calcResult(choices) {
    const counts = { words: 0, service: 0, gifts: 0, time: 0, touch: 0 };
    choices.forEach((c, i) => {
      if (c === 'a') counts[QUESTIONS[i].a.lang]++;
      else if (c === 'b') counts[QUESTIONS[i].b.lang]++;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { counts, primary: sorted[0][0], secondary: sorted[1][0] };
  }

  return { LANGS, DETAILS, QUESTIONS, calcResult };
})();
