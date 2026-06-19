/**
 * 사이(Sai) — AI 관계 챗봇 (chatbot.py 포팅)
 * chatbot.py 구조: 멀티턴 대화 + 시스템 프롬프트 + gpt-4o-mini
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

  // ── API 전송 (chatbot.py의 ask_model 포팅) ──
  async function sendMessage(userText) {
    if (isLoading || !userText.trim()) return;
    isLoading = true;

    messages.push({ role: 'user', content: userText });
    appendBubble('user', userText);
    showTyping();

    const sendBtn = $('chatSendBtn');
    if (sendBtn) sendBtn.disabled = true;

    try {
      const res = await fetch(window.HEARIM_CONFIG?.api?.chat || 'http://localhost:4321/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      hideTyping();

      if (data.error) {
        appendBubble('assistant', '⚠️ ' + data.error);
      } else {
        const answer = data.content || '(응답이 없습니다.)';
        messages.push({ role: 'assistant', content: answer });
        appendBubble('assistant', answer);
      }
    } catch (err) {
      hideTyping();
      appendBubble('assistant', '⚠️ 네트워크 오류가 발생했어요. 다시 시도해주세요.');
    }

    isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    const input = $('chatInput');
    if (input) { input.value = ''; input.focus(); }
  }

  // ── 대화 초기화 (chatbot.py의 reset 포팅) ──
  function resetChat() {
    messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    const wrap = $('chatMessages');
    if (wrap) wrap.innerHTML = '';
    appendBubble('assistant', '안녕하세요! 사이 연애 상담사예요 💕\n남자친구·여자친구와의 고민, 썸·설렘·갈등 무엇이든 편하게 말씀해주세요.');
  }

  // ── 초기화 ──
  function init() {
    const input  = $('chatInput');
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
