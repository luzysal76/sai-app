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

// ── API 요청 카운터 (IP 기반 Rate Limiting) ───────────────────────────
const rateLimits = {};          // { ip: { chat: { count, date }, capture: { count, month } } }

function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
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
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '이번 달 무료 캡처 분석(3회)을 모두 사용했어요. 다음 달에 다시 시도해주세요.' }));
    }
    const apiKey = loadApiKey();
    if (!apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다. functions/.env 파일에 API 키를 입력해주세요.' }));
    }
    if (!Anthropic) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Anthropic SDK를 불러올 수 없습니다.' }));
    }

    let body;
    try { body = await readBody(req); }
    catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: '잘못된 요청 형식입니다.' })); }

    const { imageData, mediaType = 'image/jpeg' } = body;
    if (!imageData) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
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

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ source: 'claude', ...result }));
    } catch (err) {
      console.error('[capture] 오류:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'AI 이미지 분석 오류: ' + err.message }));
    }
    return;
  }

  // ── POST /api/chat — OpenAI GPT 챗봇 (chatbot.py 포팅) ─────────────
  if (req.method === 'POST' && url === '/api/chat') {
    if (!checkLimit(req, 'chat')) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '오늘 무료 AI 상담(5회)을 모두 사용했어요. 내일 다시 대화해요 💕' }));
    }
    const apiKey = loadOpenAIKey();
    if (!apiKey || !OpenAI) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }));
    }

    let body;
    try { body = await readBody(req); }
    catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: '잘못된 요청 형식입니다.' })); }

    const { messages } = body;
    if (!Array.isArray(messages) || !messages.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'messages 배열이 필요합니다.' }));
    }

    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const OpenAIClient = OpenAI.default || OpenAI;
      const client = new OpenAIClient({ apiKey });
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
      });
      const content = response.choices[0].message.content || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content: content.trim() }));
    } catch (err) {
      console.error('[chat] 오류:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'AI 오류: ' + err.message }));
    }
    return;
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
