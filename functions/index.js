/**
 * 헤아림 - Firebase Functions (Claude API 백엔드)
 * 엔드포인트:
 *   POST /translate  - 대화 번역 (속뜻·감정·가능성 분석)
 *   POST /analyze    - 카톡 대화 분석 (관심도·답장)
 */

const { onRequest } = require('firebase-functions/v2/https');
const Anthropic = require('@anthropic-ai/sdk');

// ── 공통 CORS 헤더 ──────────────────────────────────────────
function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다');
  return new Anthropic({ apiKey });
}

// ── 공통 응답 파서 (JSON 추출) ────────────────────────────────
function parseJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON을 찾을 수 없습니다');
  return JSON.parse(match[0]);
}

// ── 1. 대화 번역기 ─────────────────────────────────────────────
const RELATION_MAP = {
  lover: '연인/남자친구/여자친구',
  some:  '썸 타는 사이',
  friend:'친한 친구',
  family:'가족',
  work:  '직장 동료/상사',
};

function buildTranslatePrompt(text, relation) {
  const relLabel = RELATION_MAP[relation] || '지인';
  return `당신은 한국의 연애·인간관계 심리 전문가입니다.
상대방이 한 말의 진짜 속뜻과 감정을 분석해주세요.

관계 유형: ${relLabel}
상대방이 한 말: "${text}"

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "surface": "표면적으로 하는 말의 의미 (1~2문장, 담백하게)",
  "hidden": "말 뒤에 숨은 진짜 감정·의도 (1~2문장, 심리적 해석)",
  "emotions": ["감정태그1", "감정태그2", "감정태그3"],
  "possibilities": [
    {"label": "가장 가능성 높은 해석", "pct": 45},
    {"label": "두 번째 가능성", "pct": 30},
    {"label": "세 번째 가능성", "pct": 25}
  ],
  "action": "상대에게 어떻게 반응하면 좋을지 구체적 행동 추천 (1~2문장)",
  "tip": "이 관계에서 기억하면 좋은 인사이트 (1문장)",
  "replies": [
    {"style": "공감", "text": "공감하고 위로하는 답장 (구체적 문장)"},
    {"style": "다정", "text": "따뜻하고 애정 있는 답장 (구체적 문장)"},
    {"style": "유머", "text": "가볍게 웃음을 주는 답장 (구체적 문장)"},
    {"style": "썸", "text": "약간 설레게 만드는 답장 (구체적 문장)"}
  ],
  "confidence": 82
}

주의사항:
- 감정 태그는 2~4글자 짧은 단어 (예: "불안", "기대", "서운함")
- possibilities 합계는 반드시 100
- confidence는 70~95 사이 정수
- 답장은 실제로 보낼 수 있는 자연스러운 한국어 문장`;
}

exports.translate = onRequest(
  { cors: true, region: 'asia-northeast3', timeoutSeconds: 30 },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'POST만 허용됩니다' }); return; }

    const { text, relation } = req.body || {};
    if (!text || !text.trim()) {
      res.status(400).json({ error: '분석할 텍스트를 입력해주세요' }); return;
    }

    try {
      const client = getClient();
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{ role: 'user', content: buildTranslatePrompt(text, relation || 'friend') }],
      });

      const result = parseJson(message.content[0].text);
      res.json({ source: 'claude', ...result });
    } catch (err) {
      console.error('[translate] 오류:', err.message);
      res.status(500).json({ error: 'AI 분석 중 오류가 발생했습니다', detail: err.message });
    }
  }
);

// ── 2. 카톡 분석기 ─────────────────────────────────────────────
function buildKakaoPrompt(text, relation) {
  const relLabel = RELATION_MAP[relation] || '지인';
  return `한국의 카카오톡 대화를 분석하는 전문가입니다.
아래 대화에서 상대방의 관심도와 감정을 분석해주세요.

관계 유형: ${relLabel}
대화 내용:
---
${text}
---

반드시 아래 JSON 형식으로만 응답하세요:

{
  "score": 72,
  "hearts": 3,
  "emotions": ["설레임", "호기심", "편안함"],
  "tempLevel": 3,
  "replies": [
    {"style": "공감", "text": "공감 답장 문장"},
    {"style": "다정", "text": "다정한 답장 문장"},
    {"style": "썸", "text": "설레는 답장 문장"}
  ],
  "tip": "이 대화 패턴에서 읽어야 할 핵심 포인트 (1문장)"
}

주의:
- score: 0~100 (상대방이 나에게 보이는 관심도)
- hearts: 0~5 (감정 표현 강도)
- tempLevel: 1=차가움 2=보통 3=따뜻함 4=뜨거움
- 대화가 없거나 너무 짧으면 score 30 이하로`;
}

exports.analyzeKakao = onRequest(
  { cors: true, region: 'asia-northeast3', timeoutSeconds: 30 },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'POST만 허용됩니다' }); return; }

    const { text, relation } = req.body || {};
    if (!text || !text.trim()) {
      res.status(400).json({ error: '대화 내용을 입력해주세요' }); return;
    }

    try {
      const client = getClient();
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1000,
        temperature: 0.6,
        messages: [{ role: 'user', content: buildKakaoPrompt(text, relation || 'some') }],
      });

      const result = parseJson(message.content[0].text);
      res.json({ source: 'claude', ...result });
    } catch (err) {
      console.error('[analyzeKakao] 오류:', err.message);
      res.status(500).json({ error: 'AI 분석 중 오류가 발생했습니다', detail: err.message });
    }
  }
);

// ── 3. AI 관계 진단 ────────────────────────────────────────────
function buildDiagPrompt(chat, concern, relation) {
  const relLabel = RELATION_MAP[relation] || '지인';
  return `연애·인간관계 심리 상담 전문가로서 관계 진단을 해주세요.

관계 유형: ${relLabel}
최근 대화/상황: ${chat}
고민·느끼는 점: ${concern}

아래 JSON으로만 응답하세요:

{
  "affinity": 68,
  "trust": 72,
  "stability": 55,
  "satisfaction": 63,
  "insight": "이 관계의 현재 상태와 개선 방향 (2~3문장, 따뜻하고 솔직하게)"
}

주의:
- affinity(친밀도), trust(신뢰도), stability(감정안정성), satisfaction(소통만족도): 각 0~100
- insight는 판단이 아닌 공감과 제안으로`;
}

exports.diagRelation = onRequest(
  { cors: true, region: 'asia-northeast3', timeoutSeconds: 30 },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'POST만 허용됩니다' }); return; }

    const { chat, concern, relation } = req.body || {};
    if (!chat && !concern) {
      res.status(400).json({ error: '대화 내용 또는 고민을 입력해주세요' }); return;
    }

    try {
      const client = getClient();
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 800,
        temperature: 0.65,
        messages: [{ role: 'user', content: buildDiagPrompt(chat || '', concern || '', relation || 'friend') }],
      });

      const result = parseJson(message.content[0].text);
      res.json({ source: 'claude', ...result });
    } catch (err) {
      console.error('[diagRelation] 오류:', err.message);
      res.status(500).json({ error: 'AI 분석 중 오류가 발생했습니다', detail: err.message });
    }
  }
);
