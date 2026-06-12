/**
 * 사이(Sai) — 관계 타임머신 엔진
 * 최근 6개월 타임라인 + 일기 데이터 → 패턴 분석 → 질문 답변
 */
(function () {
  const pad = (n) => String(n).padStart(2, '0');

  /** 최근 N개월 monthKey 배열 생성 */
  function getMonthRange(months) {
    const result = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        key:   `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
        label: `${d.getMonth() + 1}월`,
      });
    }
    return result;
  }

  /** 특정 인물과 관련된 일기 항목 필터 (이름 포함 여부) */
  function getDiaryForPerson(personName, monthKey) {
    const allDiary = window.HearimDiary?.getRecent(200) || [];
    return allDiary.filter(e => {
      if (!e.date || !e.date.startsWith(monthKey)) return false;
      const people = Array.isArray(e.people) ? e.people : [];
      return people.some(p => p && personName && (
        p.includes(personName) || personName.includes(p)
      ));
    });
  }

  /** 특정 인물의 타임라인 이벤트 필터 (월별) */
  function getTimelineForPerson(personId, monthKey) {
    if (!personId || !window.HearimTimeline) return [];
    return window.HearimTimeline.getEvents(personId)
      .filter(e => e.date && e.date.startsWith(monthKey));
  }

  /** 6개월 월별 통계 계산 */
  function getMonthlyStats(personId, personName, months) {
    months = months || 6;
    return getMonthRange(months).map(m => {
      const diary    = getDiaryForPerson(personName, m.key);
      const timeline = getTimelineForPerson(personId, m.key);

      const avgMood = diary.length > 0
        ? diary.reduce((s, e) => s + (e.mood || 3), 0) / diary.length
        : null;

      const negEvents = timeline.filter(e =>
        ['negative', 'contact_down'].includes(e.type)
      ).length;
      const posEvents = timeline.filter(e =>
        ['positive', 'milestone', 'recovery'].includes(e.type)
      ).length;

      return {
        monthKey:      m.key,
        monthLabel:    m.label,
        diaryCount:    diary.length,
        timelineCount: timeline.length,
        activityCount: diary.length + timeline.length,
        avgMood,
        negEvents,
        posEvents,
        events:        timeline,
      };
    });
  }

  /** 트렌드 분석 */
  function analyzeTrend(stats) {
    const n = stats.length;
    if (!n) return null;

    // 전반기 vs 후반기 활동량 비교
    const half   = Math.ceil(n / 2);
    const first  = stats.slice(0, half);
    const last   = stats.slice(-half);
    const aFirst = first.reduce((s, m) => s + m.activityCount, 0) / half;
    const aLast  = last.reduce((s, m) => s + m.activityCount, 0) / half;

    let contactTrend = 'stable';
    if (aFirst > 0 && aLast < aFirst * 0.55) contactTrend = 'down';
    else if (aLast > aFirst * 1.45)           contactTrend = 'up';

    // 감정 트렌드
    const withMood = stats.filter(m => m.avgMood !== null);
    let moodTrend = 'stable';
    if (withMood.length >= 2) {
      const hm     = Math.ceil(withMood.length / 2);
      const mFirst = withMood.slice(0, hm).reduce((s, m) => s + m.avgMood, 0) / hm;
      const mLast  = withMood.slice(-hm).reduce((s, m) => s + m.avgMood, 0) / hm;
      if (mLast < mFirst - 0.4)      moodTrend = 'down';
      else if (mLast > mFirst + 0.4) moodTrend = 'up';
    }

    const totalConflicts  = stats.reduce((s, m) => s + m.negEvents, 0);
    const totalMilestones = stats.reduce((s, m) => s + m.posEvents, 0);
    const totalActivity   = stats.reduce((s, m) => s + m.activityCount, 0);
    const recentEvents    = stats.slice(-2).flatMap(m => m.events).slice(0, 5);
    const hasData         = totalActivity > 0 || withMood.length > 0;

    return {
      contactTrend,
      moodTrend,
      totalConflicts,
      totalMilestones,
      totalActivity,
      recentEvents,
      hasData,
    };
  }

  /** 질문 → 인사이트 생성 */
  function generateInsight(question, personName, trend) {
    const { contactTrend, moodTrend, totalConflicts, totalMilestones, totalActivity } = trend;
    const name = personName || '상대';

    // 관찰된 패턴 목록
    const patterns = [];
    if (contactTrend === 'down')      patterns.push(`${name}와의 연락·만남 빈도가 최근 줄었어요`);
    else if (contactTrend === 'up')   patterns.push(`${name}와의 교류가 최근 활발해졌어요`);
    else if (totalActivity > 0)       patterns.push(`${name}와의 교류가 꾸준히 유지되고 있어요`);

    if (moodTrend === 'down')         patterns.push(`함께할 때 감정이 낮아지는 추세예요`);
    else if (moodTrend === 'up')      patterns.push(`함께할 때 점점 더 좋은 감정을 느끼고 있어요`);

    if (totalConflicts >= 3)          patterns.push(`6개월간 힘든 이벤트가 ${totalConflicts}번 있었어요`);
    else if (totalConflicts >= 1)     patterns.push(`갈등이나 힘든 순간이 ${totalConflicts}번 있었어요`);

    if (totalMilestones >= 1)         patterns.push(`특별한 좋은 기억이 ${totalMilestones}번 생겼어요`);

    // 질문 키워드 매칭
    const q = (question || '').toLowerCase();
    let answer = '';

    if (!trend.hasData) {
      answer = `${name}에 대한 기록이 아직 없어요. 일기를 쓸 때 이름을 입력하거나 관계 타임라인에 이벤트를 기록하면 실제 분석을 해드릴게요 📝`;

    } else if (q.includes('어색') || q.includes('멀어') || q.includes('서먹')) {
      if (contactTrend === 'down') {
        answer = `기록을 보면 ${name}와의 연락·만남이 줄어들고 있어요. 자연스럽게 거리가 생긴 것 같아요. 먼저 가볍게 안부를 물어보는 게 좋을 것 같아요 💌`;
      } else if (totalConflicts >= 2) {
        answer = `최근 ${totalConflicts}번의 힘든 순간이 있었어요. 해결되지 않은 감정이 어색함으로 나타나는 경우가 많아요. 솔직한 대화를 시도해보세요.`;
      } else {
        answer = `기록상으로는 큰 변화가 없어요. 특별한 이유 없이 어색함이 생기기도 해요. 가볍게 연락해서 만남을 만들어보는 건 어떨까요?`;
      }

    } else if (q.includes('좋아') || q.includes('발전') || q.includes('가능성') || q.includes('잘 될')) {
      if (contactTrend === 'up' && moodTrend !== 'down') {
        answer = `교류 빈도도 늘고 감정도 안정적이에요. 관계가 좋은 방향으로 가고 있는 것 같아요 ✨`;
      } else if (contactTrend === 'down') {
        answer = `최근 교류가 줄어들고 있어요. 지금이 관계에 다시 활력을 불어넣을 좋은 타이밍일 수 있어요 🌱`;
      } else {
        answer = `꾸준한 관계를 유지하고 있어요. 특별한 시간을 만들면 더 깊어질 수 있어요.`;
      }

    } else if (q.includes('갈등') || q.includes('싸움') || q.includes('힘들') || q.includes('화')) {
      if (totalConflicts >= 3) {
        answer = `6개월간 ${totalConflicts}번의 힘든 순간이 있었어요. 패턴이 반복된다면 서로의 기대치를 조율하는 대화가 필요할 수 있어요.`;
      } else if (totalConflicts === 0) {
        answer = `기록상 갈등 이벤트가 없어요. 건강한 관계를 유지하고 있는 것 같아요 👍`;
      } else {
        answer = `${totalConflicts}번의 힘든 순간이 있었지만, 관계가 이어지고 있다는 건 회복력이 있다는 뜻이에요.`;
      }

    } else if (q.includes('그리') || q.includes('보고싶') || q.includes('연락') || q.includes('만남')) {
      if (contactTrend === 'down') {
        answer = `최근 연락이 줄었어요. 그리움이 느껴진다면 지금 바로 안부를 물어보세요. 먼저 연락하는 용기가 관계를 살려낼 수 있어요 📱`;
      } else {
        answer = `꾸준히 교류하고 있어요. 그리움은 관계의 따뜻함이에요. 더 자주 만날 계획을 세워보세요.`;
      }

    } else {
      // 일반 요약
      if (patterns.length > 0) {
        answer = patterns.join('. ') + '. ' + (
          contactTrend === 'down'  ? '관계에 다시 관심을 기울일 때인 것 같아요.' :
          moodTrend === 'up'       ? '좋은 방향으로 발전하고 있어요 ✨' :
          totalMilestones > 0      ? '좋은 기억이 쌓이고 있어요 💗' :
          '기록을 계속 쌓으면 더 정확한 분석을 해드릴 수 있어요.'
        );
      } else {
        answer = `6개월 기록을 분석했어요. 더 구체적인 질문(어색해진 이유, 갈등 패턴, 발전 가능성 등)을 입력하면 더 정확한 인사이트를 드릴 수 있어요.`;
      }
    }

    return { patterns, answer };
  }

  /** 데모용 가상 데이터 (실 데이터 없을 때) */
  function getDemoStats() {
    const acts  = [5, 4, 6, 3, 2, 1];
    const moods = [4.0, 3.5, 4.2, 3.0, 2.8, 2.5];
    const labels = ['1월','2월','3월','4월','5월','6월'];
    return labels.map((label, i) => ({
      monthKey:      `demo-0${i}`,
      monthLabel:    label,
      activityCount: acts[i],
      diaryCount:    [2, 3, 3, 2, 1, 0][i],
      timelineCount: [3, 1, 3, 1, 1, 1][i],
      avgMood:       moods[i],
      negEvents:     [0, 0, 1, 0, 1, 0][i],
      posEvents:     [1, 0, 1, 0, 0, 0][i],
      events:        [],
    }));
  }

  window.SaiTimemachine = { getMonthlyStats, analyzeTrend, generateInsight, getDemoStats };
})();
