import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme.dart';
import '../../services/engine.dart';
import '../../services/api_service.dart';
import '../../widgets/gradient_button.dart';

class TranslatorScreen extends StatefulWidget {
  const TranslatorScreen({super.key});

  @override
  State<TranslatorScreen> createState() => _TranslatorScreenState();
}

class _TranslatorScreenState extends State<TranslatorScreen> {
  final _textCtrl = TextEditingController();
  String _relation = 'unknown';
  bool _loading = false;
  _TranslateResult? _result;
  final _engine = HearimEngine();
  final _api = ApiService();

  static const _relationOptions = {
    'unknown': '❓ 선택 안 함',
    'lover': '💑 연인',
    'some': '💕 썸',
    'friend': '👫 친구',
    'family': '👨‍👩‍👧 가족',
    'work': '💼 직장',
  };

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  Future<void> _translate() async {
    final text = _textCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _loading = true;
      _result = null;
    });

    // 1. DB 매칭
    final dbResult = _engine.interpret(text, relation: _relation);
    if (dbResult != null) {
      setState(() {
        _result = _TranslateResult.fromEngine(dbResult);
        _loading = false;
      });
      return;
    }

    // 2. API 폴백
    final apiResult =
        await _api.translate(text: text, relation: _relation);
    if (apiResult != null) {
      setState(() {
        _result = _TranslateResult.fromApi(apiResult);
        _loading = false;
      });
    } else {
      // 3. 기본 응답
      setState(() {
        _result = _TranslateResult.fallback(text);
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('대화 번역기')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 20),
            _buildInput(),
            const SizedBox(height: 12),
            _buildRelationPicker(),
            const SizedBox(height: 16),
            GradientButton(
              label: _loading ? '분석 중...' : '속뜻 번역하기 🔍',
              onTap: _loading ? null : _translate,
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

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kPurpleSoft,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Text('🔍', style: TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '대화 번역기',
                  style: TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w700),
                ),
                Text(
                  '상대 말의 진짜 속뜻을 해석해드려요',
                  style: TextStyle(fontSize: 12, color: kTextSub),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInput() {
    return TextField(
      controller: _textCtrl,
      maxLines: 4,
      decoration: const InputDecoration(
        hintText: '상대가 한 말을 입력하세요\n예: "괜찮아", "아무것도 아니야", "보고싶어"...',
      ),
    );
  }

  Widget _buildRelationPicker() {
    return DropdownButtonFormField<String>(
      value: _relation,
      decoration: const InputDecoration(hintText: '관계 선택 (선택사항)'),
      items: _relationOptions.entries
          .map((e) => DropdownMenuItem(
                value: e.key,
                child: Text(e.value,
                    style: const TextStyle(fontSize: 14)),
              ))
          .toList(),
      onChanged: (v) => setState(() => _relation = v ?? 'unknown'),
    );
  }

  Widget _buildResult(_TranslateResult r) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '해석 결과',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        // 표면의미 / 숨은 의미
        ResultCard(
          emoji: '💬',
          title: '표면의 의미',
          content: r.surface,
        ),
        const SizedBox(height: 8),
        ResultCard(
          emoji: '🔮',
          title: '숨은 의미',
          content: r.hidden,
          color: kPink.withOpacity(0.1),
        ),
        const SizedBox(height: 8),
        // 감정
        if (r.emotions.isNotEmpty)
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: r.emotions
                .map((e) => Chip(label: Text(e)))
                .toList(),
          ),
        const SizedBox(height: 8),
        // 가능성
        if (r.possibilities.isNotEmpty)
          _PossibilityBar(possibilities: r.possibilities),
        const SizedBox(height: 8),
        // 추천 행동
        ResultCard(
          emoji: '💡',
          title: '추천 행동',
          content: r.action,
          color: Colors.amber.withOpacity(0.1),
        ),
        const SizedBox(height: 8),
        // 팁
        if (r.tip.isNotEmpty)
          ResultCard(
            emoji: '📌',
            title: '헤아림 팁',
            content: r.tip,
            color: Colors.green.withOpacity(0.08),
          ),
        const SizedBox(height: 16),
        // 답장 스타일
        if (r.replies.isNotEmpty) ...[
          const Text(
            '추천 답장',
            style: TextStyle(
                fontSize: 15, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          ...r.replies.map((rep) => _ReplyCard(reply: rep)),
        ],
        if (r.fromAI)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              '🤖 AI 분석 결과',
              style: TextStyle(
                  fontSize: 11,
                  color: kPurple.withOpacity(0.7)),
            ),
          ),
      ],
    );
  }
}

// ── 가능성 바 ─────────────────────────────────────────────────
class _PossibilityBar extends StatelessWidget {
  final List<Map<String, dynamic>> possibilities;
  const _PossibilityBar({required this.possibilities});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kPurpleSoft,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: possibilities
            .map((p) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 100,
                        child: Text(
                          p['label'] as String,
                          style: const TextStyle(
                              fontSize: 12, color: kTextSub),
                        ),
                      ),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: (p['pct'] as int) / 100,
                            minHeight: 8,
                            backgroundColor: kDivider,
                            valueColor: const AlwaysStoppedAnimation<
                                Color>(kPurple),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('${p['pct']}%',
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: kPurple)),
                    ],
                  ),
                ))
            .toList(),
      ),
    );
  }
}

// ── 답장 카드 ─────────────────────────────────────────────────
class _ReplyCard extends StatelessWidget {
  final Map<String, String> reply;
  const _ReplyCard({required this.reply});

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
            padding: const EdgeInsets.symmetric(
                horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: kPurpleSoft,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              reply['style'] ?? '',
              style: const TextStyle(
                  fontSize: 11,
                  color: kPurple,
                  fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              reply['text'] ?? '',
              style: const TextStyle(fontSize: 13, color: kText),
            ),
          ),
          GestureDetector(
            onTap: () {
              Clipboard.setData(
                  ClipboardData(text: reply['text'] ?? ''));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('복사됨'),
                  duration: Duration(seconds: 1),
                ),
              );
            },
            child: const Icon(Icons.copy, size: 16, color: kTextSub),
          ),
        ],
      ),
    );
  }
}

// ── 결과 데이터 클래스 ────────────────────────────────────────
class _TranslateResult {
  final String surface;
  final String hidden;
  final List<Map<String, dynamic>> possibilities;
  final List<String> emotions;
  final String action;
  final List<Map<String, String>> replies;
  final String tip;
  final bool fromAI;

  const _TranslateResult({
    required this.surface,
    required this.hidden,
    required this.possibilities,
    required this.emotions,
    required this.action,
    required this.replies,
    required this.tip,
    this.fromAI = false,
  });

  factory _TranslateResult.fromEngine(TranslateResult r) {
    return _TranslateResult(
      surface: r.surface,
      hidden: r.hidden,
      possibilities: r.possibilities,
      emotions: r.emotions,
      action: r.action,
      replies: r.replies,
      tip: r.tip,
    );
  }

  factory _TranslateResult.fromApi(Map<String, dynamic> data) {
    return _TranslateResult(
      surface: data['surface'] as String? ?? '',
      hidden: data['hidden'] as String? ?? '',
      possibilities: (data['possibilities'] as List?)
              ?.map((p) => {
                    'label': p['label'] as String? ?? '',
                    'pct': p['pct'] as int? ?? 0,
                  })
              .toList() ??
          [],
      emotions: (data['emotions'] as List?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      action: data['action'] as String? ?? '',
      replies: (data['replies'] as List?)
              ?.map((r) => {
                    'style': r['style'] as String? ?? '',
                    'text': r['text'] as String? ?? '',
                  })
              .toList() ??
          [],
      tip: data['tip'] as String? ?? '',
      fromAI: true,
    );
  }

  factory _TranslateResult.fallback(String text) {
    return _TranslateResult(
      surface: text,
      hidden: '표현의 맥락에 따라 다양한 의미일 수 있어요. 상대와 직접 이야기해보세요.',
      possibilities: [
        {'label': '진심 표현', 'pct': 50},
        {'label': '감정 회피', 'pct': 30},
        {'label': '기타', 'pct': 20},
      ],
      emotions: ['🤔 분석 필요'],
      action: '상대에게 더 구체적으로 물어보거나 직접 대화해보세요.',
      replies: [
        {'style': '공감', 'text': '그랬구나. 좀 더 얘기해줄 수 있어?'},
        {'style': '다정', 'text': '그 말 들으니까 궁금한 게 생겼어. 어떤 의미야? :)'},
      ],
      tip: '직접 물어보는 것이 가장 정확한 해석이에요.',
    );
  }
}
