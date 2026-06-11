import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../providers/app_provider.dart';
import '../models/person.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            _buildAppBar(context),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  const SizedBox(height: 8),
                  _TodayReportCard(),
                  const SizedBox(height: 20),
                  _QuickGridTitle(),
                  const SizedBox(height: 12),
                  _QuickGrid(),
                  const SizedBox(height: 30),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  SliverAppBar _buildAppBar(BuildContext context) {
    return SliverAppBar(
      pinned: true,
      backgroundColor: kCard,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          alignment: Alignment.centerLeft,
          child: Row(
            children: [
              ShaderMask(
                shaderCallback: (bounds) =>
                    kGradient.createShader(bounds),
                child: const Text('💌 헤아림',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    )),
              ),
              const Spacer(),
              Text('연애·관계 번역기',
                  style: TextStyle(fontSize: 12, color: kTextSub)),
            ],
          ),
        ),
      ),
      expandedHeight: 60,
    );
  }
}

// ── 오늘의 관계 리포트 카드 ────────────────────────────────
class _TodayReportCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final persons = provider.persons;
    final avgTemp = _calcAvgTemp(persons);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: kGradientCard,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: kPurple.withOpacity(0.25),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('📊',
                  style: TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              const Text('오늘의 관계 리포트',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _StatItem(
                label: '관계 온도',
                value: '$avgTemp°',
                icon: '🌡️',
              ),
              const SizedBox(width: 16),
              _StatItem(
                label: '등록 인물',
                value: '${persons.length}명',
                icon: '👥',
              ),
              const SizedBox(width: 16),
              _StatItem(
                label: 'S등급',
                value:
                    '${persons.where((p) => p.rank == 'S').length}명',
                icon: '⭐',
              ),
            ],
          ),
          if (persons.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Divider(color: Colors.white24, height: 1),
            const SizedBox(height: 12),
            Text(
              _getTodayMission(persons),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ] else ...[
            const SizedBox(height: 12),
            const Text(
              '관계지도에 인물을 추가하면\n오늘의 미션을 받을 수 있어요 💌',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
          ],
        ],
      ),
    );
  }

  int _calcAvgTemp(List<Person> persons) {
    if (persons.isEmpty) return 50;
    final avg =
        persons.fold(0, (sum, p) => sum + p.rankScore) / persons.length;
    return avg.round();
  }

  String _getTodayMission(List<Person> persons) {
    final missions = <String>[];
    for (final p in persons.take(2)) {
      switch (p.relation) {
        case 'lover':
          missions.add('💗 ${p.name}에게 "오늘 어땠어?" 물어보기');
          break;
        case 'some':
          missions.add('✨ ${p.name}에게 먼저 연락해보기');
          break;
        case 'friend':
          missions.add('😊 ${p.name}에게 칭찬 한 마디 건네기');
          break;
        default:
          missions.add('💬 ${p.name}에게 감사 표현하기');
      }
    }
    return missions.join('\n');
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final String icon;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── 빠른 기능 그리드 ─────────────────────────────────────────
class _QuickGridTitle extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Text(
      '빠른 기능',
      style: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: kText,
      ),
    );
  }
}

class _QuickGrid extends StatelessWidget {
  static const _items = [
    {'icon': '🔍', 'label': '대화 번역기', 'route': '/translator'},
    {'icon': '💬', 'label': '카톡 분석기', 'route': '/kakao'},
    {'icon': '💊', 'label': '관계 진단', 'route': '/diagnosis'},
    {'icon': '📭', 'label': '읽씹 분석', 'route': '/readcheck'},
    {'icon': '✍️', 'label': '답장 생성기', 'route': '/reply'},
    {'icon': '🌱', 'label': '성장 코치', 'route': '/coach'},
    {'icon': '🤖', 'label': 'AI 진단', 'route': '/aidiag'},
    {'icon': '📸', 'label': '캡처 분석', 'route': '/capture'},
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.1,
      ),
      itemCount: _items.length,
      itemBuilder: (context, i) {
        final item = _items[i];
        return GestureDetector(
          onTap: () => Navigator.pushNamed(
              context, item['route'] as String),
          child: Container(
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: kPurple.withOpacity(0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(item['icon'] as String,
                    style: const TextStyle(fontSize: 28)),
                const SizedBox(height: 6),
                Text(
                  item['label'] as String,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: kText,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
