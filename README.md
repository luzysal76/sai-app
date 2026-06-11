# 헤아림 (Hearim) 💌

> 연애·인간관계 커뮤니케이션 번역기 — 상대의 진짜 속뜻을 헤아려보세요.

상대가 한 말의 숨은 의미를 해석하고, 상황에 맞는 답장을 추천해주는 서비스입니다.

## 플랫폼 로드맵
- ✅ **웹앱** (MVP, 현재) — `web/`
- ⬜ **Flutter 앱** (Android/iOS)
- ⬜ **토스 인앱** (미니앱)

세 플랫폼은 공통 백엔드(Firebase Functions 예정)와 공통 해석 규칙을 공유합니다.

## 주요 기능
- 관계 선택: 연인 / 썸 / 친구 / 가족 / 직장
- 속뜻 번역 + 감정 태그 + 해석 신뢰도
- 상황별 답장 추천 3종 (탭하면 복사)
- 한 줄 조언(팁)

## 해석 엔진 (하이브리드)
1. **DB 키워드 매칭** — 자주 쓰는 표현을 미리 정의 (`web/js/data.js`)
2. **관계 가중치** 적용한 점수 계산 (`web/js/engine.js`)
3. **Claude API 폴백** (예정) — DB에 없으면 백엔드 호출

## 웹앱 실행
```bash
cd web
node server.js        # http://localhost:4321
```

## 프로젝트 구조
```
web/
  index.html          # 화면
  css/styles.css      # 스타일
  js/data.js          # 표현 해석 DB
  js/engine.js        # 해석 엔진 (순수 함수, 플랫폼 공통 규칙)
  js/app.js           # UI 컨트롤러
  server.js           # 개발용 정적 서버 (의존성 없음)
```

## 다음 할 일
- [ ] Firebase Functions로 Claude API `/translate` 엔드포인트 구축
- [ ] 표현 DB 확장 (현재 10종)
- [ ] Flutter 클라이언트
- [ ] 토스 인앱 연동

---
한국어 단독 · 해석은 참고용입니다. 진심은 결국 대화로 💗
