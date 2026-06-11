// 헤아림 해석 엔진 (DB 키워드 매칭 — web/js/engine.js Dart 포팅)
// DB + API 하이브리드: DB 미스 시 API 폴백

import '../models/db_data.dart';

class TranslateResult {
  final String surface;
  final String hidden;
  final List<Map<String, dynamic>> possibilities;
  final List<String> emotions;
  final String action;
  final int confidence;
  final List<Map<String, String>> replies;
  final String tip;
  final bool fromAI;

  const TranslateResult({
    required this.surface,
    required this.hidden,
    required this.possibilities,
    required this.emotions,
    required this.action,
    required this.confidence,
    required this.replies,
    required this.tip,
    this.fromAI = false,
  });
}

class KakaoResult {
  final int score;
  final int hearts;
  final List<String> emotions;
  final int tempLevel; // 0-4
  final List<Map<String, String>> replies;
  final String tip;

  const KakaoResult({
    required this.score,
    required this.hearts,
    required this.emotions,
    required this.tempLevel,
    required this.replies,
    required this.tip,
  });

  String get tempEmoji {
    const e = ['🧊', '❄️', '🌡️', '🔥', '♨️'];
    return e.elementAtOrNull(tempLevel) ?? '🌡️';
  }
}

class HearimEngine {
  // 정규화: 소문자 + 공백 제거
  String normalize(String text) =>
      text.toLowerCase().replaceAll(RegExp(r'\s+'), '');

  // DB에서 매칭 항목 찾기
  Map<String, dynamic>? findMatch(String text, {String? relation}) {
    final norm = normalize(text);
    for (final entry in HearimDB.entries) {
      final relations = List<String>.from(entry['relation'] as List);
      if (relation != null && !relations.contains(relation)) continue;
      final keys = List<String>.from(entry['keys'] as List);
      for (final key in keys) {
        if (norm.contains(normalize(key)) ||
            normalize(key).contains(norm)) {
          return entry;
        }
      }
    }
    // 관계 무시하고 재탐색
    if (relation != null) return findMatch(text);
    return null;
  }

  TranslateResult? interpret(String text, {String relation = 'unknown'}) {
    final match = findMatch(text, relation: relation);
    if (match == null) return null;

    final replies = <Map<String, String>>[];
    for (final r in (match['replies'] as List)) {
      final m = r as Map<String, dynamic>;
      replies.add({
        'style': m['style'] as String,
        'text': m['text'] as String,
      });
    }

    return TranslateResult(
      surface: match['surface'] as String,
      hidden: match['hidden'] as String,
      possibilities: List<Map<String, dynamic>>.from(
        (match['possibilities'] as List).map((p) => {
              'label': (p as Map)['label'],
              'pct': p['pct'],
            }),
      ),
      emotions: List<String>.from(match['emotions'] as List),
      action: match['action'] as String,
      confidence: match['confidence'] as int,
      replies: replies,
      tip: match['tip'] as String,
    );
  }

  // 온도 계산 (읽씹 분석)
  int readCheckTemp(int hours) {
    if (hours <= 1) return 85;
    if (hours <= 3) return 72;
    if (hours <= 6) return 60;
    if (hours <= 12) return 48;
    if (hours <= 24) return 38;
    if (hours <= 48) return 28;
    return 18;
  }

  String readCheckLabel(int hours) {
    if (hours <= 1) return '매우 관심 있음 (일시적 미확인)';
    if (hours <= 3) return '관심 있지만 바쁠 수 있음';
    if (hours <= 6) return '무언가 생각 중일 가능성';
    if (hours <= 12) return '답장 어색하거나 신경 쓰임';
    if (hours <= 24) return '관심 감소 또는 회피 중';
    if (hours <= 48) return '거리 두기 가능성';
    return '관계 점검이 필요한 시점';
  }

  // 관계 진단 (3문항 → 결과)
  Map<String, dynamic> diagRelationLocal({
    required int q1, // 대화 빈도 (1-5)
    required int q2, // 감정 수용 (1-5)
    required int q3, // 미래 기대 (1-5)
    String relation = 'unknown',
  }) {
    final score = (q1 + q2 + q3) / 3;
    String stage, possibility;
    int temp;

    if (score >= 4.0) {
      stage = '발전 단계';
      possibility = '높음';
      temp = 78;
    } else if (score >= 3.0) {
      stage = '유지 단계';
      possibility = '보통';
      temp = 58;
    } else if (score >= 2.0) {
      stage = '정체 단계';
      possibility = '낮음';
      temp = 38;
    } else {
      stage = '위기 단계';
      possibility = '매우 낮음';
      temp = 20;
    }

    return {
      'stage': stage,
      'possibility': possibility,
      'temp': temp,
      'score': score,
    };
  }
}
