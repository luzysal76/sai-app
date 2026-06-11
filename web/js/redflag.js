/**
 * 헤아림 - RED FLAG 위험 신호 감지 시스템
 * 번역기·카톡 분석기에서 공통 사용
 */
window.HearimRedFlag = (function () {

  const FLAGS = [
    {
      level: 'high',
      pattern: /끝내자|헤어지자|헤어져|다시는 연락|연락하지 마|그만 보자|연락 끊자|그냥 다 지워|못 살겠|죽겠어|사라질게|차단할|삭제할게|이제 그만/,
      label: '🚨 관계 종료 신호',
      labelZh: '关系终止信号',
      color: '#ff3b30',
      bg: '#fff5f5',
      desc: '상대가 관계 단절을 고려할 수 있어요. 지금 당장 판단하지 말고 침착하게 대응하세요.',
      guide: '대화 가이드',
      guideCopy: '지금 즉시 반응하지 마세요. 감정이 진정될 시간을 준 뒤, "우리 직접 만나서 얘기하자"고 제안해보세요.',
      counsel: true,
    },
    {
      level: 'medium',
      pattern: /지쳐|지친다|피곤해|피곤하다|실망했어|실망이야|어이없어|이게 뭐야|어떻게 이래|미칠 것 같|화나|짜증나|화났어|속상해|힘들어 죽겠|너무 힘들어/,
      label: '⚠️ 감정 소진 신호',
      labelZh: '情感耗竭信号',
      color: '#ff9500',
      bg: '#fffbf0',
      desc: '상대가 감정적으로 많이 지쳐있어요. 지금은 공간을 주는 것이 도움이 됩니다.',
      guide: '대화 가이드',
      guideCopy: '잠시 대화를 멈추고 "많이 힘들었겠다, 쉬어. 준비되면 연락해" 라고 한마디 후 기다려주세요.',
      counsel: false,
    },
    {
      level: 'medium',
      pattern: /됐어|알아서 해|신경 쓰지 마|신경꺼|관심 꺼|모르겠어|그냥 둬|내버려 둬|맘대로 해|마음대로|신경 꺼/,
      label: '⚠️ 회피·차단 신호',
      labelZh: '回避·封闭信号',
      color: '#ff9500',
      bg: '#fffbf0',
      desc: '상대가 감정의 문을 닫고 있어요. 억지로 다가가면 역효과가 날 수 있어요.',
      guide: '대화 가이드',
      guideCopy: '"언제든 준비되면 얘기해줘" 하고 공간을 드세요. 무리하게 해결하려 하지 마세요.',
      counsel: false,
    },
    {
      level: 'low',
      pattern: /그럴 수 있어\?|진짜야\?|좀 이상한 거|이거 맞아\?|왜 그래\?|무슨 말이야|뭔 소리야/,
      label: '💬 불만·의문 신호',
      labelZh: '不满·疑问信号',
      color: '#34c759',
      bg: '#f0faf3',
      desc: '가벼운 불만이나 의문을 표현하고 있어요. 수용적으로 반응해보세요.',
      guide: '대화 가이드',
      guideCopy: '방어적으로 반응하지 말고, "무슨 의미야? 더 말해줘" 하고 상대의 말을 먼저 들어주세요.',
      counsel: false,
    },
  ];

  return {
    detect(text) {
      for (const f of FLAGS) {
        if (f.pattern.test(text)) return f;
      }
      return null;
    },
    FLAGS,
  };
})();
