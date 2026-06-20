/**
 * 사이(Sai) — AI 관계 챗봇
 * 폴백 체인: 서버 API(Groq/OpenAI/Claude) → 로컬 스마트 규칙
 */
(function () {
  const SYSTEM_PROMPT = `당신은 사이(Sai)의 AI 연애 상담사입니다.
연인 사이의 감정, 대화, 갈등, 설렘, 권태 등 연애에만 특화된 친절하고 따뜻한 한국어 챗봇입니다.
규칙:
- 연인 관계 주제에만 답변 (다른 인간관계·직장·가족 등은 "저는 연애 전문이에요 😊 연인 관계 고민을 말씀해주세요"라고 안내)
- 항상 공감 먼저, 조언은 그 다음
- 답변은 간결하게 (3~5문장)
- 판단하지 않고 중립적 시각 유지
- 구체적이고 실천 가능한 연애 조언 제공`;

  let messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  let isLoading = false;

  const $ = id => document.getElementById(id);

  // ── 로컬 스마트 폴백 (서버 불가 시 작동) ──
  function getLocalFallback(userText) {
    const t = (userText || '').toLowerCase();
    if (t.includes('싸움') || t.includes('다툼') || t.includes('싸웠'))
      return '다툼 후엔 잠시 감정이 가라앉을 시간이 필요해요. "나는 ~해서 속상해"처럼 나를 주어로 말해보세요. 상대를 비난하지 않으면 방어벽이 낮아져요 💕';
    if (t.includes('연락') || t.includes('답장') || t.includes('읽씹'))
      return '연락이 없을 땐 불안하죠. "바쁜 거 알면서도 나는 걱정이 돼"처럼 솔직하게 감정을 전달해보세요. 기다리는 마음을 표현하면 상대도 이해해요 💌';
    if (t.includes('불안') || t.includes('걱정') || t.includes('무서'))
      return '관계에서 불안함은 자연스러운 감정이에요. 그 불안이 어디서 오는지, 과거 경험과 연결되진 않는지 살펴보면 좋겠어요. 어떤 상황에서 가장 불안한가요?';
    if (t.includes('이별') || t.includes('헤어') || t.includes('헤어지'))
      return '이별은 정말 힘든 시간이에요. 지금의 감정을 충분히 느끼는 게 중요해요. 억지로 극복하려 하기보다, 오늘의 감정을 일기에 써보는 건 어떨까요?';
    if (t.includes('화가') || t.includes('화남') || t.includes('짜증'))
      return '화가 많이 나셨군요. 분노 아래엔 상처받은 감정이 있어요. 화나기 전 어떤 말/행동이 있었나요? 그걸 알면 더 잘 전달할 수 있어요.';
    if (t.includes('사랑') || t.includes('좋아'))
      return '사랑을 표현하고 싶으신군요 💗 상대가 어떤 방식으로 사랑을 느끼는지 알면 더 효과적이에요. 상대가 뭘 할 때 가장 행복해 보이던가요?';
    if (t.includes('외로') || t.includes('혼자'))
      return '혼자인 느낌은 관계 안에서도 느낄 수 있어요. 상대에게 "요즘 나 외로워"라고 직접 말해봤나요? 솔직한 표현이 연결을 만들어요 🤝';
    if (t.includes('보고싶') || t.includes('그리'))
      return '보고 싶은 마음이 크군요 🥺 그 감정을 그대로 전해보는 건 어떨까요? "네가 보고 싶어"라는 한 마디가 관계를 따뜻하게 만들어요.';
    if (t.includes('설렘') || t.includes('두근') || t.includes('썸'))
      return '설레는 감정 정말 소중하죠 💓 상대방도 비슷한 감정인지 확인하고 싶다면, 가볍게 자주 만나는 기회를 만들어보세요. 일상을 공유할수록 거리가 좁혀져요.';
    if (t.includes('권태') || t.includes('지루') || t.includes('식었'))
      return '오래된 관계에서 권태는 자연스러운 현상이에요. 함께 새로운 경험을 만들어보는 건 어떨까요? 처음 만났을 때 갔던 장소나, 도전해보고 싶었던 것들을 같이 해보세요 🌟';
    if (t.includes('바람') || t.includes('외도') || t.includes('의심'))
      return '의심스러운 상황은 정말 힘들고 불안하죠. 감정이 격해지기 전에, 구체적인 사실만을 바탕으로 차분히 대화를 시도해보세요. "나는 ~가 걱정돼"라는 표현이 도움돼요.';
    return '연인과의 관계에서 느끼는 감정을 더 구체적으로 말해주실 수 있을까요? 어떤 상황인지, 어떤 감정인지 알면 더 잘 도와드릴 수 있어요 💕';
  }

  // ── 메시지 버블 추가 ──
  function appendBubble(role, text) {
    const wrap = $('chatMessages');
    if (!wrap) return;
    const div = document.createElement('div');
    div.className = `chat-bubble chat-bubble-${role}`;
    div.innerHTML = `
      <div class="chat-avatar">${role === 'user' ? '🙋' : '🤖'}</div>
      <div class="chat-text">${escHtml(text)}</div>
    `;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
  }

  // ── 로딩 버블 ──
  function showTyping() {
    const wrap = $('chatMessages');
    if (!wrap) return;
    const div = document.createElement('div');
    div.className = 'chat-bubble chat-bubble-assistant chat-typing';
    div.id = 'chatTyping';
    div.innerHTML = `
      <div class="chat-avatar">🤖</div>
      <div class="chat-text chat-dots"><span></span><span></span><span></span></div>
    `;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
  }
  function hideTyping() {
    $('chatTyping')?.remove();
  }

  // ── HTML 이스케이프 ──
  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  // ── 메시지 전송 (서버 API → 로컬 폴백) ──
  async function sendMessage(userText) {
    if (isLoading || !userText.trim()) return;
    isLoading = true;

    messages.push({ role: 'user', content: userText });
    appendBubble('user', userText);
    showTyping();

    const sendBtn = $('chatSendBtn');
    if (sendBtn) sendBtn.disabled = true;

    const chatUrl = window.HEARIM_CONFIG?.api?.chat;
    const apiBase = window.HEARIM_CONFIG?.apiBase || '';
    let answered = false;

    // 서버 API 시도 (apiBase가 있을 때만 — 없으면 서버 없음)
    if (chatUrl && apiBase) {
      try {
        const res = await fetch(chatUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          hideTyping();
          if (!data.error) {
            const answer = data.content || '';
            if (answer) {
              messages.push({ role: 'assistant', content: answer });
              appendBubble('assistant', answer);
              answered = true;
            }
          }
        }
      } catch (e) {
        // 서버 응답 없음 → 로컬 폴백으로 이어짐
        console.warn('[chatbot] 서버 연결 실패, 로컬 폴백 사용');
      }
    }

    // 로컬 스마트 폴백
    if (!answered) {
      hideTyping();
      const fallback = getLocalFallback(userText);
      messages.push({ role: 'assistant', content: fallback });
      appendBubble('assistant', fallback);
    }

    isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    const input = $('chatInput');
    if (input) { input.value = ''; input.focus(); }
  }

  // ── 대화 초기화 ──
  function resetChat() {
    messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    const wrap = $('chatMessages');
    if (wrap) wrap.innerHTML = '';
    appendBubble('assistant', '안녕하세요! 사이 연애 상담사예요 💕\n남자친구·여자친구와의 고민, 썸·설렘·갈등 무엇이든 편하게 말씀해주세요.');
  }

  // ── 초기화 ──
  function init() {
    const input   = $('chatInput');
    const sendBtn = $('chatSendBtn');
    const resetBtn = $('chatResetBtn');

    resetChat();

    sendBtn?.addEventListener('click', () => {
      sendMessage(input?.value?.trim() || '');
    });

    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value.trim());
      }
    });

    resetBtn?.addEventListener('click', () => {
      resetChat();
    });

    // 예시 질문 칩
    document.querySelectorAll('[data-chat-ex]').forEach(chip => {
      chip.addEventListener('click', () => {
        if (input) input.value = chip.dataset.chatEx;
        sendMessage(chip.dataset.chatEx);
      });
    });
  }

  // ── 외부에서 메시지 전달 (홈 입력창 → 챗봇 연동) ──
  function sendExternal(text) {
    if (!text?.trim()) return;
    const wrap = $('chatMessages');
    if (!wrap || wrap.children.length === 0) resetChat();
    sendMessage(text.trim());
  }

  window.HU = window.HU || {};
  window.HU._initChatbot = init;
  window.HU._sendToChatbot = sendExternal;
})();
