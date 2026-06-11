import 'package:flutter/material.dart';
import '../theme.dart';
import 'tools/translator_screen.dart';
import 'tools/kakao_screen.dart';
import 'tools/readcheck_screen.dart';
import 'tools/diagnosis_screen.dart';
import 'tools/reply_screen.dart';
import 'tools/coach_screen.dart';

class ToolsScreen extends StatelessWidget {
  const ToolsScreen({super.key});

  static final _tools = [
    _Tool(
      emoji: '🔍',
      title: '대화 번역기',
      subtitle: '상대 말의 진짜 속뜻',
      builder: (_) => const TranslatorScreen(),
    ),
    _Tool(
      emoji: '💬',
      title: '카톡 분석기',
      subtitle: '관심도 · 온도 · 답장 추천',
      builder: (_) => const KakaoScreen(),
    ),
    _Tool(
      emoji: '💊',
      title: '관계 진단',
      subtitle: '현재 단계와 발전 가능성',
      builder: (_) => const DiagnosisScreen(),
    ),
    _Tool(
      emoji: '📭',
      title: '읽씹 분석기',
      subtitle: '읽씹 후 확률 계산',
      builder: (_) => const ReadCheckScreen(),
    ),
    _Tool(
      emoji: '✍️',
      title: '답장 생성기',
      subtitle: '톤별 완성된 답장 4종',
      builder: (_) => const ReplyScreen(),
    ),
    _Tool(
      emoji: '🌱',
      title: '성장 코치',
      subtitle: '오늘의 관계 미션',
      builder: (_) => const CoachScreen(),
    ),
    _Tool(
      emoji: '🤖',
      title: 'AI 관계 진단',
      subtitle: '4가지 지표 심층 분석',
      builder: (_) => _PlaceholderScreen(title: 'AI 관계 진단'),
      comingSoon: false,
    ),
    _Tool(
      emoji: '📸',
      title: '대화 캡처 분석',
      subtitle: '이미지로 감정 분석',
      builder: (_) => _PlaceholderScreen(title: '대화 캡처 분석'),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('도구')),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tools.length,
        itemBuilder: (ctx, i) => _ToolTile(tool: _tools[i]),
      ),
    );
  }
}

class _Tool {
  final String emoji;
  final String title;
  final String subtitle;
  final Widget Function(BuildContext) builder;
  final bool comingSoon;

  const _Tool({
    required this.emoji,
    required this.title,
    required this.subtitle,
    required this.builder,
    this.comingSoon = false,
  });
}

class _ToolTile extends StatelessWidget {
  final _Tool tool;
  const _ToolTile({required this.tool});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: tool.builder),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kCard,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: kPurple.withOpacity(0.07),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: kPurpleSoft,
                borderRadius: BorderRadius.circular(14),
              ),
              alignment: Alignment.center,
              child: Text(tool.emoji,
                  style: const TextStyle(fontSize: 26)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tool.title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: kText,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    tool.subtitle,
                    style: const TextStyle(
                        fontSize: 12, color: kTextSub),
                  ),
                ],
              ),
            ),
            if (tool.comingSoon)
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: kPurpleSoft,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Soon',
                  style: TextStyle(fontSize: 10, color: kPurple),
                ),
              )
            else
              const Icon(
                Icons.chevron_right,
                color: kTextSub,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}

// ── 임시 플레이스홀더 ────────────────────────────────────────
class _PlaceholderScreen extends StatelessWidget {
  final String title;
  const _PlaceholderScreen({required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('🚧', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 16),
            Text(title,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            const Text(
              '곧 업데이트 예정이에요',
              style: TextStyle(fontSize: 14, color: kTextSub),
            ),
          ],
        ),
      ),
    );
  }
}
