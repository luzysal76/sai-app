import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../services/engine.dart';
import '../../widgets/gradient_button.dart';

class ReadCheckScreen extends StatefulWidget {
  const ReadCheckScreen({super.key});

  @override
  State<ReadCheckScreen> createState() => _ReadCheckScreenState();
}

class _ReadCheckScreenState extends State<ReadCheckScreen> {
  int _hours = 3;
  bool _analyzed = false;
  final _engine = HearimEngine();

  @override
  Widget build(BuildContext context) {
    final temp = _engine.readCheckTemp(_hours);
    final label = _engine.readCheckLabel(_hours);

    return Scaffold(
      appBar: AppBar(title: const Text('읽씹 분석기')),
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
                  Text('📭', style: TextStyle(fontSize: 24)),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '읽씹 후 경과 시간을 선택하면\n관심도와 가능성을 분석해드려요',
                      style: TextStyle(fontSize: 13, color: kText),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('읽씹 후 경과 시간',
                style: TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            _TimeSelector(
              selected: _hours,
              onChanged: (h) {
                setState(() {
                  _hours = h;
                  _analyzed = true;
                });
              },
            ),
            const SizedBox(height: 16),
            GradientButton(
              label: '분석하기 📭',
              onTap: () => setState(() => _analyzed = true),
            ),
            if (_analyzed) ...[
              const SizedBox(height: 24),
              const Text('분석 결과',
                  style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              TemperatureBar(value: temp, label: '관심 온도'),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: kPurpleSoft,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: kText),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _buildAdvice(_hours),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAdvice(int hours) {
    String emoji, title, content;
    if (hours <= 3) {
      emoji = '💗';
      title = '아직 여유 있어요';
      content = '바쁠 수 있어요. 조금 더 기다려보세요.';
    } else if (hours <= 12) {
      emoji = '🤔';
      title = '슬슬 확인이 필요해요';
      content = '가볍게 다른 주제로 한 번 더 말을 걸어보는 것도 좋아요.';
    } else if (hours <= 24) {
      emoji = '😔';
      title = '관심 감소 가능성';
      content = '직접적인 질문보다 가벼운 일상 메시지가 효과적이에요.';
    } else {
      emoji = '⚠️';
      title = '관계 점검이 필요해요';
      content = '강요하기보다 자연스럽게 접근하거나, 오프라인 만남을 제안해보세요.';
    }

    return ResultCard(
        emoji: emoji, title: title, content: content);
  }
}

class _TimeSelector extends StatelessWidget {
  final int selected;
  final ValueChanged<int> onChanged;

  const _TimeSelector({
    required this.selected,
    required this.onChanged,
  });

  static const _options = [
    {'label': '1시간', 'value': 1},
    {'label': '3시간', 'value': 3},
    {'label': '6시간', 'value': 6},
    {'label': '12시간', 'value': 12},
    {'label': '24시간', 'value': 24},
    {'label': '48시간', 'value': 48},
    {'label': '72시간+', 'value': 72},
  ];

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _options.map((o) {
        final val = o['value'] as int;
        final sel = val == selected;
        return GestureDetector(
          onTap: () => onChanged(val),
          child: Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: sel ? kPurple : kCard,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: sel ? kPurple : kDivider,
                  width: sel ? 0 : 1),
              boxShadow: sel
                  ? [
                      BoxShadow(
                        color: kPurple.withOpacity(0.3),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      )
                    ]
                  : null,
            ),
            child: Text(
              o['label'] as String,
              style: TextStyle(
                fontSize: 13,
                color: sel ? Colors.white : kTextSub,
                fontWeight: sel ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
