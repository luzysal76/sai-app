/**
 * 헤아림 - 대화 시나리오 컨트롤러
 * 상황별(약속/갈등/일상/특수) 예시 문장 + 대화 가이드
 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const SCENARIOS = [
    {
      id: 'date',
      emoji: '📅',
      title: '약속 잡기',
      titleZh: '约会邀请',
      color: '#ff6b9d',
      bg: 'linear-gradient(135deg,#fff5f9,#ffe0ed)',
      desc: '만남을 제안하거나 약속을 잡을 때 오가는 표현들',
      situations: [
        {
          phrase: '다음에 보자',
          meaning: '구체적 약속이 없는 거절일 수 있어요. 하지만 완전한 거절은 아닌 경우도 많아요.',
          reply: '다음이 언제야? 이번 주 토요일 어때? 😊',
        },
        {
          phrase: '요즘 바빠서 ㅠ',
          meaning: '관심은 있지만 주저하고 있을 수 있어요. 부담 없는 제안으로 유도해보세요.',
          reply: '그럼 짧게라도! 30분만 봐. 커피 한 잔만 :)',
        },
        {
          phrase: '생각해볼게',
          meaning: '부담을 느끼거나 아직 결정을 못 한 상태. 재촉하면 거절로 이어질 수 있어요.',
          reply: '천천히 생각해~ 정해지면 알려줘 :)',
        },
        {
          phrase: '나중에 연락할게',
          meaning: '능동적 의지가 있는 상태. 기다리는 것이 올바른 대응이에요.',
          reply: '그래! 기다릴게. 좋은 날 잡아줘 😊',
        },
      ],
    },
    {
      id: 'conflict',
      emoji: '💬',
      title: '다툼 후 화해',
      titleZh: '争吵后和解',
      color: '#6b4eaa',
      bg: 'linear-gradient(135deg,#f5f0ff,#e8deff)',
      desc: '갈등이 생긴 후 감정을 풀고 화해하는 대화 흐름',
      situations: [
        {
          phrase: '됐어, 그냥 자',
          meaning: '화는 났지만 해결을 원할 수 있어요. 그냥 자면 상황이 악화될 수 있어요.',
          reply: '미안해. 자기 전에 한 마디만 — 나 네가 소중해 🙏',
        },
        {
          phrase: '내가 잘못했지 뭐',
          meaning: '사과하는 척하지만 억울함이 섞인 경우. 상대도 인정받고 싶어해요.',
          reply: '잘잘못보다 우리 사이가 더 중요해. 같이 풀자',
        },
        {
          phrase: '알아서 해',
          meaning: '상대가 포기하려는 신호. 먼저 적극적으로 다가가야 해요.',
          reply: '미안해. 내가 먼저 다가갈게. 지금 통화 돼? 🙏',
        },
        {
          phrase: '이제 어떡하면 좋아',
          meaning: '방향을 잃고 도움을 요청하는 상태. 구체적인 제안이 효과적이에요.',
          reply: '내가 생각해볼게. 오늘 잠깐 만나서 얘기할 수 있어?',
        },
      ],
    },
    {
      id: 'daily',
      emoji: '☀️',
      title: '일상 대화',
      titleZh: '日常聊天',
      color: '#41c46e',
      bg: 'linear-gradient(135deg,#f0faf3,#d8f5e4)',
      desc: '매일 주고받는 가벼운 안부와 일상 대화의 속뜻',
      situations: [
        {
          phrase: '뭐 해?',
          meaning: '단순한 안부가 아닌, 그냥 보고 싶은 마음의 표현인 경우가 많아요.',
          reply: '그냥 너 생각하고 있었어 ㅋㅋ 왜? 보고 싶어?',
        },
        {
          phrase: 'ㅇㅇ / ㄱㄱ / ㅋ',
          meaning: '무관심이 아닌 단순한 말투일 수 있어요. 확인이 필요해요.',
          reply: '오늘 기분 어때? 뭔가 짧은 느낌 ㅎㅎ 힘든 거야?',
        },
        {
          phrase: '잘 자~',
          meaning: '하루 마무리 + 연결감 유지 시도. 따뜻하게 받아주세요.',
          reply: '꿈에서 봐 😊 나도 잘 자! 내일 또 얘기해',
        },
        {
          phrase: '밥은 먹었어?',
          meaning: '상대를 챙기고 싶은 마음. 관심과 애정의 표현이에요.',
          reply: '응! 너는? 혹시 안 먹었으면 같이 먹을래? 😋',
        },
      ],
    },
    {
      id: 'special',
      emoji: '🌙',
      title: '특수 상황',
      titleZh: '特殊情况',
      color: '#4a9eff',
      bg: 'linear-gradient(135deg,#f0f6ff,#d8eaff)',
      desc: '관계의 전환점이 되는 중요한 순간의 대화',
      situations: [
        {
          phrase: '우리 그냥 친구로 지내자',
          meaning: '관계 전환 제안. 완전한 거절은 아닐 수 있어요. 이유를 알아야 해요.',
          reply: '갑자기? 내가 뭔가 불편하게 했어? 얘기해줄 수 있어?',
        },
        {
          phrase: '요즘 많이 힘들어',
          meaning: '위로와 공감을 원하는 신호. 조언보다 들어주는 것이 먼저예요.',
          reply: '많이 힘들었겠다ㅠ 오늘 시간 돼? 같이 있어줄게',
        },
        {
          phrase: '나 요즘 좀 이상한 것 같아',
          meaning: '자기개방 — 진지한 연결을 원하는 표현. 특별한 신뢰의 표시예요.',
          reply: '이상한 거 아니야. 나한테 말해줘서 고마워. 뭔데?',
        },
        {
          phrase: '나 너한테 솔직하게 말해도 돼?',
          meaning: '중요한 이야기를 꺼내려는 준비 단계. 편안한 분위기를 만들어주세요.',
          reply: '물론이지. 뭐든 말해줘. 잘 들을게 :)',
        },
      ],
    },
  ];

  let activeScenario = null;

  // ── 카드 목록 렌더 ──
  function renderGrid() {
    const grid = $('#scenarioGrid');
    if (!grid) return;
    grid.innerHTML = SCENARIOS.map(s => `
      <button class="sc-card" data-id="${s.id}" style="--sc-color:${s.color};background:${s.bg}">
        <span class="sc-emoji">${s.emoji}</span>
        <span class="sc-title">${esc(s.title)}</span>
        <span class="sc-sub">${esc(s.titleZh)}</span>
      </button>
    `).join('');

    $$('.sc-card', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        const sc = SCENARIOS.find(s => s.id === btn.dataset.id);
        if (sc) showDetail(sc);
      });
    });
  }

  // ── 상세 뷰 ──
  function showDetail(sc) {
    const detail = $('#scenarioDetail');
    const grid = $('#scenarioGrid');
    if (!detail || !grid) return;

    grid.classList.add('hidden');
    detail.classList.remove('hidden');

    detail.innerHTML = `
      <button class="btn-ghost" id="scBackBtn" style="margin-bottom:14px">← 목록으로 · 返回列表</button>
      <div class="sc-detail-head" style="border-color:${sc.color};background:${sc.bg}">
        <span class="sc-d-emoji">${sc.emoji}</span>
        <div>
          <div class="sc-d-title" style="color:${sc.color}">${esc(sc.title)}</div>
          <div class="sc-d-sub">${esc(sc.titleZh)}</div>
          <div class="sc-d-desc">${esc(sc.desc)}</div>
        </div>
      </div>
      ${sc.situations.map((sit, idx) => `
        <div class="card sc-situation">
          <div class="sc-phrase">"${esc(sit.phrase)}"</div>
          <div class="sc-meaning"><span class="sc-meaning-icon">💡</span>${esc(sit.meaning)}</div>
          <div class="sc-reply-label">추천 답장 · 推荐回复</div>
          <div class="sc-reply-text">${esc(sit.reply)}</div>
          <button class="sc-copy-btn" data-text="${esc(sit.reply)}">
            복사 · 复制
          </button>
        </div>
      `).join('')}
    `;

    $('#scBackBtn').addEventListener('click', () => {
      detail.classList.add('hidden');
      grid.classList.remove('hidden');
    });

    $$('.sc-copy-btn', detail).forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.closest('.sc-situation').querySelector('.sc-reply-text').textContent;
        const cb = () => { btn.textContent = '복사됨 ✓'; setTimeout(() => { btn.textContent = '복사 · 复制'; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(cb).catch(() => fbCopy(text, cb));
        else fbCopy(text, cb);
      });
    });
  }

  function fbCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta); cb && cb();
  }

  function init() {
    renderGrid();
    // 페이지 전환 시 목록으로 복귀
    document.addEventListener('hearim:page', e => {
      if (e.detail !== 'scenario') return;
      const detail = $('#scenarioDetail');
      const grid = $('#scenarioGrid');
      if (detail) detail.classList.add('hidden');
      if (grid) grid.classList.remove('hidden');
    });
  }

  window.HU = window.HU || {};
  window.HU._initScenario = init;
})();
