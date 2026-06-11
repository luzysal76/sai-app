import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../providers/app_provider.dart';
import '../models/diary_entry.dart';

class DiaryScreen extends StatelessWidget {
  const DiaryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final entries = provider.diary;

    return Scaffold(
      appBar: AppBar(
        title: const Text('감정 일기'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showEntrySheet(context, null),
          ),
        ],
      ),
      body: entries.isEmpty
          ? _EmptyState(onAdd: () => _showEntrySheet(context, null))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: entries.length,
              itemBuilder: (ctx, i) => _DiaryCard(
                entry: entries[i],
                onDelete: () => provider.deleteDiaryEntry(entries[i].id),
              ),
            ),
      floatingActionButton: entries.isNotEmpty
          ? FloatingActionButton(
              onPressed: () => _showEntrySheet(context, null),
              backgroundColor: kPurple,
              child: const Icon(Icons.edit, color: Colors.white),
            )
          : null,
    );
  }

  void _showEntrySheet(BuildContext ctx, DiaryEntry? existing) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _DiaryForm(existing: existing),
    );
  }
}

// ── 일기 카드 ─────────────────────────────────────────────────
class _DiaryCard extends StatelessWidget {
  final DiaryEntry entry;
  final VoidCallback onDelete;

  const _DiaryCard({required this.entry, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(entry.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: Colors.red.shade400,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) => onDelete(),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kDivider),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 기분 이모지
            Column(
              children: [
                Text(entry.moodEmoji,
                    style: const TextStyle(fontSize: 32)),
                Text(entry.dateLabel,
                    style: const TextStyle(
                        fontSize: 10, color: kTextSub)),
              ],
            ),
            const SizedBox(width: 14),
            // 내용
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(entry.moodLabel,
                          style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: kPurple)),
                      const SizedBox(width: 8),
                      if (entry.persons.isNotEmpty)
                        Chip(
                          label: Text(entry.persons,
                              style: const TextStyle(fontSize: 10)),
                          padding: EdgeInsets.zero,
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                        ),
                    ],
                  ),
                  if (entry.note.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      entry.note,
                      style: const TextStyle(
                          fontSize: 13, color: kText, height: 1.4),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── 일기 작성 폼 ──────────────────────────────────────────────
class _DiaryForm extends StatefulWidget {
  final DiaryEntry? existing;
  const _DiaryForm({this.existing});

  @override
  State<_DiaryForm> createState() => _DiaryFormState();
}

class _DiaryFormState extends State<_DiaryForm> {
  int _mood = 3;
  final _personsCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();

  static const _moodEmojis = ['😢', '😔', '😐', '😊', '🥰'];
  static const _moodLabels = ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'];

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    if (e != null) {
      _mood = e.mood;
      _personsCtrl.text = e.persons;
      _noteCtrl.text = e.note;
    }
  }

  @override
  void dispose() {
    _personsCtrl.dispose();
    _noteCtrl.dispose();
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
            const Text('오늘의 기분',
                style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            // 기분 선택
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(5, (i) {
                final v = i + 1;
                final sel = v == _mood;
                return GestureDetector(
                  onTap: () => setState(() => _mood = v),
                  child: Column(
                    children: [
                      AnimatedScale(
                        scale: sel ? 1.3 : 1.0,
                        duration: const Duration(milliseconds: 200),
                        child: Text(
                          _moodEmojis[i],
                          style: const TextStyle(fontSize: 30),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _moodLabels[i],
                        style: TextStyle(
                          fontSize: 9,
                          color: sel ? kPurple : kTextSub,
                          fontWeight: sel
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _personsCtrl,
              decoration: const InputDecoration(
                hintText: '관련 인물 (쉼표 구분, 예: 민준, 수지)',
                prefixIcon: Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteCtrl,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: '오늘의 감정을 자유롭게 적어보세요...',
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _save,
                child: const Text('저장하기'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _save() {
    final provider = context.read<AppProvider>();
    final entry = DiaryEntry(
      id: widget.existing?.id ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      mood: _mood,
      persons: _personsCtrl.text.trim(),
      note: _noteCtrl.text.trim(),
    );
    provider.saveDiaryEntry(entry);
    Navigator.pop(context);
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
          const Text('📖', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          const Text(
            '아직 일기가 없어요',
            style: TextStyle(
                fontSize: 16, fontWeight: FontWeight.w600, color: kText),
          ),
          const SizedBox(height: 8),
          const Text(
            '오늘의 감정을 기록해보세요',
            style: TextStyle(fontSize: 13, color: kTextSub),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: onAdd,
            icon: const Icon(Icons.edit),
            label: const Text('일기 쓰기'),
          ),
        ],
      ),
    );
  }
}
