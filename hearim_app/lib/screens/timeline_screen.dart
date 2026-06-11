import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../providers/app_provider.dart';
import '../models/person.dart';
import '../models/diary_entry.dart';

class TimelineScreen extends StatefulWidget {
  final Person person;
  const TimelineScreen({super.key, required this.person});

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
  List<TimelineEvent> _events = [];
  bool _loading = true;
  String _selectedType = 'positive';
  final _noteCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final events =
        await context.read<AppProvider>().loadTimeline(widget.person.id);
    setState(() {
      _events = events;
      _loading = false;
    });
  }

  int get _healthScore {
    if (_events.isEmpty) return 50;
    int pos = _events.where((e) => e.type == 'positive' || e.type == 'recovery' || e.type == 'milestone').length;
    int neg = _events.where((e) => e.type == 'negative' || e.type == 'contact_down').length;
    return (50 + (pos - neg) * 7).clamp(20, 98);
  }

  String get _healthLabel {
    final s = _healthScore;
    if (s >= 80) return '매우 건강한 관계 💗';
    if (s >= 60) return '안정적인 관계 😊';
    if (s >= 40) return '유지 중인 관계 🌤️';
    return '회복이 필요한 관계 🌱';
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.person;
    final rankColor = _rankColor(p.rank);
    return Scaffold(
      appBar: AppBar(
        title: Text('${p.emoji} ${p.name} 타임라인'),
        backgroundColor: kCard,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // 건강도 카드
                _HealthCard(
                  score: _healthScore,
                  label: _healthLabel,
                  rankColor: rankColor,
                ),
                const SizedBox(height: 16),
                // 이벤트 추가 폼
                _AddEventForm(
                  selectedType: _selectedType,
                  noteCtrl: _noteCtrl,
                  onTypeChanged: (t) => setState(() => _selectedType = t),
                  onSave: _addEvent,
                ),
                const SizedBox(height: 20),
                // 이벤트 목록
                if (_events.isEmpty)
                  const _EmptyTimeline()
                else
                  ..._events.map((e) => _EventItem(
                        event: e,
                        onDelete: () => _deleteEvent(e.id),
                      )),
              ],
            ),
    );
  }

  Future<void> _addEvent() async {
    final note = _noteCtrl.text.trim();
    if (note.isEmpty) return;
    final event = TimelineEvent(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      personId: widget.person.id,
      type: _selectedType,
      note: note,
      source: 'manual',
    );
    await context.read<AppProvider>().addTimelineEvent(event);
    _noteCtrl.clear();
    _load();
  }

  Future<void> _deleteEvent(String id) async {
    await context.read<AppProvider>().deleteTimelineEvent(id);
    _load();
  }

  Color _rankColor(String rank) {
    const colors = {
      'S': kPink,
      'A': kPurple,
      'B': Color(0xFF5B9BD5),
      'C': Color(0xFF81C784),
      'D': Color(0xFF90A4AE),
    };
    return colors[rank] ?? kPurple;
  }

  @override
  void dispose() {
    _noteCtrl.dispose();
    super.dispose();
  }
}

// ── 건강도 카드 ──────────────────────────────────────────────
class _HealthCard extends StatelessWidget {
  final int score;
  final String label;
  final Color rankColor;

  const _HealthCard({
    required this.score,
    required this.label,
    required this.rankColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [rankColor.withOpacity(0.8), rankColor],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('관계 건강도',
              style: TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                '$score',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Text(' / 100',
                  style: TextStyle(color: Colors.white54, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: score / 100,
              minHeight: 10,
              backgroundColor: Colors.white24,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
          const SizedBox(height: 10),
          Text(label,
              style:
                  const TextStyle(color: Colors.white, fontSize: 13)),
        ],
      ),
    );
  }
}

// ── 이벤트 추가 폼 ───────────────────────────────────────────
class _AddEventForm extends StatelessWidget {
  final String selectedType;
  final TextEditingController noteCtrl;
  final ValueChanged<String> onTypeChanged;
  final VoidCallback onSave;

  const _AddEventForm({
    required this.selectedType,
    required this.noteCtrl,
    required this.onTypeChanged,
    required this.onSave,
  });

  static const _types = [
    {'key': 'positive', 'emoji': '💗', 'label': '좋은 일'},
    {'key': 'neutral', 'emoji': '💬', 'label': '일상'},
    {'key': 'negative', 'emoji': '😔', 'label': '갈등'},
    {'key': 'milestone', 'emoji': '⭐', 'label': '특별'},
    {'key': 'contact_down', 'emoji': '📭', 'label': '연락감소'},
    {'key': 'recovery', 'emoji': '🌱', 'label': '회복'},
  ];

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
          const Text('이벤트 추가',
              style: TextStyle(
                  fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          // 타입 선택
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _types.map((t) {
              final sel = t['key'] == selectedType;
              return GestureDetector(
                onTap: () => onTypeChanged(t['key'] as String),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: sel ? kPurpleSoft : Colors.transparent,
                    border: Border.all(
                      color: sel ? kPurple : kDivider,
                      width: sel ? 1.5 : 1,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${t['emoji']} ${t['label']}',
                    style: TextStyle(
                      fontSize: 12,
                      color: sel ? kPurple : kTextSub,
                      fontWeight: sel
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          // 메모
          TextField(
            controller: noteCtrl,
            decoration: const InputDecoration(
              hintText: '어떤 일이 있었나요?',
            ),
            maxLines: 2,
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onSave,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
              child: const Text('기록하기'),
            ),
          ),
        ],
      ),
    );
  }
}

// ── 이벤트 아이템 ────────────────────────────────────────────
class _EventItem extends StatelessWidget {
  final TimelineEvent event;
  final VoidCallback onDelete;

  const _EventItem({required this.event, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final info = TimelineEvent.typeInfo[event.type] ??
        TimelineEvent.typeInfo['neutral']!;
    final color = Color(info['color'] as int);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 세로선 + 점
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 1.5),
                ),
                alignment: Alignment.center,
                child: Text(info['emoji'] as String,
                    style: const TextStyle(fontSize: 14)),
              ),
            ],
          ),
          const SizedBox(width: 12),
          // 내용
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kDivider),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        info['label'] as String,
                        style: TextStyle(
                          fontSize: 12,
                          color: color,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        _formatDate(event.date),
                        style: const TextStyle(
                            fontSize: 11, color: kTextSub),
                      ),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: onDelete,
                        child: const Icon(Icons.close,
                            size: 14, color: kTextSub),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(event.note,
                      style: const TextStyle(fontSize: 13, color: kText)),
                  if (event.source == 'diary')
                    const Text('📖 일기에서 자동 기록',
                        style: TextStyle(fontSize: 11, color: kTextSub)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime d) {
    final now = DateTime.now();
    final diff = now.difference(d).inDays;
    if (diff == 0) return '오늘';
    if (diff == 1) return '어제';
    if (diff < 7) return '$diff일 전';
    return '${d.month}/${d.day}';
  }
}

class _EmptyTimeline extends StatelessWidget {
  const _EmptyTimeline();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Column(
          children: [
            Text('🕰️', style: TextStyle(fontSize: 48)),
            SizedBox(height: 12),
            Text(
              '아직 기록된 이벤트가 없어요',
              style: TextStyle(fontSize: 14, color: kTextSub),
            ),
            SizedBox(height: 6),
            Text(
              '위에서 이벤트를 추가해보세요',
              style: TextStyle(fontSize: 12, color: kTextSub),
            ),
          ],
        ),
      ),
    );
  }
}
