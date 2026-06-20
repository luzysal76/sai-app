# 분석팀 Report

**Topic:** 사이(Sai) AI 관계 운영체제 웹앱 현황 분석 및 다음 단계 로드맵 도출. 현재 상태: 1) 웹앱 완성(로컬 http://localhost:4321), 2) GitHub 푸시 완료(https://github.com/luzysal76/sai-app), 3) 도구 16가지 구현, 4) AI 챗봇 4단계 폴백(Groq→OpenAI→Claude→스마트규칙), 5) PIPA 대응 완료, 6) Firebase 미배포. 주요 파일: web/index.html(SPA), web/server.js(Node.js 포트 4321), web/js/*.js(각 도구 엔진), functions/index.js(Firebase Functions). 도구 목록: 대화번역기/관계통장/카톡분석/읽씹분석/사랑의대화(NVC)/답장생성/관계진단/성장코치/AI관계진단/대화캡처/표현사전/대화시나리오/관계건강체크/애착유형/사랑의언어/AI챗봇. API 현황: OpenAI 크레딧 소진, ANTHROPIC_API_KEY 미설정, GROQ_API_KEY 미설정(플레이스홀더). Known Issues: Firebase 미배포, Anthropic/Groq 키 미입력, 서버 매번 수동재시작. 비전: 웹→Flutter→토스 인앱. 분석 요청: 1)현재 서비스 완성도 평가, 2)사용자 경험 관점 개선점, 3)실제 론칭을 위한 우선순위 작업, 4)수익화 준비 상태 평가, 5)기술적 취약점 및 리스크
**Total Rounds:** 4
**Date:** 2026-06-18

---

## Round 1 — Stage 1: 계획 분석가 ✅

> **Passed → Stage 2**

### 🎯 핵심 목표 & 범위 정의

| 구분 | 내용 |
|------|------|
| **서비스 목표** | 연애·관계 특화 AI 상담 SPA → 퍼블릭 론칭 |
| **단기 범위** | 로컬(localhost:4321) → Firebase 퍼블릭 배포 |
| **중기 범위** | 수익화 모델 구축 + AI 기능 안정화 |
| **장기 범위** | 웹 → Flutter → 토스 인앱 확장 |

---

### 📋 전제조건 & 의존성 구조

```
[Groq API 키 발급] ──────────────────────┐
[Anthropic API 키 설정] ─────────────────┤
                                          ↓
                                   [AI 기능 정상화]
                                          ↓
                                   [Firebase 배포]
                                          ↓
                                   [퍼블릭 론칭 가능]
```

**블로킹 의존성 (순서 고정)**:
1. API 키 설정 → AI 기능 정상화 (선행 필수)
2. Firebase 배포 → 외부 접근 가능

**병렬 진행 가능**:
- UX 개선 작업
- 수익화 모델 설계
- 서버 자동재시작 설정

---

### 1️⃣ 현재 서비스 완성도 평가

**완성된 영역 ✅**
- UI/UX: 16가지 도구 화면 완성
- 아키텍처: 4단계 폴백 구조 설계
- 법적 대응: PIPA 개인정보 처리방침
- 버전 관리: GitHub 연동

**미완성 영역 ❌**
- AI 엔진: API 키 3개 모두 미설정/소진 → 스마트 규칙 응답만 동작
- 배포: Firebase 미배포 → 외부 접근 불가
- 운영: 서버 수동 관리

> **종합 완성도: 약 55~60%**
> UI는 완성이나 핵심 AI 기능이 미동작 상태 — "껍데기는 완성, 엔진이 꺼진 상태"

---

### 2️⃣ 사용자 경험 관점 개선점

| 우선순위 | 항목 | 현재 문제 |
|---------|------|----------|
| 🔴 Critical | AI 응답 품질 | API 키 없어 스마트규칙 응답 → 품질 저하 |
| 🟡 High | 오프라인 UX | 폴백 시 "AI 연결 중단" 사용자 안내 불명확 |
| 🟡 High | 로딩 상태 | API 호출 중 스피너/진행 표시 일관성 |
| 🟢 Medium | 온보딩 | 첫 방문자에게 도구 추천 흐름 없음 |

---

### 3️⃣ 실제 론칭 우선순위 작업

```
P0 — 론칭 블로커 (이것 없으면 론칭 불가)
├── Groq API 키 발급 (무료, 즉시 가능)
├── functions/.env에 키 설정
└── Firebase Hosting 배포

P1 — 안정성 (론칭 후 1주 내)
├── PM2로 서버 자동재시작 설정
├── 환경변수 Firebase 환경 설정 이전
└── 도메인 연결 (Firebase 기본 도메인 or 커스텀)

P2 — 수익화 준비 (론칭 후 2~4주)
├── 도구별 무료/유료 구분 설계
├── 사용량 추적 (Firestore)
└── 토스페이먼츠 연동
```

---

### 4️⃣ 수익화 준비 상태 평가

**현재 상태: 미준비 (0%)** — 수익화 코드 전무

**갖춰진 기반**:
- IP 기반 rate limit → 유료 무제한 게이팅으로 확장 가능
- 도구별 모듈 구조 → 프리미엄 잠금 적용 용이

**추가 필요한 것**:
- 회원가입/로그인 (Firebase Auth)
- 결제 시스템 (토스페이먼츠)
- 사용량 DB (Firestore)
- 구독 플랜 설계

---

### 5️⃣ 기술적 취약점 & 리스크

| 위험도 | 항목 | 구체적 영향 |
|--------|------|------------|
| 🔴 HIGH | API 키 전무 | 16개 도구 중 AI 도구 전부 가짜 응답 |
| 🔴 HIGH | Firebase 미배포 | localhost 외 접근 불가 = 사실상 미출시 |
| 🟡 MED | 서버 수동관리 | 재시작 안 하면 서비스 다운 무대응 |
| 🟡 MED | IP rate limit | VPN으로 쉽게 우회 가능 |
| 🟡 MED | .env 키 관리 | GitHub에 실수 노출 위험 |
| 🟢 LOW | 단일 SPA | SEO 노출 취약 (관계없는 경우 무시 가능) |

---

### 🗺️ 단계별 흐름 요약

```
현재            → P0 (1~2일)        → P1 (1주)         → P2 (2~4주)
로컬 완성         API 키 + 배포        운영 안정화          수익화 시작
(AI 미동작)       (퍼블릭 론칭)        (자동화)            (결제 연동)
```

---

---

## Round 2 — Stage 2: 약점 탐지자 ✅

> **Passed → Stage 3**

### 🔴 치명적 약점 (Critical — 론칭 전 반드시 해결)

#### 약점 1. API 비용 통제 불가 + 수익화 공백의 충돌
- 1단계 계획: "P0 = 론칭, P2(2~4주 후) = 수익화"
- **문제**: 론칭 직후 무료 사용자가 API를 무한 소모 → 수익화 준비 전에 Groq/OpenAI 비용 폭탄 가능
- Rate Limit이 "VPN으로 우회 가능"하다고 1단계 스스로 인정 → **비용 방어막이 사실상 없음**
- **영향도**: 서비스 지속 불가 수준의 재정 리스크

#### 약점 2. Firebase Blaze 플랜 전환 비용 미고려
- Firebase Functions는 **반드시 유료 Blaze 플랜** 필요 (Spark 무료 플랜 = Functions 배포 불가)
- 1단계는 이를 언급하지 않음 → P0 작업이 실제로는 "무료 즉시 배포"가 아님
- 카드 등록 + 플랜 전환 + 예산 상한 설정 없이 배포 시 **예측 불가 청구 위험**

#### 약점 3. .env 키 GitHub 노출 가능성 — 이미 발생했을 수 있음
- 1단계: ".env 키 관리 — GitHub 실수 노출 위험" → 🟡 MED로 분류
- **실제 위험도**: 과소평가. OPENAI_API_KEY가 functions/.env에 저장됐고, git history에 **이미 커밋돼 있을 가능성** 존재
- `git log --all -- functions/.env` 검증 없이 론칭하면 키 탈취 → 크레딧 소진 재발

---

### 🟡 중요 약점 (High — 론칭 후 즉시 타격)

#### 약점 4. 사용자 획득 전략 완전 누락
- 1단계 분석: 론칭 우선순위·수익화·기술 취약점은 다뤘으나 **"어떻게 사용자를 데려올 것인가"가 0%**
- SPA 구조 → SEO 불리 (1단계에서 "무시 가능"으로 처리)
- 론칭해도 사용자 없으면 → 수익화 타임라인 의미 없음

#### 약점 5. Firebase Functions ↔ 로컬 서버 아키텍처 불일치
- 현재: `web/server.js` (POST /api/chat, /api/capture)
- 목표: `functions/index.js` (Firebase Functions 엔드포인트)
- **두 라우팅 구조가 다름** → 배포 후 프론트엔드 API URL 수정 필요
- 1단계는 이를 단순 "환경변수 이전"으로 처리했으나 실제로는 코드 수정 작업

---

### 🟢 경미한 약점 (Medium — 개선 권장)

| # | 항목 | 내용 |
|---|------|------|
| 6 | Groq Rate Limit | "무료 즉시" 가능하나 무료 플랜 RPM(분당 요청) 제한 엄격 → 동시 사용자 10명만 돼도 차단 |
| 7 | Flutter 전환 현실성 | 웹 JS 로직 → Dart 포팅 비용/기간 미추산. 비전이 구체적 계획 없이 제시됨 |
| 8 | 경쟁사 분석 없음 | 연애의과학 등 유사 서비스 대비 차별화 미검증 |

---

### 약점 우선순위 요약

```
🔴 즉시 해결 필요
├── API 비용 폭탄 방어: Rate Limit 강화 OR 사용량 상한 설정 선행
├── Firebase Blaze 플랜 전환 비용 예산 확보
└── git history .env 키 노출 여부 검증

🟡 론칭 시점에 함께 준비
├── 사용자 유입 채널 1개 이상 확보 (카카오채널/인스타)
└── 프론트 API URL → Firebase Functions URL 교체 작업 확인
```

---

---

## Round 3 — Stage 3: 보완 설계자 ✅

> **Passed → Stage 4**

### 🔴 Critical 약점 개선안

---

#### C-1. API 비용 폭탄 방어 (수익화 공백 기간 대응)

**문제**: Rate Limit이 IP 기반 → VPN 우회 가능, 수익화 없이 론칭 시 API 비용 무한 소모

**개선안 — 서버사이드 소비 상한 (하드 제한)**

```
방법 A: Groq 무료 플랜 한도 자체를 방어막으로 활용
├── Groq 무료 플랜: 분당 30 RPM / 일 14,400 요청 (하드 상한 자동 적용)
├── OpenAI/Anthropic는 론칭 초기 비활성화 상태 유지
└── 비용 0원 보장 + AI 기능 동작

방법 B: Firestore 기반 일일 글로벌 카운터 (병렬 추가)
├── 전체 서비스 일일 AI 호출 총량 = 500회 하드캡
├── 500회 초과 시 모든 사용자에게 "오늘 AI 상담 마감" 안내
└── 비용 예측 가능, 일 최대 $0 (Groq 무료 구간)
```

**실행 순서**:
1. Groq API 키 발급 (무료, 5분) → 즉시 P0
2. `server.js` Rate Limit을 `IP별` → `글로벌 카운터 + IP별` 이중화
3. OpenAI/Anthropic 폴백은 **유료 플랜 구독 후** 활성화

---

#### C-2. Firebase Blaze 전환 비용 리스크 제거

**문제**: Functions 배포 = Blaze 필수 → 무료 배포 불가, 예산 알림 없으면 청구 폭탄

**개선안 — 2단계 배포 전략**

```
1단계 (즉시 무료 배포):
└── Firebase Hosting으로 정적 SPA 배포
    ├── web/index.html → Firebase Hosting (Spark 무료, 카드 불필요)
    ├── AI API 호출 → 현재 server.js 엔드포인트 유지 (Render/Railway 무료 배포)
    └── 외부 접근 가능 + 비용 0원

2단계 (수익화 시작 시점에 Blaze 전환):
└── Firebase Functions 배포
    ├── Blaze 전환 시 예산 알림 $5 설정 (Firebase Console)
    ├── 월 200만 호출 무료 구간 내 유지 목표
    └── 유료 기능 수익이 발생한 후에 전환
```

**체크리스트**:
- [ ] Firebase Hosting 배포 (오늘 가능)
- [ ] Render.com 또는 Railway 무료 플랜으로 server.js 배포
- [ ] `VITE_API_BASE_URL` 환경변수로 엔드포인트 관리

---

#### C-3. .env 키 GitHub 노출 긴급 검증 및 대응

**문제**: git history에 functions/.env가 이미 커밋됐을 가능성 → 키 탈취 위험

**즉시 실행 명령어**:

```bash
# 1. 노출 여부 확인 (30초)
git log --all --oneline -- functions/.env

# 2. history에 파일이 있으면 → 내용 확인
git show <commit-hash>:functions/.env

# 3. 노출 확인 시 즉시 실행
## 키 재발급: OpenAI dashboard → 기존 키 revoke → 신규 발급
## git history 삭제 (BFG Repo-Cleaner)
npx bfg --delete-files .env
git push --force

# 4. .gitignore 재확인
cat .gitignore | grep .env
```

**예방 조치**:
```
functions/.env → functions/.env.local (gitignore 대상 유지)
운영 키 관리: Firebase Console > Functions > 환경변수로 이전
```

---

### 🟡 High 약점 개선안

---

#### H-4. 사용자 획득 전략 — 론칭 전 채널 1개 확보

**문제**: 아무도 없는 론칭 = 수익화 타임라인 전체 무의미

**최소 실행 플랜 (비용 0원)**:

| 채널 | 실행 항목 | 소요 시간 |
|------|----------|----------|
| 카카오채널 | "사이 AI 연애 상담" 채널 개설 → 하단 링크에 앱 URL | 30분 |
| 인스타그램 | @sai.relationship 계정 개설 → 연애 팁 릴스 3개 예약 | 1~2시간 |
| 에브리타임 | 연애 고민 게시판에 베타 테스터 20명 모집 공고 | 20분 |

**콘텐츠 전략 (자동화 가능)**:
```
주 2회 카드뉴스: "카카오톡 읽씹 분석법" → 앱으로 직접 해보기 CTA
→ 에브리타임 + 커뮤니티 배포 → 유입
```

---

#### H-5. Firebase Functions ↔ 로컬 서버 API URL 불일치 해소

**문제**: 배포 후 `/api/chat`, `/api/capture` URL이 달라짐 → 프론트 수정 필요

**개선안 — 환경별 API URL 추상화**:

```javascript
// web/js/config.js (신규 생성)
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:4321'
  : 'https://us-central1-YOUR_PROJECT.cloudfunctions.net';

// 또는 Firebase Hosting rewrites 활용
// firebase.json에 추가:
{
  "hosting": {
    "rewrites": [
      { "source": "/api/**", "function": "api" }
    ]
  }
}
// → 프론트 코드 변경 없이 /api/chat 유지
```

**권장**: Firebase Hosting rewrites 방식 → 프론트 코드 수정 0줄

---

### 🟢 Medium 약점 개선안

---

#### M-6. Groq RPM 제한 대응

```
Groq 무료: 분당 30 RPM → 동시 사용자 10명이면 초과
대응: 요청 큐(queue) + 3초 지연 응답 UX
├── "AI가 생각 중이에요..." 애니메이션으로 대기 처리
└── 큐 초과 시 스마트규칙 응답으로 자동 폴백
```

#### M-7. Flutter 전환 현실성 — 단계적 계획

```
Phase 1 (웹 안정화): 3개월
Phase 2 (Flutter 초기): 핵심 3개 도구만 이식 (AI챗봇·관계진단·카톡분석)
Phase 3 (전체 이식): 나머지 13개 도구
→ 전체 Flutter 이식: 최소 6개월 / 1인 개발 기준
```

---

### 🗺️ 개선 우선순위 로드맵

```
오늘 (D+0, 30분):
├── git log -- functions/.env → 노출 여부 확인
├── Groq API 키 발급 (console.groq.com)
└── Firebase Hosting 배포 시작 (Blaze 없이 가능)

D+1 (내일):
├── Groq 키 server.js 적용 → AI 기능 정상화
├── Rate Limit 서버사이드 강화 (글로벌 카운터 추가)
└── Firebase Hosting 라이브 → 퍼블릭 URL 확보

D+2~3:
├── 카카오채널 + 인스타 계정 개설
├── API URL 환경변수화 (Hosting rewrites)
└── .env → Firebase Functions 환경변수 이전

D+7 이후:
├── 베타 테스터 20명 모집 → 실사용 피드백
└── 수익화 설계 시작 (Firebase Auth + 결제)
```

---

---

## Round 4 — Stage 4: 최종 검증자 🏆

### ✅ 종합 실행 가능성 평가

| 영역 | 1라운드 원안 | 2라운드 약점 | 3라운드 보완 | 최종 상태 |
|------|-------------|-------------|-------------|----------|
| AI 기능 정상화 | Groq 키 발급 | 비용 폭탄 우려 | 글로벌 카운터 + Groq 무료 한도 방어막 | ✅ 해결 |
| 배포 전략 | Firebase 즉시 배포 | Blaze 필수 = 무료 아님 | Hosting(무료) → Blaze(나중) 2단계 분리 | ✅ 해결 |
| 키 보안 | 🟡 MED 위험 | 이미 커밋됐을 수 있음 | git log 검증 + BFG 절차 명시 | ✅ 해결 |
| 사용자 획득 | 누락 | 론칭 후 유입 없음 위험 | 카카오채널/인스타/에브리타임 3채널 | ✅ 보완 |
| API URL 불일치 | 단순 이전으로 처리 | 코드 수정 필요 | Hosting rewrites로 0줄 변경 해결 | ✅ 해결 |
| Groq RPM | 미고려 | 10명에도 차단 가능 | 큐 + 폴백 UX 대응 | ✅ 보완 |
| Flutter 일정 | 비전만 제시 | 현실성 미검증 | 6개월 3단계 로드맵 | ✅ 보완 |

---

### 🏁 최종 권고사항

**진입 장벽이 가장 낮은 순서로 실행할 것**

```
오늘 당장 (30분, 비용 0원):
1. git log --all --oneline -- functions/.env  ← 보안 검증 선행 필수
2. console.groq.com → API 키 발급
3. firebase deploy --only hosting  ← Spark 플랜, 카드 불필요

내일 (AI 정상화):
4. Groq 키 server.js 적용 + 글로벌 카운터 추가
5. Render.com 무료 플랜 → server.js 배포 (Railway 대안)
6. VITE_API_BASE_URL 환경변수화

D+2~3 (사용자 유입):
7. 카카오채널 개설 → 앱 URL 링크
8. 에브리타임 베타 테스터 20명 모집 공고
```

---

### 📋 최종 론칭 체크리스트

#### 🔴 필수 (이것 없으면 퍼블릭 론칭 불가)
- [ ] `.env` git history 노출 여부 확인 (`git log --all -- functions/.env`)
- [ ] Groq API 키 발급 및 `server.js` 적용
- [ ] Firebase Hosting 배포 (Spark 무료 플랜)
- [ ] 백엔드 서버 Render/Railway 무료 배포 (server.js)
- [ ] API 엔드포인트 URL 환경변수화

#### 🟡 론칭 직후 1주 내
- [ ] 글로벌 AI 호출 카운터 (일 500회 상한)
- [ ] Groq 요청 큐 + RPM 제한 UX 처리
- [ ] 카카오채널 개설
- [ ] 베타 테스터 20명 모집

#### 🟢 2~4주 (수익화 준비)
- [ ] Firebase Auth (로그인)
- [ ] Firestore 사용량 추적
- [ ] Blaze 플랜 전환 + 예산 알림 $5 설정
- [ ] 토스페이먼츠 연동 설계

---

### ⚠️ 미해결 상태로 보류된 항목 (비블로킹)

| 항목 | 현황 | 영향 |
|------|------|------|
| SEO 취약 (SPA) | 별도 대응 계획 없음 | 검색 유입 기대 불가 — 커뮤니티 마케팅으로 보완 |
| 경쟁사 분석 | 없음 | 차별화 전략 미검증 — 베타 피드백으로 보완 |
| OpenAI/Anthropic 폴백 활성화 | 크레딧 소진 / 미설정 | 스마트규칙 응답 품질 의존 — Groq 충분하면 단기 무관 |

---

---

