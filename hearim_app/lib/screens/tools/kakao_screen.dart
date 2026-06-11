import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../services/engine.dart';
import '../../services/api_service.dart';
import '../../widgets/gradient_button.dart';

class KakaoScreen extends StatefulWidget {
  const KakaoScreen({super.key});

  @override
  State<KakaoScreen> createState() => _KakaoScreenState();
}

class _KakaoScreenState extends State<KakaoScreen> {
  final _textCtrl = TextEditingController();
  String _relation = 'unknown';
  bool _loading = false;
  Map<String, dynamic>? _result;
  final _api = ApiService();

  static const _relationOptions = {
    'unknown': '❓ 선택 안 함',
    'lover': '💑 연인',
    'some': '💕 썸',
    'friend': '👫 친구',
    'family': '👨‍👩‍👧 가족',
    'work': '💼 직장',
  };

  Future<void> _analyze() async {
    final text = _textCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() { _loading = true; _result = null; });
    final res = await _api.analyzeKakao(text: text, relation: _relation);
    setState(() {
      _result = res ?? _fallback(text);
      _loading = false;
    });
  }

  Map<String, dynamic> _fallback(String text) {
    final length = text.length;
    final score = (50 + (length > 50 ? 20 : length ~/ 5)).clamp(10, 95);
    return {
      'score': score,
      'hearts': score >= 70 ? 3 : score >= 50 ? 2 : 1,
      'emotions': ['💬 일반 대화'],
      'tempLevel': score >= 70 ? 3 : score >= 50 ? 2 : 1,
      'replies': [
        {'style': '공감', 'text': '맞아, 그랬구나 :)'},
        {'style': '다정', 'text': '그렇구나. 더 얘기해줘 :)'},
        {'style': '유머', 'text': '오 진짜? ㅋㅋ'},
      ],
      'tip': '대화 내용이 길수록 더 정확한 분석이 가능해요.',
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('카톡 분석기')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: kPurpleSoft,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Row(
                children: [
                  Text('💬', style: TextStyle(fontSize: 24)),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '카카오톡 대화를 붙여넣으면\n관심도·온도·답장을 분석해드려요',
                      style: TextStyle(fontSize: 13, color: kText),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _textCtrl,
              maxLines: 6,
              decoration: const InputDecoration(
                hintText: '카카오톡 대화 내용을 붙여넣으세요...',
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _relation,
              decoration: const InputDecoration(hintText: '관계 선택'),
              items: _relationOptions.entries
                  .map((e) => DropdownMenuItem(
                        value: e.key,
                        child: Text(e.value,
                            style: const TextStyle(fontSize: 14)),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _relation = v ?? 'unknown'),
            ),
            const SizedBox(height: 16),
            GradientButton(
              label: _loading ? '분석 중...' : '카톡 분석하기 💬',
              onTap: _loading ? null : _analyze,
              isLoading: _loading,
            ),
            if (_result != null) ...[
              const SizedBox(height: 24),
              _buildResult(_result!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResult(Map<String, dynamic> r) {
    final score = r['score'] as int? ?? 50;
    final hearts = r['hearts'] as int? ?? 1;
    final tempLevel = r['tempLevel'] as int? ?? 2;
    final emotions = r['emotions'] as List? ?? [];
    final replies = r['replies'] as List? ?? [];
    final tip = r['tip'] as String? ?? '';

    const tempEmojis = ['🧊', '❄️', '🌡️', '🔥', '♨️'];
    final tempEmoji = tempEmojis.elementAtOrNull(tempLevel) ?? '🌡️';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('분석 결과',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        // 스코어 + 하트
        Row(
          children: [
            Expanded(
              child: _ScoreCard(
                  label: '관심도', value: '$score%', emoji: '💗'),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _ScoreCard(
                  label: '호감 하트',
                  value: '❤️' * hearts,
                  emoji: ''),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _ScoreCard(
                  label: '대화 온도',
                  value: tempEmoji,
                  emoji: ''),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // 온도 바
        TemperatureBar(
            value: score, label: '대화 온도'),
        const SizedBox(height: 12),
        // 감정
        if (emotions.isNotEmpty)
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: emotions
                .map((e) => Chip(
                      label: Text(e.toString()),
                      backgroundColor: kPurpleSoft,
                    ))
                .toList(),
          ),
        if (tip.isNotEmpty) ...[
          const SizedBox(height: 10),
          ResultCard(emoji: '📌', title: '헤아림 팁', content: tip),
        ],
        const SizedBox(height: 16),
        // 추천 답장
        if (replies.isNotEmpty) ...[
          const Text('추천 답장',
              style: TextStyle(
                  fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          ...replies.map((r) {
            final m = r as Map;
            return _KakaoReplyCard(
              style: m['style'] as String? ?? '',
              text: m['text'] as String? ?? '',
            );
          }),
        ],
      ],
    );
  }
}

class _ScoreCard extends StatelessWidget {
  final String label;
  final String value;
  final String emoji;

  const _ScoreCard({
    required this.label,
    required this.value,
    required this.emoji,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kPurpleSoft,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(value,
              style: const TextStyle(
                  fontSize: 18, fontWeight: FontWeight.w700, color: kPurple)),
          const SizedBox(height: 4),
          Text(label,
              style: const TextStyle(fontSize: 11, color: kTextSub)),
        ],
      ),
    );
  }
}

class _KakaoReplyCard extends StatelessWidget {
  final String style;
  final String text;

  const _KakaoReplyCard({required this.style, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kDivider),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: kPurpleSoft,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(style,
                style: const TextStyle(
                    fontSize: 11,
                    color: kPurple,
                    fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: const TextStyle(fontSize: 13, color: kText)),
          ),
        ],
      ),
    );
  }
}
