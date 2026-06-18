/**
 * 사이(Sai) - API 설정
 * 환경에 따라 자동으로 로컬/프로덕션 서버를 선택합니다.
 *
 * 로컬 개발:   http://localhost:4321
 * 배포 후:     VITE_API_BASE_URL 또는 window.SAI_API_BASE 환경변수 사용
 *
 * Render/Railway 배포 시 window.SAI_API_BASE에 서버 URL 주입
 */
window.HEARIM_CONFIG = (function () {
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  // 배포 환경: window.SAI_API_BASE 로 외부 server.js URL 주입 가능
  const apiBase = window.SAI_API_BASE
    || (isLocal ? 'http://localhost:4321' : '');

  return {
    api: {
      capture: apiBase + '/api/capture',
      chat:    apiBase + '/api/chat',
    },
    apiBase,
    isLocal,
    useAI: true,   // false로 바꾸면 DB 전용 모드
  };
})();
