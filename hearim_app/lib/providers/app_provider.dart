import 'package:flutter/material.dart';
import '../models/person.dart';
import '../models/diary_entry.dart';
import '../services/storage_service.dart';

class AppProvider extends ChangeNotifier {
  final StorageService _storage = StorageService();

  List<Person> _persons = [];
  List<DiaryEntry> _diary = [];
  bool _loading = false;

  List<Person> get persons => _persons;
  List<DiaryEntry> get diary => _diary;
  bool get loading => _loading;

  Future<void> init() async {
    _loading = true;
    notifyListeners();
    _persons = await _storage.loadPersons();
    _diary = await _storage.loadDiary();
    _loading = false;
    notifyListeners();
  }

  // ── 인물 ─────────────────────────────────────────────────
  Future<void> addPerson(Person p) async {
    await _storage.addPerson(p);
    _persons = await _storage.loadPersons();
    notifyListeners();
  }

  Future<void> updatePerson(Person p) async {
    await _storage.updatePerson(p);
    _persons = await _storage.loadPersons();
    notifyListeners();
  }

  Future<void> deletePerson(String id) async {
    await _storage.deletePerson(id);
    _persons = await _storage.loadPersons();
    notifyListeners();
  }

  // ── 일기 ─────────────────────────────────────────────────
  Future<void> saveDiaryEntry(DiaryEntry entry) async {
    await _storage.saveDiaryEntry(entry);
    // 타임라인 자동 기록
    if (entry.persons.trim().isNotEmpty) {
      final names = entry.persons
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();
      await _storage.autoRecordFromDiary(
          _persons, entry.mood, entry.note, names);
    }
    _diary = await _storage.loadDiary();
    notifyListeners();
  }

  Future<void> deleteDiaryEntry(String id) async {
    await _storage.deleteDiaryEntry(id);
    _diary = await _storage.loadDiary();
    notifyListeners();
  }

  // ── 타임라인 ─────────────────────────────────────────────
  Future<List<TimelineEvent>> loadTimeline(String personId) =>
      _storage.loadTimeline(personId: personId);

  Future<void> addTimelineEvent(TimelineEvent event) =>
      _storage.addTimelineEvent(event);

  Future<void> deleteTimelineEvent(String id) =>
      _storage.deleteTimelineEvent(id);

  // ── 통계 ─────────────────────────────────────────────────
  int get avgRelationTemp {
    if (_persons.isEmpty) return 50;
    return (_persons.fold(0, (s, p) => s + p.rankScore) / _persons.length)
        .round();
  }

  // 최근 14일 기분 평균
  double get recentMoodAvg {
    final cutoff = DateTime.now().subtract(const Duration(days: 14));
    final recent =
        _diary.where((e) => e.date.isAfter(cutoff)).toList();
    if (recent.isEmpty) return 3.0;
    return recent.fold(0, (s, e) => s + e.mood) / recent.length;
  }
}
