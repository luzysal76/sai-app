import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../services/engine.dart';
import '../../widgets/gradient_button.dart';

class DiagnosisScreen extends StatefulWidget {
  const DiagnosisScreen({super.key});

  @override
  State<DiagnosisScreen> createState() => _DiagnosisScreenState();
}

class _DiagnosisScreenState extends State<DiagnosisScreen> {
  int _q1 = 3, _q2 = 3, _q3 = 3;
  String _relation = 'unknown';
  Map<String, dynamic>? _result;
  final _engine = HearimEngine();

  static const _scaleLabels = [
    '', '전혀 아님', '아닌 편', '보통', '그런 편', '매우 그렇다'
  ];

  void _diagnose() {
    setState(() {
      _result = _engine.diagRelationLocal(
          q1: _q1, q2: _q2, q3: _q3, relation: _relation);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('관계 진단')),
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
                '💊 3가지 질문으로 현재 관계 단계와\n발전 가능성을 진단해드려요',
                style: TextStyle(fontSize: 13, color: kText),
              ),
            ),
            const SizedBox(height: 24),
            _QuestionCard(
              question: '요즘 얼마나 자주 대화하나요?',
              value: _q1,
              onChanged: (v) => setState(() => _q1 = v),
              labels: _scaleLabels,
            ),
            const SizedBox(height: 16),
            _QuestionCard(
              question: '상대가 내 감정을 잘 이해해준다고 느끼나요?',
              value: _q2,
              onChanged: (v) => setState(() => _q2 = v),
              labels: _scaleLabels,
            ),
            const SizedBox(height: 16),
            _QuestionCard(
              question: '이 관계가 발전하기를 기대하나요?',
              value: _q3,
              onChanged: (v) => setState(() => _q3 = v),
              labels: _scaleLabels,
            ),
            const SizedBox(height: 24),
            GradientButton(
              label: '관계 진단하기 💊',
              onTap: _diagnose,
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
    final stage = r['stage'] as String;
    final possibility = r['possibility'] as String;
    final temp = r['temp'] as int;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('진단 결과',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: kGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    const Text('현재 단계',
                        style: TextStyle(color: Colors.white70, fontSize: 11)),
                    const SizedBox(height: 6),
                    Text(stage,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: kPurpleSoft,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    const Text('발전 가능성',
                        style:
                            TextStyle(color: kTextSub, fontSize: 11)),
                    const SizedBox(height: 6),
                    Text(possibility,
                        style: const TextStyle(
                            color: kPurple,
                            fontSize: 18,
                            fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TemperatureBar(value: temp, label: '관계 온도'),
        const SizedBox(height: 12),
        ResultCard(
          emoji: '💡',
          title: '조언',
          content: _advice(stage),
        ),
      ],
    );
  }

  String _advice(String stage) {
    switch (stage) {
      case '발전 단계':
        return '관계가 활발하게 성장 중이에요! 지금처럼 꾸준히 관심과 표현을 이어가세요.';
      case '유지 단계':
        return '안정적인 관계예요. 새로운 활동이나 경험을 함께해보면 더 깊어질 수 있어요.';
      case '정체 단계':
        return '관계에 변화가 필요한 시점이에요. 솔직한 대화나 특별한 경험을 시도해보세요.';
      default:
        return '관계 회복을 위한 진심 어린 대화가 필요해요. 상대의 입장을 먼저 이해해보세요.';
    }
  }
}

class _QuestionCard extends StatelessWidget {
  final String question;
  final int value;
  final ValueChanged<int> onChanged;
  final List<String> labels;

  const _QuestionCard({
    required this.question,
    required this.value,
    required this.onChanged,
    required this.labels,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kDivider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            question,
            style: const TextStyle(
                fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: List.generate(5, (i) {
              final v = i + 1;
              final sel = v == value;
              return GestureDetector(
                onTap: () => onChanged(v),
                child: Column(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: sel ? kPurple : kPurpleSoft,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '$v',
                        style: TextStyle(
                          color: sel ? Colors.white : kPurple,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    SizedBox(
                      width: 50,
                      child: Text(
                        labels.elementAtOrNull(v) ?? '',
                        style: const TextStyle(
                            fontSize: 9, color: kTextSub),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
