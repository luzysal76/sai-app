import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/person.dart';
import '../models/diary_entry.dart';

class StorageService {
  static const _keyPersons = 'hearim_persons';
  static const _keyDiary = 'hearim_diary';
  static const _keyTimeline = 'hearim_timeline';

  // ── 인물 ────────────────────────────────────────────────────
  Future<List<Person>> loadPersons() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyPersons);
    if (raw == null) return [];
    try {
      final List list = jsonDecode(raw) as List;
      return list.map((e) => Person.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> savePersons(List<Person> persons) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _keyPersons,
      jsonEncode(persons.map((p) => p.toJson()).toList()),
    );
  }

  Future<void> addPerson(Person person) async {
    final list = await loadPersons();
    list.add(person);
    await savePersons(list);
  }

  Future<void> updatePerson(Person updated) async {
    final list = await loadPersons();
    final idx = list.indexWhere((p) => p.id == updated.id);
    if (idx != -1) list[idx] = updated;
    await savePersons(list);
  }

  Future<void> deletePerson(String id) async {
    final list = await loadPersons();
    list.removeWhere((p) => p.id == id);
    await savePersons(list);
    // 연관 타임라인도 삭제
    final events = await loadTimeline();
    events.removeWhere((e) => e.personId == id);
    await saveTimeline(events);
  }

  // ── 일기 ────────────────────────────────────────────────────
  Future<List<DiaryEntry>> loadDiary() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyDiary);
    if (raw == null) return [];
    try {
      final List list = jsonDecode(raw) as List;
      return list
          .map((e) => DiaryEntry.fromJson(e as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.date.compareTo(a.date));
    } catch (_) {
      return [];
    }
  }

  Future<void> saveDiaryEntry(DiaryEntry entry) async {
    final list = await loadDiary();
    final idx = list.indexWhere((e) => e.id == entry.id);
    if (idx != -1) {
      list[idx] = entry;
    } else {
      list.add(entry);
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _keyDiary,
      jsonEncode(list.map((e) => e.toJson()).toList()),
    );
  }

  Future<void> deleteDiaryEntry(String id) async {
    final list = await loadDiary();
    list.removeWhere((e) => e.id == id);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _keyDiary,
      jsonEncode(list.map((e) => e.toJson()).toList()),
    );
  }

  // ── 타임라인 ─────────────────────────────────────────────────
  Future<List<TimelineEvent>> loadTimeline({String? personId}) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyTimeline);
    if (raw == null) return [];
    try {
      final List list = jsonDecode(raw) as List;
      final events = list
          .map((e) => TimelineEvent.fromJson(e as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.date.compareTo(a.date));
      if (personId != null) {
        return events.where((e) => e.personId == personId).toList();
      }
      return events;
    } catch (_) {
      return [];
    }
  }

  Future<void> saveTimeline(List<TimelineEvent> events) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _keyTimeline,
      jsonEncode(events.map((e) => e.toJson()).toList()),
    );
  }

  Future<void> addTimelineEvent(TimelineEvent event) async {
    final list = await loadTimeline();
    list.add(event);
    await saveTimeline(list);
  }

  Future<void> deleteTimelineEvent(String id) async {
    final list = await loadTimeline();
    list.removeWhere((e) => e.id == id);
    await saveTimeline(list);
  }

  // 일기 저장 후 자동 타임라인 기록
  Future<void> autoRecordFromDiary(
    List<Person> persons,
    int mood,
    String note,
    List<String> mentionedNames,
  ) async {
    if (mentionedNames.isEmpty) return;
    final today = DateTime.now();
    final todayStr =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    for (final name in mentionedNames) {
      final person = persons.firstWhere(
        (p) => p.name.contains(name) || name.contains(p.name),
        orElse: () => Person(id: '', name: ''),
      );
      if (person.id.isEmpty) continue;

      // 오늘 이미 기록했으면 스킵
      final existing = await loadTimeline(personId: person.id);
      final alreadyToday = existing.any((e) {
        final d = e.date;
        final ds =
            '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
        return ds == todayStr && e.source == 'diary';
      });
      if (alreadyToday) continue;

      String type;
      if (mood >= 4) type = 'positive';
      else if (mood <= 2) type = 'negative';
      else type = 'neutral';

      await addTimelineEvent(TimelineEvent(
        id: '${DateTime.now().millisecondsSinceEpoch}_${person.id}',
        personId: person.id,
        type: type,
        note: note.isNotEmpty ? note : '일기 자동 기록',
        source: 'diary',
        date: today,
      ));
    }
  }
}
