import type {
  Note,
  CognitiveRadar,
  WordCloudItem,
  Milestone,
  GalaxyNode,
  GalaxyEdge,
  ThinkingStyle,
  BookRecommendation,
  ConceptNode,
  ConceptEdge,
  GoldenQuote,
  WeeklyBrief,
} from '@/types';

// ========== 模拟笔记 ==========

export const mockNotes: Note[] = [
  {
    id: 'note-1',
    title: '《思考，快与慢》读书笔记',
    content: `读完丹尼尔·卡尼曼的这本书，最大的感触是我们的大脑远没有自己以为的那么理性。系统1和系统2的理论让我重新审视了自己日常决策中的很多"直觉判断"。

特别是关于"锚定效应"的部分，我回想自己在商务谈判中经常受到对方开价的影响，即使我知道这个价格不合理。这让我意识到，知道认知偏差的存在并不能完全消除它的影响，但我们可以通过建立检查清单来减少其影响。

另一个让我印象深刻的是"损失厌恶"——人们对失去的痛苦远大于得到的快乐。这解释了为什么很多人在投资中宁愿持有亏损的股票也不愿卖出，即使理性分析告诉他们应该止损。

我开始思考：如果认知偏差是无法完全消除的"系统bug"，那么最有效的应对策略是什么？是建立外部化的决策流程，还是训练自己的元认知能力？`,
    source_type: 'book',
    source_name: '思考，快与慢',
    created_at: '2025-03-15',
    tags: ['认知科学', '决策', '心理学'],
    analysis_status: 'completed',
  },
  {
    id: 'note-2',
    title: '《原子习惯》实践两周感想',
    content: `James Clear的"原子习惯"理念真的很实用。我按照书中的方法，把"每天运动30分钟"拆解成了"穿上运动鞋→走到门口→走5分钟"这样的微习惯链。

两周下来，我发现最关键的不是习惯本身，而是"身份认同"的转变。当我不再说"我要减肥"而是说"我是一个运动者"时，一切都变得自然了。

不过书中关于"习惯堆叠"的建议对我来说效果一般。我尝试把冥想和早晨喝咖啡绑定，但总是忘记。后来发现，与其绑定到已有习惯，不如绑定到一个"触发场景"——比如每天到办公室的第一件事。

这让我想到，所有的习惯方法论都有一个共同的前提：你需要足够了解自己。了解自己的什么时候精力最好、什么场景最容易触发行为、什么样的奖励对你真正有效。`,
    source_type: 'book',
    source_name: '原子习惯',
    created_at: '2025-04-02',
    tags: ['习惯', '自我管理', '行为设计'],
    analysis_status: 'completed',
  },
  {
    id: 'note-3',
    title: 'TEDx 演讲活动感想：关于创造力',
    content: `今天参加了TEDx的线下放映，主题是"创造力的未来"。最触动我的是关于"跨界创新"的讨论。

一位设计师分享了她在医学院学习解剖学的经历，她说理解人体结构让她对产品设计有了全新的视角——"好的设计就像人体的骨骼和肌肉，每一部分都有存在的理由"。

这让我反思自己的阅读习惯：我总是倾向于在同一领域深挖，很少主动跨界。但真正的创新往往发生在领域的交叉点上。

一个有趣的观点：创造力不是一种天赋，而是一种连接能力——能把看似无关的事物联系起来。这意味着我们可以通过增加"输入"的多样性来提升创造力。

但也有一个质疑：跨界是否只是表面文章？很多所谓的跨界创新，其实是某一个领域的深度积累到了临界点后的自然溢出。真正的跨界需要至少在一个领域有足够深度，否则只是浅尝辄止。`,
    source_type: 'activity',
    source_name: 'TEDx创造力主题放映',
    created_at: '2025-04-20',
    tags: ['创造力', '跨界', '创新', '活动'],
    analysis_status: 'completed',
  },
  {
    id: 'note-4',
    title: '《原则》读书笔记：关于系统化思维',
    content: `Ray Dalio的《原则》让我对"系统化思维"有了更清晰的理解。他的核心理念是把生活和工作中的一切都看作可以迭代的"机器"。

最有启发的观点是"极度透明"——在一个组织中，所有的决策过程和理由都应该对所有人开放。这听起来理想化，但Dalio用桥水基金的实践证明了它的可行性。

我开始思考：个人是否也可以建立自己的"原则系统"？比如：
- 做决策时，列出最重要的3个变量
- 犯错时，写"错误日志"分析根因
- 与人冲突时，假设对方有合理的理由

但我也注意到一个潜在的问题：过于系统化可能导致过度理性化，忽略了情感和直觉的价值。Dalio自己也承认，他在早期因为太"理性"而伤害了很多团队成员的感情。

系统思维和人文关怀之间，是否存在一种平衡？这可能是比建立系统本身更重要的问题。`,
    source_type: 'book',
    source_name: '原则',
    created_at: '2025-05-10',
    tags: ['系统化思维', '管理', '决策', '原则'],
    analysis_status: 'completed',
  },
  {
    id: 'note-5',
    title: '读书会讨论：内卷与躺平',
    content: `今天的读书会讨论了一个很现实的话题：内卷与躺平。大家的观点分歧很大，但我觉得最有深度的是一个社会学视角的分析：

"内卷"本质上是一种零和博弈——当所有人都付出更多但总产出不变时，个体的理性选择（更加努力）反而导致了集体的非理性结果。

有人提出"躺平"是一种理性的反抗：当你无法改变游戏规则时，退出游戏是最优策略。但也有人反驳说，躺平只是另一种形式的逃避，真正有勇气的人应该在系统内寻找突破口。

我自己的想法在两者之间：既不完全内卷也不完全躺平，而是找到"自己的游戏"——不在别人的赛道上竞争，而是定义自己的评价标准。

这让我想起了《庄子》里的"无用之用"——在一个功利的评价体系里，"无用"可能恰恰是最大的用，因为它让你跳出了那个评价体系。

一个未解决的问题：如何在现实中实践这种"自己的游戏"？毕竟我们都需要经济基础，不能完全脱离社会评价体系。`,
    source_type: 'activity',
    source_name: '周末读书会',
    created_at: '2025-05-25',
    tags: ['社会观察', '内卷', '哲学', '活动'],
    analysis_status: 'completed',
  },
  {
    id: 'note-6',
    title: '《穷查理宝典》：多元思维模型',
    content: `查理·芒格的多元思维模型理论，是我今年读到的最有影响力的思想框架之一。

核心观点：你需要从不同的学科（数学、物理、生物、心理学、经济学等）中提取最核心的模型，然后用这些模型来理解世界。就像"手里只有锤子的人，看什么都像钉子"，你需要拥有一整套工具箱。

我特别感兴趣的是他提到的"格栅理论"——把这些模型像格栅一样交叉使用，当多个模型指向同一个结论时，你的判断大概率是正确的。

几个我认为最重要的思维模型：
1. 复利效应——不仅适用于金钱，也适用于知识、关系和习惯
2. 反转思维——"反过来想，总是反过来想"
3. 心理误判倾向——25种常见的人类认知偏差

读完这本书，我开始有意识地在日常决策中使用多元模型，发现确实能减少很多"事后拍大腿"的情况。`,
    source_type: 'book',
    source_name: '穷查理宝典',
    created_at: '2025-06-01',
    tags: ['思维模型', '投资', '跨学科', '决策'],
    analysis_status: 'completed',
  },
  {
    id: 'note-7',
    title: '创业沙龙：关于失败复盘',
    content: `今天参加了一个创业者的失败复盘沙龙。几位创始人分享了他们的创业失败经历，让我对"失败"有了新的理解。

最触动我的是一位连续创业者的分享：他说"大部分创业失败不是因为产品不好，而是因为创始人对自己不够诚实"。他举了自己的例子——明明市场反馈已经很差了，但他选择性地只看那些正面的数据，用"再坚持一下就会有转机"来麻痹自己。

这让我联想到《思考，快与慢》里讲的"确认偏误"——我们倾向于寻找支持已有观点的信息。在创业场景下，这个偏差被放大到了危险的程度。

另一个有趣的讨论是关于"沉没成本谬误"。大家都知道不应该因为已经投入了很多就继续投入，但真正做到的人很少。一位创业者说他的方法是：每个月问自己"如果从零开始，我还会做同样的选择吗？"

这个方法虽然简单，但非常有效。它本质上是一种"强制理性"——通过仪式化的反思来对抗情感驱动。`,
    source_type: 'activity',
    source_name: '创业失败复盘沙龙',
    created_at: '2025-06-10',
    tags: ['创业', '失败复盘', '决策', '活动'],
    analysis_status: 'completed',
  },
];

// ========== 认知雷达模拟数据 ==========

export const mockCognitiveRadar: CognitiveRadar = {
  rational_vs_emotional: 72,
  abstract_vs_concrete: 65,
  critical_vs_accepting: 58,
  macro_vs_detail: 68,
  longterm_vs_instant: 75,
  inward_vs_outward: 45,
};

export const mockUserSelfAssessment: CognitiveRadar = {
  rational_vs_emotional: 80,
  abstract_vs_concrete: 50,
  critical_vs_accepting: 70,
  macro_vs_detail: 60,
  longterm_vs_instant: 85,
  inward_vs_outward: 55,
};

// ========== 词云模拟数据 ==========

export const mockWordCloud: WordCloudItem[] = [
  { text: '认知偏差', weight: 90, sentiment: 'neutral', level: 'principle', source_note_id: 'note-1', source_note_title: '思考，快与慢' },
  { text: '系统思维', weight: 85, sentiment: 'positive', level: 'principle', source_note_id: 'note-4', source_note_title: '原则' },
  { text: '复利效应', weight: 80, sentiment: 'positive', level: 'principle', source_note_id: 'note-6', source_note_title: '穷查理宝典' },
  { text: '习惯', weight: 75, sentiment: 'positive', level: 'opinion', source_note_id: 'note-2', source_note_title: '原子习惯' },
  { text: '跨界创新', weight: 72, sentiment: 'positive', level: 'opinion', source_note_id: 'note-3', source_note_title: 'TEDx创造力主题放映' },
  { text: '内卷', weight: 70, sentiment: 'critical', level: 'fact', source_note_id: 'note-5', source_note_title: '读书会讨论' },
  { text: '决策', weight: 88, sentiment: 'neutral', level: 'principle', source_note_id: 'note-4', source_note_title: '原则' },
  { text: '确认偏误', weight: 65, sentiment: 'critical', level: 'principle', source_note_id: 'note-7', source_note_title: '创业失败复盘沙龙' },
  { text: '身份认同', weight: 60, sentiment: 'positive', level: 'opinion', source_note_id: 'note-2', source_note_title: '原子习惯' },
  { text: '创造力', weight: 68, sentiment: 'positive', level: 'opinion', source_note_id: 'note-3', source_note_title: 'TEDx创造力主题放映' },
  { text: '损失厌恶', weight: 62, sentiment: 'critical', level: 'principle', source_note_id: 'note-1', source_note_title: '思考，快与慢' },
  { text: '多元模型', weight: 78, sentiment: 'positive', level: 'principle', source_note_id: 'note-6', source_note_title: '穷查理宝典' },
  { text: '沉没成本', weight: 55, sentiment: 'critical', level: 'opinion', source_note_id: 'note-7', source_note_title: '创业失败复盘沙龙' },
  { text: '躺平', weight: 50, sentiment: 'neutral', level: 'fact', source_note_id: 'note-5', source_note_title: '读书会讨论' },
  { text: '极度透明', weight: 58, sentiment: 'positive', level: 'opinion', source_note_id: 'note-4', source_note_title: '原则' },
  { text: '锚定效应', weight: 55, sentiment: 'critical', level: 'principle', source_note_id: 'note-1', source_note_title: '思考，快与慢' },
  { text: '元认知', weight: 70, sentiment: 'positive', level: 'principle', source_note_id: 'note-1', source_note_title: '思考，快与慢' },
  { text: '反转思维', weight: 65, sentiment: 'positive', level: 'opinion', source_note_id: 'note-6', source_note_title: '穷查理宝典' },
];

// ========== 里程碑模拟数据 ==========

export const mockMilestones: Milestone[] = [
  {
    id: 'ms-1',
    note_id: 'note-1',
    note_title: '思考，快与慢',
    date: '2025-03-15',
    title: '认知偏差的觉醒',
    description: '首次系统性地认识到大脑的非理性特征，开始反思自己日常决策中的认知偏差。这是从"自以为理性"到"承认非理性"的重要转变。',
    type: 'explore',
  },
  {
    id: 'ms-2',
    note_id: 'note-2',
    note_title: '原子习惯',
    date: '2025-04-02',
    title: '从"目标驱动"到"身份驱动"',
    description: '意识到行为改变的关键不在于设定目标，而在于身份认同的转变。这个认知颠覆了之前"只要够努力就能坚持"的观念。',
    type: 'overturn',
  },
  {
    id: 'ms-3',
    note_id: 'note-3',
    note_title: 'TEDx创造力主题放映',
    date: '2025-04-20',
    title: '跨界思维的启发',
    description: '第一次深入思考"跨领域连接"对创造力的重要性，开始反思自己过度集中在单一领域深耕的阅读习惯。',
    type: 'explore',
  },
  {
    id: 'ms-4',
    note_id: 'note-4',
    note_title: '原则',
    date: '2025-05-10',
    title: '系统化思维的建立',
    description: '将之前零散的决策方法论整合为一个系统框架，巩固了对理性决策的认知，同时开始思考系统化与人文关怀的平衡。',
    type: 'consolidate',
  },
  {
    id: 'ms-5',
    note_id: 'note-6',
    note_title: '穷查理宝典',
    date: '2025-06-01',
    title: '多元思维模型的整合',
    description: '将跨学科思维模型与之前的系统思维框架融合，形成了更完整的认知工具箱。这是从"单一模型"到"模型网格"的质变。',
    type: 'consolidate',
  },
  {
    id: 'ms-6',
    note_id: 'note-7',
    note_title: '创业失败复盘沙龙',
    date: '2025-06-10',
    title: '理论与实践的碰撞',
    description: '在真实案例中验证了《思考，快与慢》中关于确认偏误的理论，将抽象的认知科学概念与实际商业决策联系起来。',
    type: 'consolidate',
  },
];

// ========== 知识星系模拟数据 ==========

export const mockGalaxyNodes: GalaxyNode[] = [
  { id: 'star-1', name: '决策与认知', type: 'star', domain: '认知科学', related_notes: ['note-1', 'note-4', 'note-6', 'note-7'], weight: 95 },
  { id: 'star-2', name: '个人成长', type: 'star', domain: '自我管理', related_notes: ['note-2', 'note-3'], weight: 75 },
  { id: 'planet-1', name: '思考快与慢', type: 'planet', domain: '认知科学', related_notes: ['note-1'], weight: 60, position: { x: 200, y: 150 } },
  { id: 'planet-2', name: '原则', type: 'planet', domain: '认知科学', related_notes: ['note-4'], weight: 55, position: { x: -150, y: 200 } },
  { id: 'planet-3', name: '穷查理宝典', type: 'planet', domain: '认知科学', related_notes: ['note-6'], weight: 65, position: { x: 250, y: -100 } },
  { id: 'planet-4', name: '原子习惯', type: 'planet', domain: '自我管理', related_notes: ['note-2'], weight: 50, position: { x: -200, y: -150 } },
  { id: 'planet-5', name: 'TEDx创造力', type: 'planet', domain: '自我管理', related_notes: ['note-3'], weight: 45, position: { x: -100, y: -250 } },
  { id: 'planet-6', name: '创业复盘沙龙', type: 'planet', domain: '认知科学', related_notes: ['note-7'], weight: 40, position: { x: 300, y: 50 } },
  { id: 'comet-1', name: '内卷与社会', type: 'comet', domain: '社会观察', related_notes: ['note-5'], weight: 30 },
  { id: 'comet-2', name: '庄子哲学', type: 'comet', domain: '哲学', related_notes: ['note-5'], weight: 25 },
];

export const mockGalaxyEdges: GalaxyEdge[] = [
  { source: 'star-1', target: 'planet-1', strength: 0.9 },
  { source: 'star-1', target: 'planet-2', strength: 0.8 },
  { source: 'star-1', target: 'planet-3', strength: 0.85 },
  { source: 'star-1', target: 'planet-6', strength: 0.7 },
  { source: 'star-2', target: 'planet-4', strength: 0.8 },
  { source: 'star-2', target: 'planet-5', strength: 0.7 },
  { source: 'star-1', target: 'star-2', strength: 0.5 },
  { source: 'planet-1', target: 'planet-6', strength: 0.6 },
  { source: 'planet-3', target: 'planet-2', strength: 0.5 },
  { source: 'star-2', target: 'comet-1', strength: 0.3 },
  { source: 'comet-1', target: 'comet-2', strength: 0.4 },
];

// ========== 思考风格模拟数据 ==========

export const mockThinkingStyle: ThinkingStyle = {
  type: '跨界联想型思辨者',
  description: '你善于在不同书籍和领域之间建立关联，从认知科学到创业实践，从习惯设计到社会观察，你的思考路径总是跨越边界。同时，你具有较强的批判性思维，不会轻易接受一个观点，而是习惯性地追问"为什么"和"如果不是呢"。',
  traits: [
    '善于发现不同领域之间的隐含关联',
    '习惯性地对权威观点提出质疑',
    '喜欢从反面思考问题（反转思维）',
    '倾向于寻找底层规律而非停留在表面现象',
    '在读书笔记中经常产生新的问题而非结论',
  ],
  catchphrases: [
    '这让我联想到...',
    '反过来想...',
    '本质上这是...',
    '一个未解决的问题是...',
    '这让我反思自己的...',
  ],
};

// ========== 书籍推荐模拟数据 ==========

export const mockBookRecommendations: BookRecommendation[] = [
  {
    title: '反脆弱',
    author: '纳西姆·塔勒布',
    reason: '你读了很多关于决策和认知偏差的书，但缺少对"不确定性"本身的深入思考。塔勒布的"反脆弱"概念能补上你知识体系中关于"如何在不可预测的世界中获益"这一关键环节。',
    gap_type: 'weak_area',
    related_notes: ['note-1', 'note-4'],
    urgency: 'high',
  },
  {
    title: '人的自我寻求',
    author: '罗洛·梅',
    reason: '你的笔记多次涉及"身份认同"和"内卷/躺平"的话题，但缺乏从存在主义心理学角度的深层分析。这本书能帮你从更根本的层面理解"我是谁"这个问题。',
    gap_type: 'shallow_topic',
    related_notes: ['note-2', 'note-5'],
    urgency: 'high',
  },
  {
    title: '哥德尔、艾舍尔、巴赫',
    author: '侯世达',
    reason: '你喜欢跨学科思考和多元模型，但缺少一个真正将数学、艺术和哲学融为一体的深度阅读体验。这本书是"跨界联想"的终极范本。',
    gap_type: 'weak_area',
    related_notes: ['note-3', 'note-6'],
    urgency: 'medium',
  },
  {
    title: '系统之美',
    author: '德内拉·梅多斯',
    reason: '你对系统化思维很感兴趣（《原则》和《穷查理宝典》），但目前缺少专业的系统论视角。这本书能让你从"类比式系统思维"升级到"真正的系统思维"。',
    gap_type: 'shallow_topic',
    related_notes: ['note-4', 'note-6'],
    urgency: 'medium',
  },
  {
    title: '被讨厌的勇气',
    author: '岸见一郎',
    reason: '你在读书笔记中多次提到"理性与情感的平衡"问题，而阿德勒心理学恰好从"课题分离"的角度提供了一种实践性的解决方案，可能帮你理清"系统思维与人文关怀"之间的矛盾。',
    gap_type: 'contradiction',
    related_notes: ['note-4', 'note-5'],
    urgency: 'low',
  },
];

// ========== 概念网络模拟数据 ==========

export const mockConceptNodes: ConceptNode[] = [
  {
    id: 'concept-1',
    name: '认知偏差',
    occurrences: 4,
    related_notes: [
      { note_id: 'note-1', note_title: '思考，快与慢', snippet: '知道认知偏差的存在并不能完全消除它的影响' },
      { note_id: 'note-7', note_title: '创业失败复盘沙龙', snippet: '确认偏误在创业场景下被放大到了危险的程度' },
      { note_id: 'note-6', note_title: '穷查理宝典', snippet: '25种常见的人类认知偏差' },
      { note_id: 'note-4', note_title: '原则', snippet: '犯错时写错误日志分析根因' },
    ],
  },
  {
    id: 'concept-2',
    name: '复利效应',
    occurrences: 3,
    related_notes: [
      { note_id: 'note-6', note_title: '穷查理宝典', snippet: '复利效应不仅适用于金钱，也适用于知识、关系和习惯' },
      { note_id: 'note-2', note_title: '原子习惯', snippet: '微习惯链的长期积累效果' },
      { note_id: 'note-4', note_title: '原则', snippet: '通过迭代的机器来积累' },
    ],
  },
  {
    id: 'concept-3',
    name: '系统化思维',
    occurrences: 3,
    related_notes: [
      { note_id: 'note-4', note_title: '原则', snippet: '把生活和工作中的一切都看作可以迭代的机器' },
      { note_id: 'note-6', note_title: '穷查理宝典', snippet: '把这些模型像格栅一样交叉使用' },
      { note_id: 'note-7', note_title: '创业失败复盘沙龙', snippet: '通过仪式化的反思来对抗情感驱动' },
    ],
  },
  {
    id: 'concept-4',
    name: '身份认同',
    occurrences: 2,
    related_notes: [
      { note_id: 'note-2', note_title: '原子习惯', snippet: '当我不再说"我要减肥"而是说"我是一个运动者"时' },
      { note_id: 'note-5', note_title: '读书会讨论', snippet: '找到"自己的游戏"，定义自己的评价标准' },
    ],
  },
  {
    id: 'concept-5',
    name: '跨界思维',
    occurrences: 2,
    related_notes: [
      { note_id: 'note-3', note_title: 'TEDx创造力主题放映', snippet: '真正的创新往往发生在领域的交叉点上' },
      { note_id: 'note-6', note_title: '穷查理宝典', snippet: '从不同的学科中提取最核心的模型' },
    ],
  },
  {
    id: 'concept-6',
    name: '理性与情感的平衡',
    occurrences: 3,
    related_notes: [
      { note_id: 'note-4', note_title: '原则', snippet: '过于系统化可能导致过度理性化，忽略情感和直觉的价值' },
      { note_id: 'note-1', note_title: '思考，快与慢', snippet: '建立外部化的决策流程还是训练元认知能力' },
      { note_id: 'note-7', note_title: '创业失败复盘沙龙', snippet: '强制理性通过仪式化反思来对抗情感驱动' },
    ],
  },
];

export const mockConceptEdges: ConceptEdge[] = [
  { source: 'concept-1', target: 'concept-3', relation: '认知偏差需要系统化思维来应对' },
  { source: 'concept-1', target: 'concept-6', relation: '理性与情感的张力源于认知偏差' },
  { source: 'concept-2', target: 'concept-3', relation: '复利效应是系统化思维的核心机制' },
  { source: 'concept-2', target: 'concept-4', relation: '身份认同的复利效应' },
  { source: 'concept-3', target: 'concept-5', relation: '系统化思维促进跨界关联' },
  { source: 'concept-4', target: 'concept-6', relation: '身份认同影响理性与情感的平衡' },
  { source: 'concept-5', target: 'concept-1', relation: '跨界思维帮助发现新的认知偏差' },
];

// ========== 金句模拟数据 ==========

export const mockGoldenQuotes: GoldenQuote[] = [
  { id: 'q-1', text: '知道认知偏差的存在并不能完全消除它的影响，但我们可以通过建立检查清单来减少其影响。', source_note_id: 'note-1', source_note_title: '思考，快与慢', theme: '认知科学', score: 92 },
  { id: 'q-2', text: '最关键的不是习惯本身，而是"身份认同"的转变。当我不再说"我要减肥"而是说"我是一个运动者"时，一切都变得自然了。', source_note_id: 'note-2', source_note_title: '原子习惯', theme: '自我管理', score: 88 },
  { id: 'q-3', text: '真正的创新往往发生在领域的交叉点上。创造力不是一种天赋，而是一种连接能力。', source_note_id: 'note-3', source_note_title: 'TEDx创造力主题放映', theme: '创新', score: 90 },
  { id: 'q-4', text: '系统思维和人文关怀之间，是否存在一种平衡？这可能是比建立系统本身更重要的问题。', source_note_id: 'note-4', source_note_title: '原则', theme: '哲学', score: 95 },
  { id: 'q-5', text: '既不完全内卷也不完全躺平，而是找到"自己的游戏"——不在别人的赛道上竞争，而是定义自己的评价标准。', source_note_id: 'note-5', source_note_title: '读书会讨论', theme: '人生哲学', score: 93 },
  { id: 'q-6', text: '当多个模型指向同一个结论时，你的判断大概率是正确的。', source_note_id: 'note-6', source_note_title: '穷查理宝典', theme: '思维模型', score: 85 },
  { id: 'q-7', text: '大部分创业失败不是因为产品不好，而是因为创始人对自己不够诚实。', source_note_id: 'note-7', source_note_title: '创业失败复盘沙龙', theme: '创业', score: 87 },
  { id: 'q-8', text: '了解自己什么时候精力最好、什么场景最容易触发行为、什么样的奖励对你真正有效——这才是习惯方法论的共同前提。', source_note_id: 'note-2', source_note_title: '原子习惯', theme: '自我认知', score: 82 },
];

// ========== 周报模拟数据 ==========

export const mockWeeklyBrief: WeeklyBrief = {
  id: 'brief-1',
  week_start: '2025-06-09',
  week_end: '2025-06-15',
  insights: [
    '理论与实践的闭环正在形成：创业复盘沙龙让你将《思考，快与慢》中的确认偏误理论在真实案例中得到了验证。',
    '多元思维模型开始发挥作用：你正在不自觉地将不同书中的模型交叉使用，这是从"知识积累"到"知识整合"的重要跨越。',
    '情感与理性的平衡成为新的探索方向：多篇笔记中反复出现这个主题，说明它正在成为你下一个需要深入思考的核心议题。',
  ],
  question: '如何在保持系统化思维优势的同时，不失去对情感和直觉的敏感度？',
  highlights: [
    '本周笔记产出量较上周增长 40%',
    '首次将哲学视角（庄子）引入社会话题讨论',
  ],
  created_at: '2025-06-15',
};
