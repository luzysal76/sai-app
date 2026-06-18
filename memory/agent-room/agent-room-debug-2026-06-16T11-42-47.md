# 디버깅팀 Report

**Topic:** 사이(Sai) 웹앱 챗봇 오류 해결. 현재 상황: OpenAI gpt-4o-mini 사용 중인데 API 크레딧 소진으로 429 에러 발생. ANTHROPIC_API_KEY는 미설정(placeholder). 서버: web/server.js (Node.js, 포트 4321). 챗봇 엔드포인트: POST /api/chat. 목표: API 키 없이도 작동하는 해결책 OR Anthropic Claude API로 챗봇 교체하는 최선의 방법 분석. 고려사항: 1) 무료로 사용 가능한 대안 AI API 2) Ollama 로컬 모델 사용 가능성 3) 스마트 fallback 응답 시스템 구현 4) Anthropic API 키 설정 시 Claude로 전환하는 방법. 서버 코드 핵심 부분: POST /api/chat에서 OpenAI SDK로 gpt-4o-mini 호출, Rate Limit 일 5회/IP. 챗봇은 연인 관계 전용 AI 상담사 역할.
**Total Rounds:** 4
**Date:** 2026-06-16

---

## Round 1 — Stage 1: 증상 분석가 ✅

> **Passed → Stage 2**

### 🔍 증상 분석 보고서

#### 1. 에러 증상 정리

| 항목 | 내용 |
|------|------|
| **에러 코드** | OpenAI API → HTTP 429 (`insufficient_quota`) |
| **사용자 체감** | 챗봇 메시지 전송 시 `"AI 오류: ..."` 응답 반환 |
| **서버 로그** | `[chat] 오류: 429 You exceeded your current quota...` |
| **발생 패턴** | **항상 발생** — 크레딧 소진 후 모든 요청에서 동일하게 발생 |
| **영향 범위** | `POST /api/chat` 전체. `/api/capture`(Claude)는 무관 |

#### 2. 코드상 확인된 상태 (`server.js` + `functions/.env`)

```
OPENAI_API_KEY = 실제 키 값 (크레딧 소진)
ANTHROPIC_API_KEY = "sk-ant-여기에-실제-키-입력" (플레이스홀더)
```

- `loadOpenAIKey()`: 키 존재 → 클라이언트 생성 성공 → API 호출 시 **429** 발생
- `loadApiKey()`: `'여기에'` + `'실제'` 문자열 포함 → **null 반환** (정상 감지)
- 현재 chat 엔드포인트에는 **OpenAI 실패 시 fallback 없음**

#### 3. 정상 vs 비정상 비교

| 상태 | 동작 |
|------|------|
| 정상 (크레딧 있을 때) | GPT-4o-mini 응답 → `{ content: "..." }` 반환 |
| **현재 (비정상)** | 429 에러 → catch → `500` + `{ error: "AI 오류: ..." }` 반환 |
| ANTHROPIC_API_KEY 설정 시 | capture는 작동, chat은 여전히 OpenAI 사용 (별도 로직 없음) |

#### 4. 근본 원인 가설 (3~5개)

**가설 1 — OpenAI 크레딧 소진 [확정적 원인]**
> 현재 `OPENAI_API_KEY`는 실제 키지만 계정 잔액 0. `loadOpenAIKey()`는 통과하나 API 호출 자체가 실패.

**가설 2 — Anthropic 키 미설정으로 대체 불가 [구조적 문제]**
> `ANTHROPIC_API_KEY`가 플레이스홀더 → `loadApiKey()` null → chat 엔드포인트에서 Claude로 전환할 코드 자체가 없음. 키를 설정해도 현재 로직으론 chat에 Claude가 투입되지 않음.

**가설 3 — chat 엔드포인트에 fallback 로직 부재 [설계 갭]**
> `/api/capture`는 API 키 없으면 503 반환하는 방어 코드 있음. 반면 `/api/chat`은 OpenAI만 호출하고 실패 시 fallback 없이 500 반환.

**가설 4 — 로컬 Rate Limit과 API Rate Limit 혼동 가능성 [오해 리스크]**
> 서버의 `checkLimit()`는 일 5회/IP 제한 (429 반환). OpenAI의 429는 별개 원인(크레딧 부족). 사용자 입장에서 두 429가 같은 에러처럼 보일 수 있음.

**가설 5 — Ollama 로컬 모델 또는 무료 API 대안 미검토 [해결책 갭]**
> 현재 서버는 OpenAI/Anthropic SDK만 로드. Ollama, HuggingFace 등 무료 대안 연결 코드 없음.

---

#### 5. 해결 방향 우선순위 (분석 기반)

```
1순위: Anthropic API 키 설정 + chat 엔드포인트를 Claude로 교체
       → Anthropic SDK 이미 로드됨 (server.js 38~44줄), 연결만 하면 됨

2순위: 스마트 fallback 응답 (키 없을 때 DB 기반 규칙 응답)
       → 완전 무료, 챗봇 연인 특화 시나리오 20~30개로 커버 가능

3순위: Ollama 로컬 모델
       → 무료이나 사용자 PC에 설치 필요, 서비스 배포엔 부적합
```

---

---

## Round 2 — Stage 2: 원인 추적자 ✅

> **Passed → Stage 3**

### 🔬 코드 실행 흐름 추적

#### 가설 1 — OpenAI 크레딧 소진 🔴 **가능성 높음 (확정)**

```
POST /api/chat
 │
 ├─ [L207] checkLimit(req, 'chat')
 │    └─ 5회 미만 → true 반환 ✅ 통과
 │
 ├─ [L211] loadOpenAIKey()
 │    └─ OPENAI_API_KEY 존재, 'sk-proj-...' 실제 키
 │       key.includes('여기에') → false ✅ 키 정상 반환
 │
 ├─ [L212] !apiKey || !OpenAI → false ✅ 503 체크 통과
 │
 ├─ [L217] readBody(req) → messages 파싱 ✅
 │
 ├─ [L229] new OpenAIClient({ apiKey }) → 클라이언트 생성 성공 ✅
 │
 └─ [L231] client.chat.completions.create({ model: 'gpt-4o-mini', ... })
           ↓
       🔴 HTTP 429 "insufficient_quota" 발생  ← 에러 발화점
           ↓
      [L239] catch(err)
      [L240] console.error('[chat] 오류:', err.message)
      [L241] res.writeHead(500)
      [L242] { error: 'AI 오류: 429 You exceeded your current quota...' }
```

> **특정**: 231번째 줄 `client.chat.completions.create()` — API 호출 시점에서 크레딧 소진으로 실패

---

#### 가설 2 — Anthropic 키 있어도 chat에 연결 로직 없음 🔴 **가능성 높음 (구조적 확정)**

```
[L38~44]  Anthropic SDK 로드 ✅
[L27~30]  loadApiKey() 함수 존재 ✅
[L156~160] /api/capture에서 loadApiKey() 사용 ✅

/api/chat 엔드포인트 (L206~245) 전체 스캔:
  ├─ loadApiKey() 호출? → ❌ 없음
  ├─ Anthropic 클라이언트 생성? → ❌ 없음
  └─ Claude 모델 호출? → ❌ 없음

결론: ANTHROPIC_API_KEY를 설정해도 /api/chat에 영향 없음
     → Anthropic SDK는 이미 로드되어 있으나 chat에는 "연결선이 없음"
```

---

#### 가설 3 — chat 엔드포인트 fallback 로직 부재 🔴 **가능성 높음 (설계 갭)**

```
/api/capture (L150~203) — 방어 코드 있음:
  ├─ Rate Limit → 429 명확 처리
  ├─ apiKey 없음 → 503 명확 처리
  └─ SDK 없음 → 503 명확 처리

/api/chat (L206~245) — 비교:
  ├─ Rate Limit → 429 명확 처리 ✅
  ├─ apiKey 없음 → 503 처리 ✅
  └─ API 호출 실패(429/500/네트워크 등):
       catch → 무조건 500 + 원시 에러 메시지 ❌ fallback 없음
       - Anthropic Claude로 전환? ❌
       - 스마트 규칙 응답? ❌
       - Ollama 로컬? ❌
```

---

#### 가설 4 — 두 종류의 429 혼동 🟡 **가능성 있음 (참고)**

```
서버 Rate Limit 429 (L208~209):
  res.writeHead(429)
  { error: '오늘 무료 AI 상담(5회)을 모두 사용했어요...' }

OpenAI API 429 (L239~242):
  res.writeHead(500)  ← HTTP 상태 코드 다름!
  { error: 'AI 오류: ...' }  ← 접두사 다름!
```

> 코드상으로는 구분됨. 단, 프론트엔드에서 HTTP 상태 코드를 무시하고 error 메시지만 보면 혼동 가능. 오류 원인과는 직접 관련 없음.

---

#### 가설 5 — 무료 대안 미검토 ⚪ **가능성 낮음 (해결책 옵션, 오류 원인 아님)**

```
server.js 전체 검색: ollama / groq / huggingface / together → 없음
→ 현재 오류의 "원인"이 아닌 "해결책" 분류
→ 3단계에서 해결 옵션으로 검토 권장
```

---

### 📊 가설 분류 요약

| 가설 | 판정 | 코드 발화 지점 |
|------|------|---------------|
| H1. OpenAI 크레딧 소진 | 🔴 가능성 높음 | L231 `chat.completions.create()` |
| H2. Anthropic 대체 로직 없음 | 🔴 가능성 높음 | L206~245 (분기 자체 없음) |
| H3. fallback 부재 | 🔴 가능성 높음 | L239~242 catch 블록 단순화 |
| H4. 두 429 혼동 | 🟡 가능성 있음 | 프론트 처리 방식에 따라 혼동 가능 |
| H5. 대안 미검토 | ⚪ 가능성 낮음 | 원인 아님 — 해결책 옵션 |

---

### ➡️ 3단계 전달 핵심 후보 (🔴만)

1. **H1 + H2 연쇄**: OpenAI 크레딧 소진 → Anthropic으로 전환하려 해도 연결 코드가 없음
2. **H3**: catch에 fallback 없어 항상 500 에러 노출

**권장 수정 방향** (3단계 판단용):
- `/api/chat` → `loadOpenAIKey()` 실패 시 **Claude(Anthropic) 시도** → 실패 시 **스마트 규칙 응답** 3단계 폴백 체인으로 수정
- Anthropic SDK는 이미 로드되어 있으므로 **연결선만 추가**하면 됨 (최소 침습 수정)

---

---

## Round 3 — Stage 3: 가설 검증자 ✅

> **Passed → Stage 4**

### 🔎 가설 반증 시나리오 검토

---

#### H1 — OpenAI 크레딧 소진 → **확정 ✅**

**반증 시도**: "OPENAI_API_KEY가 잘못된 키라서 401이 나는 것 아닐까?"
- 반례 성립 여부 검토:
  - 실제 에러 메시지: `"429 You exceeded your current quota"` — 401(인증 실패)이 아님
  - `loadOpenAIKey()`는 플레이스홀더 검사(`'여기에'`, `'실제'` 포함 여부)를 통과함 → 키 형식은 정상
  - 429 `insufficient_quota`는 잔액 부족 고유 에러 코드
- **반례 불성립 → H1 확정 ✅**
- 발화 지점: `server.js` L231 `client.chat.completions.create()`

---

#### H2 — Anthropic 키 설정해도 chat에 연결 로직 없음 → **확정 ✅**

**반증 시도**: "혹시 server.js 어딘가에 조건부로 Claude를 호출하는 코드가 있지 않을까?"
- 반례 성립 여부 검토:
  - 2단계 추적에서 `/api/chat` (L206~245) 전체 스캔 결과: `loadApiKey()`, Anthropic 클라이언트, Claude 모델 호출 — 세 가지 모두 **없음**
  - `Anthropic` SDK는 L38~44에서 로드되나 chat 엔드포인트에는 **연결선 자체가 없음**
  - ANTHROPIC_API_KEY를 아무리 설정해도 `/api/chat` 동작에 영향 없음
- **반례 불성립 → H2 확정 ✅**
- 추가 근거: H1과 H2는 **연쇄 구조** — 크레딧 소진으로 OpenAI 실패 시 Claude로 전환할 코드가 없어 사용자는 항상 에러를 받음

---

#### H3 — chat 엔드포인트 fallback 로직 부재 → **확정 ✅**

**반증 시도**: "catch 블록에서 에러 종류를 분기하여 다른 처리를 하는 것 아닐까?"
- 반례 성립 여부 검토:
  - `catch(err)` → `console.error` → `res.writeHead(500)` → `{ error: 'AI 오류: ' + err.message }` — **단순 5줄 구조, 분기 없음**
  - `/api/capture`와 비교: capture는 apiKey 없음(503), rate limit(429), SDK 없음(503) 등 다단계 방어 존재
  - `/api/chat`은 OpenAI 실패 시 **무조건 500 노출**, 2차 시도 없음
- **반례 불성립 → H3 확정 ✅**

---

#### H4 — 두 종류의 429 혼동 → **보류 ⚠️**

**반증 시도**: "코드 레벨에서 이미 구분되어 있으니 혼동 없는 것 아닐까?"
- 반례 성립 여부 검토:
  - 서버 Rate Limit → HTTP 429, 메시지: `"오늘 무료 AI 상담(5회)을 모두 사용했어요..."`
  - OpenAI API 429 → HTTP **500**, 메시지: `"AI 오류: 429 ..."`
  - **서버 코드상으로는 구분됨** — 반례 부분 성립
  - 단, 프론트엔드에서 HTTP 상태 코드를 무시하고 메시지만 파싱하면 혼동 가능
- **현재 오류의 직접 원인 아님 — 보류 ⚠️** (UX 개선 과제로 남김)

---

#### H5 — 무료 대안 미검토 → **제외 ❌ (원인 아님)**

- 이것은 오류의 "원인"이 아닌 "해결 옵션"
- Ollama는 배포 환경에 부적합, HuggingFace 무료 tier는 안정성 낮음
- **원인 분류에서 제외 ❌** → 4단계 해결책 설계 시 참고 후보로만 전달

---

### 📊 최종 검증 결과

| 가설 | 판정 | 근거 |
|------|------|------|
| H1. OpenAI 크레딧 소진 | **확정 ✅** | 429 `insufficient_quota`, L231 발화 |
| H2. Anthropic 연결 로직 부재 | **확정 ✅** | L206~245 전체에 Claude 호출 없음 |
| H3. fallback 부재 | **확정 ✅** | catch 단순 500, 2차 시도 없음 |
| H4. 두 429 혼동 | **보류 ⚠️** | 코드상 구분되나 프론트 처리 미확인 |
| H5. 무료 대안 미검토 | **제외 ❌** | 원인 아님, 해결책 옵션 |

---

### ➡️ 4단계 전달: 확정된 원인 패키지

```
[근본 원인] H1 + H2 연쇄
  OpenAI 크레딧 소진(L231)
  → catch로 낙하 → fallback 없음(H3)
  → Claude 전환 코드 없음(H2)
  → 사용자는 항상 500 에러

[수정 범위]
  server.js의 /api/chat 엔드포인트 1곳만 수정
  - OpenAI 실패 시 → Anthropic Claude 시도 (SDK 이미 로드됨)
  - Anthropic도 없으면 → 스마트 규칙 응답 (연인 관계 특화 15~20개 시나리오)
  - 총 3단계 폴백 체인 구성
```

---

---

## Round 4 — Stage 4: 수정 방안 설계자 🏆

### 📐 최종 디버그 보고서 — 수정 설계

---

### 1. 원인 요약

```
[발화 지점] server.js L231
  client.chat.completions.create()  ← OpenAI 429 insufficient_quota

[연쇄 구조]
  H1: OpenAI 크레딧 소진 (L231에서 폭발)
  H2: Anthropic 연결 코드 없음 (L206~245 전체, 연결선 자체 부재)
  H3: catch 블록 단순 500 반환 (L239~242, fallback 없음)
    → 세 가지가 겹쳐 사용자는 항상 에러 수신
```

---

### 2. 수정 코드 — `web/server.js`

**🔧 추가할 함수** (L116 `CAPTURE_PROMPT` 위, 서버 상단에 삽입):

```javascript
// ── 스마트 규칙 응답 (API 전부 실패 시 폴백) ─────────────────────────
function getSmartFallback(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const text = lastUser.toLowerCase();

  if (text.includes('싸움') || text.includes('다툼') || text.includes('싸웠'))
    return '다툼 후엔 잠시 감정이 가라앉을 시간이 필요해요. "나는 ~해서 속상해"처럼 나를 주어로 말해보세요. 상대를 비난하지 않으면 방어벽이 낮아져요 💕';
  if (text.includes('연락') || text.includes('답장') || text.includes('읽씹'))
    return '연락이 없을 땐 불안하죠. "바쁜 거 알면서도 나는 걱정이 돼"처럼 솔직하게 감정을 전달해보세요. 기다리는 마음을 표현하면 상대도 이해해요 💌';
  if (text.includes('불안') || text.includes('걱정') || text.includes('무서'))
    return '관계에서 불안함은 자연스러운 감정이에요. 그 불안이 어디서 오는지, 과거 경험과 연결되진 않는지 살펴보면 좋겠어요. 어떤 상황에서 가장 불안한가요?';
  if (text.includes('이별') || text.includes('헤어') || text.includes('헤어지'))
    return '이별은 정말 힘든 시간이에요. 지금의 감정을 충분히 느끼는 게 중요해요. 억지로 극복하려 하기보다, 오늘의 감정을 일기에 써보는 건 어떨까요?';
  if (text.includes('화가') || text.includes('화남') || text.includes('짜증'))
    return '화가 많이 나셨군요. 분노 아래엔 상처받은 감정이 있어요. 화나기 전 어떤 말/행동이 있었나요? 그걸 알면 더 잘 전달할 수 있어요.';
  if (text.includes('사랑') || text.includes('좋아'))
    return '사랑을 표현하고 싶으신군요 💗 상대가 어떤 방식으로 사랑을 느끼는지 알면 더 효과적이에요. 상대가 뭘 할 때 가장 행복해 보이던가요?';
  if (text.includes('외로') || text.includes('혼자'))
    return '혼자인 느낌은 관계 안에서도 느낄 수 있어요. 상대에게 "요즘 나 외로워"라고 직접 말해봤나요? 솔직한 표현이 연결을 만들어요 🤝';

  return '연인과의 관계에서 느끼는 감정을 더 구체적으로 말해주실 수 있을까요? 어떤 상황인지, 어떤 감정인지 알면 더 잘 도와드릴 수 있어요 💕';
}
```

**🔧 교체할 블록** (L205~245 전체 교체):

```javascript
  // ── POST /api/chat — 3단계 폴백 체인 ────────────────────────────────
  //   1단계: OpenAI gpt-4o-mini
  //   2단계: Anthropic claude-3-5-haiku (ANTHROPIC_API_KEY 설정 시)
  //   3단계: 스마트 규칙 응답 (항상 동작)
  if (req.method === 'POST' && url === '/api/chat') {
    if (!checkLimit(req, 'chat')) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '오늘 무료 AI 상담(5회)을 모두 사용했어요. 내일 다시 대화해요 💕' }));
    }

    let body;
    try { body = await readBody(req); }
    catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '잘못된 요청 형식입니다.' }));
    }

    const { messages } = body;
    if (!Array.isArray(messages) || !messages.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'messages 배열이 필요합니다.' }));
    }

    // ── 1단계: OpenAI ──────────────────────────────────────────────
    const openaiKey = loadOpenAIKey();
    if (openaiKey && OpenAI) {
      try {
        const OpenAIClient = OpenAI.default || OpenAI;
        const client = new OpenAIClient({ apiKey: openaiKey });
        const response = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages,
          temperature: 0.7,
        });
        const content = response.choices[0].message.content || '';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ content: content.trim(), source: 'openai' }));
      } catch (err) {
        console.warn('[chat] OpenAI 실패 →', err.message.slice(0, 80));
      }
    }

    // ── 2단계: Anthropic Claude ────────────────────────────────────
    const anthropicKey = loadApiKey();
    if (anthropicKey && Anthropic) {
      try {
        const AnthropicClient = Anthropic.default || Anthropic;
        const client = new AnthropicClient({ apiKey: anthropicKey });
        // Anthropic은 system 메시지를 별도 파라미터로 분리 필요
        const systemMsg = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');
        const response = await client.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1024,
          ...(systemMsg && { system: systemMsg.content }),
          messages: chatMessages,
          temperature: 0.7,
        });
        const content = response.content[0]?.text || '';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ content: content.trim(), source: 'claude' }));
      } catch (err) {
        console.warn('[chat] Anthropic 실패 →', err.message.slice(0, 80));
      }
    }

    // ── 3단계: 스마트 규칙 응답 (항상 동작) ─────────────────────────
    console.log('[chat] 스마트 폴백 응답');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ content: getSmartFallback(messages), source: 'fallback' }));
  }
```

---

### 3. 사이드이펙트 분석

| 항목 | 영향 | 판단 |
|------|------|------|
| **Rate Limit 차감** | OpenAI 실패해도 횟수 차감됨 | ✅ 의도적 (AI 시도 기준) |
| **503 guard 제거** | OpenAI 키 없어도 서비스 가능 | ✅ 긍정적 변화 |
| **messages 포맷 변환** | system 분리 로직 추가 (`chatbot.js` 변경 불필요) | ✅ 서버에서 처리 |
| **source 필드 추가** | 응답에 `source: 'openai' / 'claude' / 'fallback'` 추가 | ⚠️ 프론트가 무시하면 무해, 활용 가능 |
| **Anthropic Haiku 비용** | 약 $0.0008/천토큰 (GPT-4o-mini보다 저렴) | ✅ 비용 절감 |
| **폴백 응답 품질** | 규칙 기반 → GPT/Claude보다 단순하지만 사용 불가보다 낫다 | ⚠️ 허용 범위 |
| **capture 엔드포인트** | 변경 없음 (독립 로직) | ✅ 영향 없음 |

---

### 4. 재발 방지책

#### 🔑 즉시 조치: ANTHROPIC_API_KEY 설정
```bash
# functions/.env 수정
ANTHROPIC_API_KEY=sk-ant-api03-실제키입력
```
→ 설정 즉시 2단계(Claude)가 활성화되어 OpenAI 없이도 정상 동작

#### 🧪 테스트 케이스
```bash
# 1. 기본 동작 확인
curl -X POST http://localhost:4321/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"system","content":"연인 상담사"},{"role":"user","content":"남자친구가 연락을 안 해요"}]}'
# 기대: {"content":"...","source":"openai|claude|fallback"}

# 2. 스마트 폴백 직접 확인 (OPENAI_API_KEY 임시 제거 후)
# source가 "fallback"이고 content가 의미 있는 한국어인지 확인

# 3. Rate Limit 확인
# 동일 IP로 6회 전송 → 6번째에 429 반환 확인
```

#### 🛡️ 방어 코드 포인트
- `loadOpenAIKey()` / `loadApiKey()` — 플레이스홀더 감지 로직 유지 (현재 OK)
- `source` 필드 — 운영 중 어느 엔진이 응답하는지 모니터링 활용 가능
- 로그 레벨 구분: `console.warn` (1·2단계 실패) vs `console.log` (3단계 폴백)

#### 📊 모니터링 포인트
```
[chat] OpenAI 실패 → ...   # 자주 보이면 크레딧 재충전 or Claude 전환 신호
[chat] Anthropic 실패 → ... # API 키 만료/잘못 입력 신호
[chat] 스마트 폴백 응답      # 두 API 모두 불가 — 경보 수준
```

---

### 5. 수정 우선순위 & 적용 순서

```
Step 1: server.js 수정 (getSmartFallback 추가 + /api/chat 블록 교체)
Step 2: functions/.env에 ANTHROPIC_API_KEY 실제 키 입력
Step 3: 서버 재시작 후 curl 테스트
Step 4: (선택) 프론트엔드에서 source 필드 활용해 "AI 상담 중 / 도움말 모드" 표시 분기
```

---

---

