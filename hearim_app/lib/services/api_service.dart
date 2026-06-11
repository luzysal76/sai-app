import 'dart:convert';
import 'package:http/http.dart' as http;

// Firebase Functions 엔드포인트
class ApiService {
  static const _projectId = 'hearim-app';
  static const _region = 'asia-northeast3';

  // 로컬/프로덕션 자동 분기 (release 빌드 = 프로덕션)
  static const bool _isDebug = bool.fromEnvironment('dart.vm.product',
      defaultValue: false) == false;

  String get _base => _isDebug
      ? 'http://127.0.0.1:5001/$_projectId/$_region'
      : 'https://$_region-$_projectId.cloudfunctions.net';

  Future<Map<String, dynamic>?> translate({
    required String text,
    String relation = 'unknown',
    bool useAI = true,
  }) async {
    try {
      final resp = await http
          .post(
            Uri.parse('$_base/translate'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'text': text, 'relation': relation, 'useAI': useAI}),
          )
          .timeout(const Duration(seconds: 15));
      if (resp.statusCode == 200) {
        return jsonDecode(resp.body) as Map<String, dynamic>;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> analyzeKakao({
    required String text,
    String relation = 'unknown',
  }) async {
    try {
      final resp = await http
          .post(
            Uri.parse('$_base/analyzeKakao'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'text': text, 'relation': relation}),
          )
          .timeout(const Duration(seconds: 15));
      if (resp.statusCode == 200) {
        return jsonDecode(resp.body) as Map<String, dynamic>;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> diagRelation({
    required String chat,
    required String concern,
    String relation = 'unknown',
  }) async {
    try {
      final resp = await http
          .post(
            Uri.parse('$_base/diagRelation'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'chat': chat,
              'concern': concern,
              'relation': relation,
            }),
          )
          .timeout(const Duration(seconds: 15));
      if (resp.statusCode == 200) {
        return jsonDecode(resp.body) as Map<String, dynamic>;
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
