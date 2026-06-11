import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme.dart';
import '../../services/engine.dart';
import '../../widgets/gradient_button.dart';

class ReplyScreen extends StatefulWidget {
  const ReplyScreen({super.key});

  @override
  State<ReplyScreen> createState() => _ReplyScreenState();
}

class _ReplyScreenState extends State<ReplyScreen> {
  final _textCtrl = TextEditingController();
  String _relation = 'unknown';
  bool _loading = false;
  List<Map<String, String>> _replies = [];
  final _engine = HearimEngine();

  Future<void> _generate() async {
    final text = _textCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() { _loading = true; _replies = []; });

    // DB에서 매칭 답장 먼저 시도
    final dbResult = _engine.interpret(text, relation: _relation);
    if (dbResult != null && dbResult.replies.isNotEmpty) {
      setState(() {
        _replies = dbResult.replies;
        _loading = false;
      });
      return;
    }

    // 기본 답장 생성
    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      _replies = [
        {'style': '공감', 'text': '그랬구나. 힘들었겠다ㅠ 더 얘기해줄 수 있어?'},
        {'style': '다정', 'text': '그렇구나 :) 나한테 말해줘서 고마워'},
        {'style': '유머', 'text': '오 진짜? ㅋㅋ 어떻게 됐어?'},
        {'style': '썸', 'text': '그랬어? 나도 비슷한 생각이야 :)'},
      ];
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('답장 생성기')),
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
              child: const Text(
                '✍️ 상대 메시지를 입력하면\n공감·다정·유머·썸 4가지 스타일의 답장을 만들어드려요',
                style: TextStyle(fontSize: 13, color: kText),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _textCtrl,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: '상대방이 보낸 메시지를 입력하세요...',
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _relation,
              decoration: const InputDecoration(hintText: '관계 선택'),
              items: const [
                DropdownMenuItem(value: 'unknown', child: Text('❓ 선택 안 함')),
                DropdownMenuItem(value: 'lover', child: Text('💑 연인')),
                DropdownMenuItem(value: 'some', child: Text('💕 썸')),
                DropdownMenuItem(value: 'friend', child: Text('👫 친구')),
                DropdownMenuItem(value: 'family', child: Text('👨‍👩‍👧 가족')),
                DropdownMenuItem(value: 'work', child: Text('💼 직장')),
              ],
              onChanged: (v) => setState(() => _relation = v ?? 'unknown'),
            ),
            const SizedBox(height: 16),
            GradientButton(
              label: _loading ? '생성 중...' : '답장 생성하기 ✍️',
              onTap: _loading ? null : _generate,
              isLoading: _loading,
            ),
            if (_replies.isNotEmpty) ...[
              const SizedBox(height: 24),
              const Text('추천 답장',
                  style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              ..._replies.map((r) => _ReplyCard(
                    style: r['style'] ?? '',
                    text: r['text'] ?? '',
                  )),
            ],
          ],
        ),
      ),
    );
  }
}

class _ReplyCard extends StatefulWidget {
  final String style;
  final String text;

  const _ReplyCard({required this.style, required this.text});

  @override
  State<_ReplyCard> createState() => _ReplyCardState();
}

class _ReplyCardState extends State<_ReplyCard> {
  bool _copied = false;

  static const _styleColors = {
    '공감': kPurple,
    '다정': kPink,
    '유머': Color(0xFF4CAF50),
    '썸': Color(0xFFFF9800),
  };

  @override
  Widget build(BuildContext context) {
    final color = _styleColors[widget.style] ?? kPurple;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    widget.style,
                    style: TextStyle(
                      fontSize: 12,
                      color: color,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Text(
              widget.text,
              style: const TextStyle(
                  fontSize: 15, color: kText, height: 1.5),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
            child: GestureDetector(
              onTap: () {
                Clipboard.setData(ClipboardData(text: widget.text));
                setState(() => _copied = true);
                Future.delayed(const Duration(seconds: 2),
                    () => setState(() => _copied = false));
              },
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _copied ? Icons.check : Icons.copy,
                    size: 14,
                    color: _copied ? Colors.green : kTextSub,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _copied ? '복사됨!' : '복사',
                    style: TextStyle(
                      fontSize: 12,
                      color: _copied ? Colors.green : kTextSub,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
