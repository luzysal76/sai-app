/**
 * 헤아림 - API 설정
 * Firebase 배포 후 FIREBASE_PROJECT_ID를 실제 프로젝트 ID로 교체하세요.
 *
 * 로컬 에뮬레이터: http://127.0.0.1:5001/hearim-app/asia-northeast3
 * 프로덕션:        https://asia-northeast3-hearim-app.cloudfunctions.net
 */
window.HEARIM_CONFIG = (function () {
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const PROJECT_ID = 'hearim-app';         // ← Firebase 프로젝트 ID
  const REGION     = 'asia-northeast3';    // 서울 리전

  const base = isLocal
    ? `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}`
    : `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

  // 이미지 캡처 분석은 항상 로컬 dev server (Claude 비전 프록시)
  const captureUrl = 'http://localhost:4321/api/capture';

  return {
    api: {
      translate:    base + '/translate',
      analyzeKakao: base + '/analyzeKakao',
      diagRelation: base + '/diagRelation',
      capture:      captureUrl,
    },
    useAI: true,   // false로 바꾸면 DB 전용 모드
  };
})();
