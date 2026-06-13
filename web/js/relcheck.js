/**
 * 사이(Sai) — 관계 건강 체크 엔진
 * 5차원 점수 → 레이더 차트 + 맞춤 조언
 */
window.SaiRelCheck = (function () {

  const DIMS = [
    { key:'comm',     name:'소통',  emoji:'💬', color:'#6366f1',
      q:'대화가 자연스럽고 서로 솔직하게 표현하고 있나요?' },
    { key:'trust',    name:'신뢰',  emoji:'🤝', color:'#10b981',
      q:'상대방을 믿고 있으며, 나도 믿음을 주고 있나요?' },
    { key:'intimate', name:'친밀감', emoji:'💕', color:'#ec4899',
      q:'서로 깊이 이해받는 느낌, 가까운 감각이 있나요?' },
    { key:'care',     name:'배려',  emoji:'🌱', color:'#f59e0b',
      q:'서로를 충분히 챙기고 아끼고 있나요?' },
    { key:'spark',    name:'설렘',  emoji:'✨', color:'#a855f7',
      q:'지금도 함께 있으면 설레거나 행복한 순간이 있나요?' },
  ];

  const TIPS = {
    comm: [
      { max:2, tip:'"나는…" 으로 시작하는 문장으로 감정을 표현해보세요. 판단 없이 듣기부터 시작해요.' },
      { max:3, tip:'하루 10분 폰 없이 대화하는 루틴을 만들어보세요.' },
      { max:5, tip:'소통이 좋아요! 서로 더 깊은 꿈과 두려움도 나눠보세요.' },
    ],
    trust: [
      { max:2, tip:'작은 약속부터 꼭 지키는 것이 신뢰를 쌓는 첫 걸음이에요.' },
      { max:3, tip:'불안한 게 있으면 추측 말고 직접 물어보세요. 투명함이 신뢰를 만들어요.' },
      { max:5, tip:'신뢰가 탄탄해요! 서로의 독립적인 공간도 충분히 인정해주세요.' },
    ],
    intimate: [
      { max:2, tip:'상대의 이야기를 들을 때 조언보다 "그랬구나, 많이 힘들었겠다" 공감을 먼저 해보세요.' },
      { max:3, tip:'상대의 꿈, 두려움, 어릴 때 이야기를 물어보세요. 깊이가 생겨요.' },
      { max:5, tip:'친밀감이 높아요! 서로의 성장도 함께 응원해주세요.' },
    ],
    care: [
      { max:2, tip:'상대가 힘들어 보일 때 "뭐 필요해?" 한 마디가 큰 배려예요.' },
      { max:3, tip:'나를 먼저 채워야 상대를 잘 돌볼 수 있어요. 나도 돌봐주세요.' },
      { max:5, tip:'배려가 넘쳐요! 가끔은 받는 것도 편하게 받아들여보세요.' },
    ],
    spark: [
      { max:2, tip:'작은 새로운 경험을 함께 해보세요 — 처음 가는 카페, 익숙하지 않은 메뉴.' },
      { max:3, tip:'상대의 새로운 면을 발견하는 질문을 해보세요. 설렘은 탐구에서 다시 생겨요.' },
      { max:5, tip:'설렘이 살아있어요! 그 감정을 표현해주세요 — 말로 해줘도 설레요.' },
    ],
  };

  function calcResult(scores) {
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const avg = total / DIMS.length;
    const sorted = [...DIMS].sort((a, b) => scores[a.key] - scores[b.key]);
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];
    return { avg, weakest, strongest, total };
  }

  function getTip(key, score) {
    return TIPS[key].find(t => score <= t.max)?.tip || TIPS[key][2].tip;
  }

  function overallLabel(avg) {
    if (avg >= 4.5) return { label: '관계가 활짝 피어있어요 🌸', color: '#10b981' };
    if (avg >= 3.5) return { label: '따뜻하고 안정적인 관계예요 ☀️', color: '#f59e0b' };
    if (avg >= 2.5) return { label: '성장할 여지가 있는 관계예요 🌱', color: '#6366f1' };
    return { label: '함께 회복이 필요한 시간이에요 💧', color: '#ec4899' };
  }

  // SVG 오각형 생성 헬퍼
  function pentagonPoints(cx, cy, r, scores, maxVal) {
    return scores.map((s, i) => {
      const angle = (i * 72 - 90) * Math.PI / 180;
      const ratio = s / maxVal;
      return [cx + r * ratio * Math.cos(angle), cy + r * ratio * Math.sin(angle)];
    });
  }

  function buildSVG(scores) {
    const cx = 100, cy = 100, r = 75;
    const vals = DIMS.map(d => scores[d.key]);
    const pts = pentagonPoints(cx, cy, r, vals, 5);
    const bgPts = pentagonPoints(cx, cy, r, [5,5,5,5,5], 5);
    const toStr = pts => pts.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    // grid rings at 1,2,3,4,5
    const rings = [1,2,3,4,5].map(level => {
      const gpts = pentagonPoints(cx, cy, r, [level,level,level,level,level], 5);
      return `<polygon points="${toStr(gpts)}" fill="none" stroke="rgba(0,0,0,.06)" stroke-width="1"/>`;
    }).join('');

    // axis lines
    const axes = DIMS.map((_, i) => {
      const [x, y] = bgPts[i];
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,.08)" stroke-width="1"/>`;
    }).join('');

    // data polygon
    const dataPoly = `<polygon points="${toStr(pts)}" fill="rgba(99,102,241,.2)" stroke="#6366f1" stroke-width="2.5" stroke-linejoin="round"/>`;

    // labels
    const labels = DIMS.map((d, i) => {
      const angle = (i * 72 - 90) * Math.PI / 180;
      const lr = r + 18;
      const lx = cx + lr * Math.cos(angle);
      const ly = cy + lr * Math.sin(angle);
      return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
        font-size="10" font-weight="700" fill="${d.color}">${d.emoji} ${d.name}</text>`;
    }).join('');

    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="relcheck-radar">
      ${rings}${axes}${dataPoly}${labels}
    </svg>`;
  }

  return { DIMS, calcResult, getTip, overallLabel, buildSVG };
})();
