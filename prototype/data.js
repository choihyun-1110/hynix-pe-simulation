/* Mock data for Resonance PE prototype */

window.RESONANCE_DATA = {
  brief: {
    productName: "DRAM high-temp low-V read fail",
    description: "DRAM 제품에서 고온 조건과 낮은 voltage margin에서 read fail이 증가한다.",
    features: ["Temperature별 fail rate 증가", "Low voltage shmoo margin 축소", "특정 wafer edge die fail 집중", "Final test 특정 frequency 이상 fail 증가"],
    pricing: ["High temperature", "Low voltage margin", "Final test high frequency condition"],
    target: "AI accelerator workload, high bandwidth burst access, high temperature operation",
    alternatives: "내부 standard test에서는 재현성이 낮고 customer workload 조건에서 intermittent fail 보고",
    hypothesis: "Device leakage, timing margin, wafer edge process variation, customer workload condition을 함께 검토해야 원인 후보를 좁힐 수 있다."
  },
  signals: {
    adoption: { value: 33, delta: 5, prev: 28 },
    needFit: { value: 37, delta: 3, prev: 34 },
    priceRisk: { value: "보통", changed: true, prev: "높음" },
    evidenceQuality: { value: 50, delta: 0 },
    distribution: { positive: 0, neutral: 38, negative: 62 },
    calls: { done: 8, total: 8, batches: 2 },
    warnings: 3,
    decision: { current: "다듬기", prev: "다듬기" }
  },
  versions: [
    {
      id: "035035",
      shortId: "035035",
      name: "노인분들 심심하지 않게 해주는 강아지 로봇",
      type: "컨셉 반응 보기",
      time: "오늘 12:50",
      adoption: 33, need: 37, price: "보통", decision: "다듬기",
      evidence: "50점", calls: "8명 / 8명 (2회차)", panel: "필터 없음", warnings: 3,
      current: true
    },
    {
      id: "094237",
      shortId: "094237",
      name: "노인분들 심심하지 않게 해주는 강아지 로봇",
      type: "컨셉 반응 보기",
      time: "6일 전 오후 6:42",
      adoption: 48, need: 44, price: "보통", decision: "다듬기",
      evidence: "55점", calls: "30명 / 30명 (8회차)", panel: "필터 없음", warnings: 5
    },
    {
      id: "093513",
      shortId: "093513",
      name: "강아지처럼 반응하는 가정용 로봇",
      type: "컨셉 반응 보기",
      time: "12일 전 오후 3:18",
      adoption: 28, need: 34, price: "높음", decision: "다듬기",
      evidence: "50점", calls: "8명 / 8명 (2회차)", panel: "필터 없음", warnings: 6
    }
  ],
  personas: [
    {
      id: "p1",
      name: "조성운",
      age: 58, region: "전라남도", role: "경량 철골공",
      stance: "neg", stanceLabel: "현재로선 안 살 것 같음",
      buyCondition: "현재 정보만으론 구매 의향 없음",
      adoption: 20, need: 25, understanding: 30, price: "높음",
      core: "제품 설명이 구체적이지 않아 안전 점검 같은 본업에 실제로 도움이 될지 의문이다.",
      drivers: [],
      risks: ["제품 효용에 대한 신뢰 부족", "월 구독료가 은퇴 준비 예산에 부담", "현장 적용 사례가 제시되지 않음"],
      nextQ: "이 제품이 경량 철골 구조물의 체결 부위 점검 정확도를 어떻게 개선하는지 구체적인 사례를 보여줄 수 있나요?",
      x: 12, y: 60, size: 56
    },
    {
      id: "p2",
      name: "엄세욱",
      age: 55, region: "인천", role: "검표원",
      stance: "neg", stanceLabel: "이 제품의 타깃이 아님",
      buyCondition: "부모님께 드릴 이유가 명확하면 검토",
      adoption: 20, need: 25, understanding: 28, price: "높음",
      core: "제품 설명만으로는 실제 활용 방법을 파악하기 어렵고, 검표 업무와 무관한 기능이라 필요성을 느끼지 못한다.",
      drivers: [],
      risks: ["일과 무관해 보임", "실사용 시나리오 부재", "혼자 살지 않아 필요성 낮음"],
      nextQ: "혼자 살지 않는 가족 구성원에게는 이 제품이 어떤 역할을 하나요?",
      x: 82, y: 30, size: 50
    },
    {
      id: "p3",
      name: "임재영",
      age: 20, region: "충청남도", role: "취업 준비 중",
      stance: "neg", stanceLabel: "지금은 구매력이 없음",
      buyCondition: "취업 후 부모님 선물로라면 고려",
      adoption: 20, need: 30, understanding: 22, price: "보통",
      core: "제품 설명이 구체적이지 않아서 실제 활용 가능성을 판단하기 어렵다.",
      drivers: ["기술 자체에는 관심 있음"],
      risks: ["내가 타깃이 아님 (20대 무직)", "구매력 없음", "제품 메시지가 본인과 거리감"],
      nextQ: "20대 자녀가 부모님 선물로 구매할 만한 매력 포인트는 무엇인가요?",
      x: 22, y: 32, size: 42
    },
    {
      id: "p4",
      name: "박진희",
      age: 66, region: "서울", role: "섬유 소재 개발 연구원",
      stance: "pos", stanceLabel: "사양 공개되면 살 것 같음",
      buyCondition: "외장 재질·모터·발열 데이터 공개 시 구매",
      adoption: 55, need: 50, understanding: 62, price: "보통",
      core: "관심은 있지만, 외장 소재와 모터 사양, 발열 데이터 같은 물성 정보가 공개되지 않아 안전성과 효용성을 판단하기 어렵다.",
      drivers: ["타깃 연령에 정확히 부합", "지적 호기심이 강함", "기술 친화적"],
      risks: ["제품 사양과 물성 데이터 비공개", "안전·내구성 검증 요구", "단순 동반자 이상의 기능 기대"],
      nextQ: "센서, 재료, 구동 사양과 일일 사용 시간 기준 발열/안전 데이터를 공개할 수 있나요?",
      x: 60, y: 18, size: 68
    },
    {
      id: "p5",
      name: "조성렬",
      age: 39, region: "경기도", role: "사회복지사",
      stance: "pos", stanceLabel: "운영 쉬우면 복지관 도입 검토",
      buyCondition: "5분 셋업·운영 일원화 가능하면 B2G 도입",
      adoption: 52, need: 58, understanding: 65, price: "보통",
      core: "현장 페인포인트와 정확히 맞물리지만, 사용법이 복잡해 보여서 어르신들에게 어떻게 설명할지 걱정이다.",
      drivers: ["복지 현장 니즈와 정확히 일치", "공공기관 도입 경로 알고 있음"],
      risks: ["UX 단순화 필수", "어르신 학습 곡선", "현장 설치·유지보수 부담"],
      nextQ: "복지관과 요양시설 도입을 위해 1인 셋업 시간을 10분 이내로 줄일 수 있는 온보딩 방안이 있나요?",
      x: 75, y: 62, size: 64
    },
    {
      id: "p6",
      name: "이용준",
      age: 42, region: "울산", role: "보험 사무원",
      stance: "pos", stanceLabel: "자녀 결제 모델이면 살 의향",
      buyCondition: "결제·셋업이 자녀에서 끝나면 부모님께 보냄",
      adoption: 58, need: 55, understanding: 60, price: "보통",
      core: "본인은 타깃이 아니지만 지방에 계신 부모님께 보내드릴 후보로 진지하게 고려할 만하다.",
      drivers: ["부모님 선물용 후보로 검토", "구매력 보유"],
      risks: ["본인이 사용자가 아님 (구매자와 사용자 분리)", "실제 사용 시연 부재"],
      nextQ: "타지 부모님께 보내는 시나리오에서 가족 화상 연결과 건강 알림 기능을 데모로 보여줄 수 있나요?",
      x: 50, y: 78, size: 66
    },
    {
      id: "p7",
      name: "조귀순",
      age: 66, region: "부산", role: "은퇴 후 무직",
      stance: "neu", stanceLabel: "직접 만져봐야 결정할 것 같음",
      buyCondition: "매장 체험·1회 구매 가능 시 결정",
      adoption: 35, need: 32, understanding: 28, price: "높음",
      core: "외로움 부분은 공감하지만, 제품 설명이 구체적이지 않아 실제 사용 방법을 이해하기 어렵다.",
      drivers: ["타깃 연령에 정확히 부합", "외로움 부분에 공감"],
      risks: ["기술 친숙도 낮음", "월 구독 모델에 거부감", "조작 난이도 우려"],
      nextQ: "리모컨 하나로 모든 기능을 쓸 수 있나요, 아니면 음성만으로 충분한가요?",
      x: 35, y: 80, size: 52
    },
    {
      id: "p8",
      name: "남희",
      age: 52, region: "서울", role: "전업주부",
      stance: "neu", stanceLabel: "어머니께 보낼지 고민 중",
      buyCondition: "사용 장면 영상을 보면 결정 가능",
      adoption: 32, need: 28, understanding: 30, price: "보통",
      core: "어머님 댁에 두면 좋을 것 같다는 생각은 들지만, 일상 시나리오가 구체적이지 않아서 정말 도움이 될지 모르겠다.",
      drivers: ["부모님 세대 케어에 관심"],
      risks: ["사용 시나리오 모호", "가격대 정당화 부족"],
      nextQ: "혼자 사시는 어머니 댁에 두면 하루 동안 어떤 장면들이 만들어지는지 보여줄 수 있나요?",
      x: 88, y: 75, size: 50
    }
  ],
  chatScript: {
    p1: [
      "안녕하세요, 전남에서 경량 철골 일을 하고 있는 조성운입니다. 솔직히 이 제품, 우리 같은 사람한테 와닿지가 않아요.",
      "현장 일이 끝나면 피곤해서 강아지 로봇이랑 놀 여력도 없고, 한 달에 39,000원이면 적은 돈 아닙니다. 은퇴 준비도 해야 하는데요.",
      "차라리 부모님 댁에 두는 거면 모를까. 그 경우엔 가족 알림이 진짜 제대로 오는지가 제일 궁금합니다."
    ],
    p2: [
      "엄세욱입니다. 인천에서 검표원으로 일하고 있어요. 글쎄요, 저한테는 좀 동떨어진 제품 같습니다.",
      "혼자 사는 노인을 위한 거라고 하는데, 저는 가족이랑 같이 살고 있고 일하느라 집에 잘 있지도 않아요.",
      "차라리 ‘퇴근하고 들어왔을 때 부모님 댁 상태 알림’ 같은 기능이 강조되면 한번쯤 다시 보겠습니다."
    ],
    p3: [
      "임재영이고요, 충남에서 취업 준비 중입니다. 솔직히 저는 살 일이 없을 것 같아요.",
      "저한테 39,000원이면 한 달 식비의 일부거든요. 기술 자체는 재밌어 보이지만, 제 또래는 그냥 휴대폰 영상통화로 부모님 챙길 거예요.",
      "혹시 자녀가 부모님 선물로 보내드리는 케이스라면, 첫 결제만 자녀가 하고 그 이후엔 자동으로 되는 구조여야 할 것 같아요."
    ],
    p4: [
      "박진희입니다. 섬유 소재 쪽에서 35년 넘게 일했어요. 흥미로운 제품인 건 맞습니다.",
      "다만 외장 소재와 모터 사양, 발열 데이터가 공개돼 있지 않으면 안전성을 판단하기가 어려워요. 어르신이 매일 만질 물건이잖아요.",
      "그리고 ‘강아지처럼 반응한다’는 표현이 너무 비유적이에요. 어떤 센서로 어떤 반응을 트리거하는지 한 줄로 설명할 수 있어야 합니다."
    ],
    p5: [
      "조성렬이라고 합니다. 경기도에서 사회복지사 일을 해요. 솔직히 이 제품이 ‘있어야겠다’ 싶긴 합니다.",
      "어르신들 댁에 방문 가면 정말 외로워하시거든요. 그런데 사용법이 복잡해 보이면 결국 제가 매번 가서 켜드려야 할 거예요.",
      "복지관 단위로 도입하려면 5분 안에 셋업이 끝나야 하고, 어르신이 ‘안녕’ 한 마디로 시작할 수 있어야 합니다."
    ],
    p6: [
      "이용준입니다. 42세고 부모님은 두 분 다 지방에 계세요.",
      "솔직히 제 입장에선 사용자가 아니라 구매자죠. 부모님께 드리고 싶긴 한데, 결국 부모님이 안 쓰시면 의미가 없어요.",
      "월 39,000원이 비싼 게 아니라, 자녀가 결제하는 모델인지 부모님이 결제하는 모델인지가 더 중요해요. 결제와 셋업이 자녀쪽에서 끝나야 합니다."
    ],
    p7: [
      "조귀순이에요. 부산에서 혼자 살고 있어요. 외로운 거야 누구나 있는 일이지요.",
      "강아지 로봇이라니까 호기심은 가는데, 제가 핸드폰도 잘 못 다뤄요. 설명 들어도 머리에 안 들어와요.",
      "한번 만져보고 살 수 있으면 좋겠어요. 39,000원이 매달 빠져나가는 건 부담스러워서, 그냥 한 번에 사는 게 차라리 낫겠다 싶고요."
    ],
    p8: [
      "안녕하세요, 남희입니다. 어머니가 지방에 혼자 계셔서 이런 제품 관심이 가긴 해요.",
      "근데 솔직히 ‘강아지처럼 반응한다’가 어떤 건지 머릿속에 안 그려져요. 영상 한 편이면 바로 이해될 텐데요.",
      "어머니가 진짜 매일 켜고 쓰실지가 관건이에요. 일주일 동안 안 켜져 있으면 자녀한테 알림 가는 식의 안전장치는 있나요?"
    ]
  },
  thoughts: [
    "8명의 한국인 페르소나를 생성하는 중…",
    "나이, 지역, 직업, 가족 구성 샘플링 중…",
    "제품 정보를 페르소나에게 보여주는 중…",
    "조성운 (58, 경량 철골공) 응답 중…",
    "엄세욱 (55, 검표원) 응답 중…",
    "임재영 (20, 취준생) 응답 중…",
    "박진희 (66, 섬유 소재 연구원) 응답 중…",
    "조성렬 (39, 사회복지사) 응답 중…",
    "이용준 (42, 보험 사무원) 응답 중…",
    "조귀순 (66, 은퇴) 응답 중…",
    "남희 (52, 전업주부) 응답 중…",
    "반응을 모아 채택 의향, 문제 적합도, 가격 부담 계산 중…",
    "이전 실행과 비교하는 중…",
    "5단계 리포트 초안을 작성하는 중…"
  ]
};
