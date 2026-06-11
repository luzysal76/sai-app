// 감정 일기 모델
class DiaryEntry {
  final String id;
  int mood;       // 1-5 (매우나쁨~매우좋음)
  String persons; // 쉼표 구분 인물 이름
  String note;
  DateTime date;

  DiaryEntry({
    required this.id,
    this.mood = 3,
    this.persons = '',
    this.note = '',
    DateTime? date,
  }) : date = date ?? DateTime.now();

  String get moodEmoji {
    const emojis = ['😢', '😔', '😐', '😊', '🥰'];
    return emojis.elementAtOrNull(mood - 1) ?? '😐';
  }

  String get moodLabel {
    const labels = ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'];
    return labels.elementAtOrNull(mood - 1) ?? '보통';
  }

  String get dateLabel {
    final now = DateTime.now();
    final diff = now.difference(date).inDays;
    if (diff == 0) return '오늘';
    if (diff == 1) return '어제';
    return '${date.month}/${date.day}';
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'mood': mood,
        'persons': persons,
        'note': note,
        'date': date.toIso8601String(),
      };

  factory DiaryEntry.fromJson(Map<String, dynamic> j) => DiaryEntry(
        id: j['id'] as String,
        mood: j['mood'] as int? ?? 3,
        persons: j['persons'] as String? ?? '',
        note: j['note'] as String? ?? '',
        date: j['date'] != null
            ? DateTime.parse(j['date'] as String)
            : DateTime.now(),
      );
}

// 타임라인 이벤트 모델
class TimelineEvent {
  final String id;
  final String personId;
  String type; // positive/neutral/negative/milestone/contact_down/recovery
  String note;
  String source; // manual/diary/auto
  DateTime date;

  TimelineEvent({
    required this.id,
    required this.personId,
    this.type = 'neutral',
    this.note = '',
    this.source = 'manual',
    DateTime? date,
  }) : date = date ?? DateTime.now();

  static const typeInfo = {
    'positive':     {'emoji': '💗', 'label': '좋은 일', 'color': 0xFFFF6B9D},
    'neutral':      {'emoji': '💬', 'label': '일상 대화', 'color': 0xFF9B8EC4},
    'negative':     {'emoji': '😔', 'label': '갈등/다툼', 'color': 0xFFE57373},
    'milestone':    {'emoji': '⭐', 'label': '중요한 순간', 'color': 0xFFFFD700},
    'contact_down': {'emoji': '📭', 'label': '연락 감소', 'color': 0xFF90A4AE},
    'recovery':     {'emoji': '🌱', 'label': '관계 회복', 'color': 0xFF81C784},
  };

  Map<String, dynamic> get info => typeInfo[type] ?? typeInfo['neutral']!;
  String get emoji => info['emoji'] as String;
  String get typeLabel => info['label'] as String;

  Map<String, dynamic> toJson() => {
        'id': id,
        'personId': personId,
        'type': type,
        'note': note,
        'source': source,
        'date': date.toIso8601String(),
      };

  factory TimelineEvent.fromJson(Map<String, dynamic> j) => TimelineEvent(
        id: j['id'] as String,
        personId: j['personId'] as String,
        type: j['type'] as String? ?? 'neutral',
        note: j['note'] as String? ?? '',
        source: j['source'] as String? ?? 'manual',
        date: j['date'] != null
            ? DateTime.parse(j['date'] as String)
            : DateTime.now(),
      );
}
