// 사이(Sai) 개발 서버 — 정적 파일 + Claude 비전 API 프록시
const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 4321;

// ── .env 파서 (functions/.env) ────────────────────────────────────────
function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '..', 'functions', '.env');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([A-Z_]+)=(.+)/);
      if (m) {
        const key = m[1].trim();
        const val = m[2].trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch (_) {}
}
loadEnvVars();

// ── Anthropic API 키 ──────────────────────────────────────────────────
function loadApiKey() {
  const key = process.env.ANTHROPIC_API_KEY || '';
  return (!key || key.includes('여기에') || key.includes('실제')) ? null : key;
}

// ── OpenAI API 키 ─────────────────────────────────────────────────────
function loadOpenAIKey() {
  const key = process.env.OPENAI_API_KEY || '';
  return (!key || key.includes('여기에')) ? null : key;
}

// ── Groq API 키 ───────────────────────────────────────────────────────
function loadGroqKey() {
  const key = process.env.GROQ_API_KEY || '';
  return (!key || key.includes('여기에')) ? null : key;
}

// ── Anthropic SDK ─────────────────────────────────────────────────────
let Anthropic;
try {
  Anthropic = require(path.join(__dirname, '..', 'functions', 'node_modules', '@anthropic-ai', 'sdk'));
} catch (_) {
  try { Anthropic = require('@anthropic-ai/sdk'); } catch (__) {}
}

// ── OpenAI SDK ────────────────────────────────────────────────────────
let OpenAI;
try {
  OpenAI = require(path.join(__dirname, '..', 'functions', 'node_modules', 'openai'));
} catch (_) {
  try { OpenAI = require('openai'); } catch (__) {}
}

// ── MIME 타입 ─────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

// ── API 요청 카운터 (IP 기반 + 글로벌 Rate Limiting) ────────────────
const rateLimits = {};          // { ip: { chat: { count, date }, capture: { count, month } } }
const globalCounter = { date: '', chatCount: 0 };  // 글로벌 일일 AI 호출 상한
const GLOBAL_CHAT_LIMIT = 500;  // 서버 전체 하루 최대 AI 호출 수

function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
}

function checkGlobalLimit() {
  const today = new Date().toISOString().slice(0, 10);
  if (globalCounter.date !== today) { globalCounter.date = today; globalCounter.chatCount = 0; }
  if (globalCounter.chatCount >= GLOBAL_CHAT_LIMIT) return false;
  globalCounter.chatCount++;
  return true;
}

function checkLimit(req, type) {
  const ip = getIp(req);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);          // YYYY-MM-DD
  const month = now.toISOString().slice(0, 7);           // YYYY-MM

  if (!rateLimits[ip]) rateLimits[ip] = {};
  const limits = rateLimits[ip];

  if (type === 'chat') {
    if (!limits.chat || limits.chat.date !== today) {
      limits.chat = { count: 0, date: today };
    }
    if (limits.chat.count >= 5) return false;
    limits.chat.count++;
    return true;
  }

  if (type === 'capture') {
    if (!limits.capture || limits.capture.month !== month) {
      limits.capture = { count: 0, month };
    }
    if (limits.capture.count >= 3) return false;
    limits.capture.count++;
    return true;
  }

  return true;
}

// ── JSON body 파서 ────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

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

// ── Claude 비전 분석 프롬프트 ─────────────────────────────────────────
const CAPTURE_PROMPT = `이 이미지는 카카오톡 또는 문자 대화 캡처입니다.
대화 내용을 읽고 감정 패턴과 관계 신호를 분석해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "emotions": [
    {"label": "설렘", "pct": 35},
    {"label": "불안", "pct": 28},
    {"label": "친밀감", "pct": 22},
    {"label": "기대", "pct": 15}
  ],
  "risks": ["읽씹 가능성", "일방적 연락 패턴"],
  "note": "이 대화에서 읽어야 할 핵심 포인트 (1~2문장, 따뜻하고 통찰력 있게)"
}

규칙:
- emotions: 대화에서 감지되는 감정 2~4개, pct 합계 반드시 100
- risks: 관계 위험 신호 1~3개, 없으면 빈 배열 []
- 대화 내용이 보이지 않거나 카톡이 아닌 이미지라면 emotions에 [{"label":"이미지 인식 불가","pct":100}] 반환
- 한국어로 작성`;

// ── 서버 ─────────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  // CORS (API 요청용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // ── POST /api/capture — Claude 비전 이미지 분석 ──────────────────
  if (req.method === 'POST' && url === '/api/capture') {
    if (!checkLimit(req, 'capture')) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: '이번 달 무료 캡처 분석(3회)을 모두 사용했어요. 다음 달에 다시 시도해주세요.' }));
    }
    const apiKey = loadApiKey();
    if (!apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다. functions/.env 파일에 API 키를 입력해주세요.' }));
    }
    if (!Anthropic) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Anthropic SDK를 불러올 수 없습니다.' }));
    }

    let body;
    try { body = await readBody(req); }
    catch (e) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ error: '잘못된 요청 형식입니다.' })); }

    const { imageData, mediaType = 'image/jpeg' } = body;
    if (!imageData) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: '이미지 데이터가 없습니다.' }));
    }

    try {
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
            { type: 'text', text: CAPTURE_PROMPT },
          ],
        }],
      });

      const raw = msg.content[0].text;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON 파싱 실패');
      const result = JSON.parse(jsonMatch[0]);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ source: 'claude', ...result }));
    } catch (err) {
      console.error('[capture] 오류:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'AI 이미지 분석 오류: ' + err.message }));
    }
    return;
  }

  // ── POST /api/chat — AI 챗봇 (4단계 폴백) ─────────────────────────
  if (req.method === 'POST' && url === '/api/chat') {
    if (!checkLimit(req, 'chat')) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: '오늘 무료 AI 상담(5회)을 모두 사용했어요. 내일 다시 대화해요 💕' }));
    }
    if (!checkGlobalLimit()) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: '오늘 서버 AI 상담이 마감됐어요. 내일 다시 만나요 💕' }));
    }

    let body;
    try { body = await readBody(req); }
    catch (e) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ error: '잘못된 요청 형식입니다.' })); }

    const { messages } = body;
    if (!Array.isArray(messages) || !messages.length) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'messages 배열이 필요합니다.' }));
    }

    // ── 0단계: Groq 시도 (무료 LLaMA) ─────────────────────────────
    const groqKey = loadGroqKey();
    if (groqKey && OpenAI) {
      try {
        const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        const OpenAIClient = OpenAI.default || OpenAI;
        const client = new OpenAIClient({
          apiKey: groqKey,
          baseURL: 'https://api.groq.com/openai/v1',
        });
        // 한국어 응답 강제: 시스템 메시지에 언어 지시 추가
        const groqMessages = messages.map(m => {
          if (m.role === 'system') {
            return { ...m, content: '반드시 한국어로만 답변하세요. Do not use any other language.\n\n' + m.content };
          }
          return m;
        });
        const response = await client.chat.completions.create({
          model: groqModel, messages: groqMessages, temperature: 0.7, max_tokens: 512,
        });
        const content = response.choices[0].message.content || '';
        if (content.trim()) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ content: content.trim(), source: 'groq' }));
        }
      } catch (err) {
        console.warn('[chat] Groq 실패 →', err.message);
      }
    }

    // ── 1단계: OpenAI 시도 ──────────────────────────────────────────
    const openaiKey = loadOpenAIKey();
    if (openaiKey && OpenAI) {
      try {
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        const OpenAIClient = OpenAI.default || OpenAI;
        const client = new OpenAIClient({ apiKey: openaiKey });
        const response = await client.chat.completions.create({ model, messages, temperature: 0.7 });
        const content = response.choices[0].message.content || '';
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ content: content.trim(), source: 'openai' }));
      } catch (err) {
        console.warn('[chat] OpenAI 실패 →', err.message);
      }
    }

    // ── 2단계: Anthropic Claude 시도 ────────────────────────────────
    const anthropicKey = loadApiKey();
    if (anthropicKey && Anthropic) {
      try {
        const client = new Anthropic({ apiKey: anthropicKey });
        const systemMsg = messages.find(m => m.role === 'system')?.content || '';
        const chatMsgs = messages.filter(m => m.role !== 'system');
        const msg = await client.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          system: systemMsg,
          messages: chatMsgs,
          temperature: 0.7,
        });
        const content = msg.content[0].text || '';
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ content: content.trim(), source: 'claude' }));
      } catch (err) {
        console.warn('[chat] Anthropic 실패 →', err.message);
      }
    }

    // ── 3단계: 스마트 규칙 응답 (항상 동작) ────────────────────────
    console.log('[chat] 스마트 폴백 응답');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ content: getSmartFallback(messages), source: 'fallback' }));
  }

  // ── GET — 정적 파일 서빙 ─────────────────────────────────────────
  let filePath = path.join(ROOT, url === '/' ? '/index.html' : url);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  });

}).listen(PORT, () => console.log(`사이(Sai) dev server: http://localhost:${PORT}`));
