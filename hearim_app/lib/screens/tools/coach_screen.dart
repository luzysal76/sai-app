import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme.dart';
import '../../providers/app_provider.dart';
import '../../models/person.dart';

class CoachScreen extends StatelessWidget {
  const CoachScreen({super.key});

  static const _missions = {
    'lover': [
      '💗 "오늘 어땠어?"라고 먼저 물어보기',
      '😊 상대의 좋은 점 하나를 칭찬하기',
      '📅 이번 주 데이트 계획 제안하기',
      '🥰 "보고 싶어"라고 솔직하게 말하기',
      '🎁 깜짝 선물 또는 서프라이즈 계획하기',
    ],
    'some': [
      '✨ 먼저 연락 한번 해보기',
      '☕ 커피 한 잔 같이 하자고 제안하기',
      '😊 상대의 SNS에 진심 어린 댓글 달기',
      '🎵 "이 노래 들을 때 생각났어"라고 말하기',
      '🌟 상대의 장점을 솔직하게 표현해보기',
    ],
    'friend': [
      '📞 오랫동안 연락 못 한 친구에게 안부 전하기',
      '😂 재미있는 밈이나 영상 공유하기',
      '🍕 같이 식사하자고 먼저 제안하기',
      '💪 친구의 힘든 일에 응원 메시지 보내기',
      '🎉 친구의 작은 성취도 함께 축하해주기',
    ],
    'family': [
      '📞 오늘 전화 한 통 드리기',
      '🙏 감사하다는 말 한마디 전하기',
      '🍚 같이 밥 먹는 시간 만들기',
      '👂 가족의 고민을 끝까지 들어주기',
      '💌 짧은 안부 문자 보내기',
    ],
    'work': [
      '😊 동료에게 감사 표현하기',
      '🤝 팀원의 성과를 인정해주기',
      '☕ 같이 커피 한 잔 하자고 제안하기',
      '💬 업무 외 가벼운 대화 나눠보기',
      '👍 동료의 좋은 아이디어 칭찬하기',
    ],
  };

  List<String> _getMissions(Person p) {
    final all = _missions[p.relation] ?? _missions['friend']!;
    return all.take(3).toList();
  }

  @override
  Widget build(BuildContext context) {
    final persons = context.watch<AppProvider>().persons;
    return Scaffold(
      appBar: AppBar(title: const Text('성장 코치')),
      body: persons.isEmpty
          ? const _EmptyState()
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: kPurpleSoft,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Text(
                    '🌱 오늘의 관계 미션을 완수하고\n관계를 한 단계 성장시켜보세요',
                    style: TextStyle(fontSize: 13, color: kText),
                  ),
                ),
                const SizedBox(height: 20),
                ...persons.map((p) => _PersonMissionCard(
                      person: p,
                      missions: _getMissions(p),
                    )),
              ],
            ),
    );
  }
}

class _PersonMissionCard extends StatefulWidget {
  final Person person;
  final List<String> missions;

  const _PersonMissionCard({
    required this.person,
    required this.missions,
  });

  @override
  State<_PersonMissionCard> createState() => _PersonMissionCardState();
}

class _PersonMissionCardState extends State<_PersonMissionCard> {
  final Set<int> _done = {};

  @override
  Widget build(BuildContext context) {
    final p = widget.person;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: kDivider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(p.emoji, style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p.name,
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w700)),
                  Text(p.relationLabel,
                      style: const TextStyle(
                          fontSize: 12, color: kTextSub)),
                ],
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: kPurpleSoft,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${_done.length}/${widget.missions.length}',
                  style: const TextStyle(
                      fontSize: 12,
                      color: kPurple,
                      fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...widget.missions.asMap().entries.map((e) {
            final i = e.key;
            final m = e.value;
            final done = _done.contains(i);
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (done) _done.remove(i);
                  else _done.add(i);
                });
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: done
                      ? kPurpleSoft
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: done ? kPurple.withOpacity(0.3) : kDivider,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      done
                          ? Icons.check_circle
                          : Icons.circle_outlined,
                      color: done ? kPurple : kTextSub,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        m,
                        style: TextStyle(
                          fontSize: 13,
                          color: done ? kPurple : kText,
                          decoration:
                              done ? TextDecoration.lineThrough : null,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          if (_done.length == widget.missions.length)
            Container(
              margin: const EdgeInsets.only(top: 4),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: kGradient,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('🎉',
                      style: TextStyle(fontSize: 16)),
                  SizedBox(width: 8),
                  Text(
                    '오늘 미션 완료!',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('🌱', style: TextStyle(fontSize: 64)),
          SizedBox(height: 16),
          Text('먼저 관계지도에 인물을 추가해주세요',
              style: TextStyle(fontSize: 14, color: kTextSub)),
        ],
      ),
    );
  }
}
