// 관계 인물 모델
class Person {
  final String id;
  String name;
  String relation; // lover / some / friend / family / work
  String emoji;
  int intimacy;    // 0-100
  int frequency;   // 0-4 (없음/가끔/보통/자주/매일)
  int conflict;    // 0-4
  DateTime updatedAt;

  Person({
    required this.id,
    required this.name,
    this.relation = 'friend',
    this.emoji = '👤',
    this.intimacy = 50,
    this.frequency = 2,
    this.conflict = 1,
    DateTime? updatedAt,
  }) : updatedAt = updatedAt ?? DateTime.now();

  // RPG 등급 (S/A/B/C/D)
  String get rank {
    final score = rankScore;
    if (score >= 90) return 'S';
    if (score >= 75) return 'A';
    if (score >= 55) return 'B';
    if (score >= 35) return 'C';
    return 'D';
  }

  int get rankScore {
    return (intimacy * 0.6 +
            frequency * 10 * 0.25 +
            (4 - conflict) * 10 * 0.15)
        .round()
        .clamp(0, 100);
  }

  // 관계 한글명
  String get relationLabel {
    const labels = {
      'lover': '연인',
      'some': '썸',
      'friend': '친구',
      'family': '가족',
      'work': '직장',
    };
    return labels[relation] ?? '기타';
  }

  // 대화 빈도 한글명
  String get frequencyLabel {
    const labels = ['거의 없음', '가끔', '보통', '자주', '매일'];
    return labels.elementAtOrNull(frequency) ?? '보통';
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'relation': relation,
        'emoji': emoji,
        'intimacy': intimacy,
        'frequency': frequency,
        'conflict': conflict,
        'updatedAt': updatedAt.toIso8601String(),
      };

  factory Person.fromJson(Map<String, dynamic> j) => Person(
        id: j['id'] as String,
        name: j['name'] as String,
        relation: j['relation'] as String? ?? 'friend',
        emoji: j['emoji'] as String? ?? '👤',
        intimacy: j['intimacy'] as int? ?? 50,
        frequency: j['frequency'] as int? ?? 2,
        conflict: j['conflict'] as int? ?? 1,
        updatedAt: j['updatedAt'] != null
            ? DateTime.parse(j['updatedAt'] as String)
            : DateTime.now(),
      );
}
