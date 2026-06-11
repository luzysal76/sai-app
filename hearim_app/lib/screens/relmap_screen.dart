import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../providers/app_provider.dart';
import '../models/person.dart';
import '../models/diary_entry.dart';
import '../services/storage_service.dart';
import 'timeline_screen.dart';

class RelMapScreen extends StatelessWidget {
  const RelMapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final persons = context.watch<AppProvider>().persons;
    return Scaffold(
      appBar: AppBar(
        title: const Text('관계지도'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showPersonSheet(context, null),
          ),
        ],
      ),
      body: persons.isEmpty
          ? _EmptyState(onAdd: () => _showPersonSheet(context, null))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: persons.length,
              itemBuilder: (ctx, i) => _PersonCard(
                person: persons[i],
                onEdit: () => _showPersonSheet(ctx, persons[i]),
                onDelete: () => _confirmDelete(ctx, persons[i]),
                onTimeline: () => Navigator.push(
                  ctx,
                  MaterialPageRoute(
                    builder: (_) => TimelineScreen(person: persons[i]),
                  ),
                ),
              ),
            ),
      floatingActionButton: persons.isNotEmpty
          ? FloatingActionButton(
              onPressed: () => _showPersonSheet(context, null),
              backgroundColor: kPurple,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
    );
  }

  void _showPersonSheet(BuildContext ctx, Person? existing) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PersonForm(existing: existing),
    );
  }

  void _confirmDelete(BuildContext ctx, Person p) {
    showDialog(
      context: ctx,
      builder: (_) => AlertDialog(
        title: Text('${p.name} 삭제'),
        content: const Text('인물과 관련 타임라인이 모두 삭제됩니다.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('취소')),
          TextButton(
            onPressed: () {
              ctx.read<AppProvider>().deletePerson(p.id);
              Navigator.pop(ctx);
            },
            child: const Text('삭제', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

// ── 인물 카드 ─────────────────────────────────────────────────
class _PersonCard extends StatelessWidget {
  final Person person;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onTimeline;

  const _PersonCard({
    required this.person,
    required this.onEdit,
    required this.onDelete,
    required this.onTimeline,
  });

  static const _rankColors = {
    'S': Color(0xFFFF6B9D),
    'A': Color(0xFF6B4EAA),
    'B': Color(0xFF5B9BD5),
    'C': Color(0xFF81C784),
    'D': Color(0xFF90A4AE),
  };

  @override
  Widget build(BuildContext context) {
    final rankColor = _rankColors[person.rank] ?? kPurple;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: rankColor.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: rankColor.withOpacity(0.12),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              // 이모지 + 등급
              Stack(
                clipBehavior: Clip.none,
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: rankColor.withOpacity(0.15),
                    child: Text(person.emoji,
                        style: const TextStyle(fontSize: 26)),
                  ),
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: rankColor,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        person.rank,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              // 이름 + 관계
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(person.name,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
                    Text(
                      '${person.relationLabel} · ${person.frequencyLabel}',
                      style: const TextStyle(fontSize: 12, color: kTextSub),
                    ),
                  ],
                ),
              ),
              // 메뉴
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, color: kTextSub),
                onSelected: (v) {
                  if (v == 'edit') onEdit();
                  if (v == 'delete') onDelete();
                  if (v == 'timeline') onTimeline();
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(
                      value: 'timeline', child: Text('타임라인 보기')),
                  const PopupMenuItem(value: 'edit', child: Text('편집')),
                  const PopupMenuItem(
                      value: 'delete',
                      child: Text('삭제',
                          style: TextStyle(color: Colors.red))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          // 지표 바
          _BarRow(
              label: '친밀도', value: person.intimacy, color: rankColor),
          const SizedBox(height: 8),
          _BarRow(
              label: '대화량',
              value: (person.frequency / 4 * 100).round(),
              color: kPink),
          const SizedBox(height: 8),
          _BarRow(
              label: '갈등 수준',
              value: (person.conflict / 4 * 100).round(),
              color: Colors.redAccent),
          const SizedBox(height: 12),
          // 버튼
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onTimeline,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: rankColor,
                    side: BorderSide(color: rankColor.withOpacity(0.5)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: const Text('타임라인', style: TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: onEdit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: rankColor,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                  child: const Text('편집',
                      style: TextStyle(fontSize: 13, color: Colors.white)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BarRow extends StatelessWidget {
  final String label;
  final int value;
  final Color color;

  const _BarRow({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 52,
          child: Text(label,
              style: const TextStyle(fontSize: 11, color: kTextSub)),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: value / 100,
              minHeight: 6,
              backgroundColor: kDivider,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text('$value',
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: color)),
      ],
    );
  }
}

// ── 인물 추가/편집 폼 ──────────────────────────────────────────
class _PersonForm extends StatefulWidget {
  final Person? existing;
  const _PersonForm({this.existing});

  @override
  State<_PersonForm> createState() => _PersonFormState();
}

class _PersonFormState extends State<_PersonForm> {
  late final TextEditingController _name;
  String _relation = 'friend';
  String _emoji = '👤';
  double _intimacy = 50;
  int _frequency = 2;
  int _conflict = 1;

  static const _emojis = [
    '👤', '👩', '👨', '👧', '👦', '💑', '👫', '🧑', '🧔', '👩‍💼',
    '🐱', '🐶', '🌹', '⭐', '💎', '🌟', '🦋', '🎯', '🌸', '🔥',
  ];

  @override
  void initState() {
    super.initState();
    final p = widget.existing;
    _name = TextEditingController(text: p?.name ?? '');
    if (p != null) {
      _relation = p.relation;
      _emoji = p.emoji;
      _intimacy = p.intimacy.toDouble();
      _frequency = p.frequency;
      _conflict = p.conflict;
    }
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 24, right: 24, top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color: kDivider,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              widget.existing == null ? '인물 추가' : '인물 편집',
              style: const TextStyle(
                  fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 20),
            // 이름
            TextField(
              controller: _name,
              decoration: const InputDecoration(hintText: '이름을 입력하세요'),
            ),
            const SizedBox(height: 16),
            // 관계
            const Text('관계 유형',
                style: TextStyle(fontSize: 13, color: kTextSub)),
            const SizedBox(height: 8),
            _RelationSelector(
              value: _relation,
              onChanged: (v) => setState(() => _relation = v),
            ),
            const SizedBox(height: 16),
            // 이모지
            const Text('대표 이모지',
                style: TextStyle(fontSize: 13, color: kTextSub)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _emojis.map((e) {
                final sel = e == _emoji;
                return GestureDetector(
                  onTap: () => setState(() => _emoji = e),
                  child: Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: sel ? kPurpleSoft : Colors.transparent,
                      border: Border.all(
                        color: sel ? kPurple : kDivider,
                        width: sel ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: Text(e, style: const TextStyle(fontSize: 22)),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            // 친밀도
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('친밀도',
                    style: TextStyle(fontSize: 13, color: kTextSub)),
                Text('${_intimacy.round()}',
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
            Slider(
              value: _intimacy,
              min: 0, max: 100, divisions: 20,
              activeColor: kPurple,
              onChanged: (v) => setState(() => _intimacy = v),
            ),
            const SizedBox(height: 8),
            // 대화 빈도
            const Text('대화 빈도',
                style: TextStyle(fontSize: 13, color: kTextSub)),
            const SizedBox(height: 8),
            _StepSelector(
              labels: const ['없음', '가끔', '보통', '자주', '매일'],
              value: _frequency,
              onChanged: (v) => setState(() => _frequency = v),
            ),
            const SizedBox(height: 16),
            // 갈등 수준
            const Text('갈등 수준',
                style: TextStyle(fontSize: 13, color: kTextSub)),
            const SizedBox(height: 8),
            _StepSelector(
              labels: const ['없음', '낮음', '보통', '높음', '심각'],
              value: _conflict,
              onChanged: (v) => setState(() => _conflict = v),
              color: Colors.redAccent,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _save,
                child: Text(
                    widget.existing == null ? '추가하기' : '저장하기'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _save() {
    final name = _name.text.trim();
    if (name.isEmpty) return;
    final provider = context.read<AppProvider>();
    if (widget.existing == null) {
      provider.addPerson(Person(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: name,
        relation: _relation,
        emoji: _emoji,
        intimacy: _intimacy.round(),
        frequency: _frequency,
        conflict: _conflict,
      ));
    } else {
      final p = widget.existing!;
      p.name = name;
      p.relation = _relation;
      p.emoji = _emoji;
      p.intimacy = _intimacy.round();
      p.frequency = _frequency;
      p.conflict = _conflict;
      provider.updatePerson(p);
    }
    Navigator.pop(context);
  }
}

class _RelationSelector extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _RelationSelector({
    required this.value,
    required this.onChanged,
  });

  static const _options = [
    {'key': 'lover', 'label': '💑 연인'},
    {'key': 'some', 'label': '💕 썸'},
    {'key': 'friend', 'label': '👫 친구'},
    {'key': 'family', 'label': '👨‍👩‍👧 가족'},
    {'key': 'work', 'label': '💼 직장'},
  ];

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _options.map((o) {
        final sel = o['key'] == value;
        return GestureDetector(
          onTap: () => onChanged(o['key'] as String),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: sel ? kPurpleSoft : Colors.transparent,
              border: Border.all(
                  color: sel ? kPurple : kDivider,
                  width: sel ? 2 : 1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              o['label'] as String,
              style: TextStyle(
                fontSize: 13,
                color: sel ? kPurple : kTextSub,
                fontWeight:
                    sel ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _StepSelector extends StatelessWidget {
  final List<String> labels;
  final int value;
  final ValueChanged<int> onChanged;
  final Color color;

  const _StepSelector({
    required this.labels,
    required this.value,
    required this.onChanged,
    this.color = kPurple,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(labels.length, (i) {
        final sel = i == value;
        return Expanded(
          child: GestureDetector(
            onTap: () => onChanged(i),
            child: Container(
              margin: EdgeInsets.only(right: i < labels.length - 1 ? 4 : 0),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: sel ? color.withOpacity(0.15) : Colors.transparent,
                border: Border.all(
                    color: sel ? color : kDivider,
                    width: sel ? 1.5 : 1),
                borderRadius: BorderRadius.circular(8),
              ),
              alignment: Alignment.center,
              child: Text(
                labels[i],
                style: TextStyle(
                  fontSize: 11,
                  color: sel ? color : kTextSub,
                  fontWeight:
                      sel ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onAdd;
  const _EmptyState({required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🗺️', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          const Text(
            '아직 등록된 인물이 없어요',
            style: TextStyle(
                fontSize: 16, fontWeight: FontWeight.w600, color: kText),
          ),
          const SizedBox(height: 8),
          const Text(
            '소중한 사람들을 추가해 관계를 관리해보세요',
            style: TextStyle(fontSize: 13, color: kTextSub),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: onAdd,
            icon: const Icon(Icons.person_add),
            label: const Text('인물 추가하기'),
          ),
        ],
      ),
    );
  }
}
