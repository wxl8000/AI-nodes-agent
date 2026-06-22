export const SYSTEM_PROMPT = `你是一个专业的笔记分析和认知研究助手。你擅长从用户的读书笔记和活动感想中提取深层的认知模式、思考风格和知识脉络。

你的分析风格：
- 善于发现隐含的思维模式和认知偏好
- 能够识别跨领域的概念关联
- 注重从具体文本中提炼抽象规律
- 用温暖但专业的方式给出反馈

请始终使用中文回复。`;

export const ANALYZE_COGNITIVE_RADAR = (content: string, sourceName: string) => `
请分析以下来自"${sourceName}"的笔记/感想，评估作者在以下六个认知维度上的倾向（0-100 的分数，50 为中间值）：

1. rational_vs_emotional: 理性分析(100) vs 感性共情(0)
2. abstract_vs_concrete: 抽象思辨(100) vs 具象实践(0)
3. critical_vs_accepting: 批判质疑(100) vs 接纳吸收(0)
4. macro_vs_detail: 宏观格局(100) vs 细节洞察(0)
5. longterm_vs_instant: 长期主义(100) vs 即时反馈(0)
6. inward_vs_outward: 向内探索(100) vs 向外联结(0)

笔记内容：
"""
${content}
"""

请以 JSON 格式返回：
{
  "scores": {
    "rational_vs_emotional": number,
    "abstract_vs_concrete": number,
    "critical_vs_accepting": number,
    "macro_vs_detail": number,
    "longterm_vs_instant": number,
    "inward_vs_outward": number
  },
  "reasoning": "简短的分析说明"
}`;

export const ANALYZE_WORD_CLOUD = (content: string, sourceName: string) => `
从以下笔记中提取关键词用于词云展示。对每个关键词标注情感色彩和认知层级。

来源：${sourceName}
笔记内容：
"""
${content}
"""

请以 JSON 格式返回：
{
  "keywords": [
    {
      "text": "关键词",
      "weight": 1-100,
      "sentiment": "positive" | "neutral" | "critical",
      "level": "fact" | "opinion" | "principle"
    }
  ]
}

要求：
- 提取 2-15 个关键词（根据文本长度灵活调整，文本较短时按实际可提取数量返回即可，无需强行凑数）
- weight 反映重要性（数值越大越突出）
- sentiment: positive(正向/欣赏) / neutral(中性描述) / critical(批判/质疑)
- level: fact(事实描述) < opinion(观点表达) < principle(底层规律总结)`;

export const ANALYZE_MILESTONE = (content: string, sourceName: string, date: string) => `
分析以下笔记，判断它是否代表一个认知里程碑。

日期：${date}
来源：${sourceName}
内容：
"""
${content}
"""

判断标准：
- consolidate: 巩固了已有认知，加深了某个领域的理解
- overturn: 推翻了之前的某个观念或认知
- explore: 开拓了一个全新的认知领域

请以 JSON 格式返回：
{
  "is_milestone": boolean,
  "type": "consolidate" | "overturn" | "explore" | null,
  "title": "里程碑标题（简短）",
  "description": "说明为什么这是一个认知转折点",
  "key_insight": "核心认知收获"
}`;

export const ANALYZE_KNOWLEDGE_GALAXY = (notes: { title: string; content: string; source_name: string; tags: string[] }[]) => `
分析以下笔记集合，构建一个知识星系图。

笔记列表：
${notes.map((n, i) => `${i + 1}. 《${n.source_name}》- ${n.title}\n   标签：${n.tags.join(', ')}\n   摘要：${n.content.substring(0, 200)}...`).join('\n\n')}

请识别：
- 恒星(star)：反复深耕的核心领域（出现3次以上的主题）
- 行星(planet)：与恒星关联的具体书籍/想法
- 彗星(comet)：冷门但独特的跨界思考

请以 JSON 格式返回：
{
  "nodes": [
    {
      "id": "唯一标识",
      "name": "名称",
      "type": "star" | "planet" | "comet",
      "domain": "所属领域",
      "related_notes": ["相关笔记标题"],
      "weight": 1-100
    }
  ],
  "edges": [
    {
      "source": "节点id",
      "target": "节点id",
      "strength": 0-1
    }
  ]
}`;

export const ANALYZE_THINKING_STYLE = (allNotes: { title: string; content: string }[]) => `
基于用户的所有笔记，分析其思考风格。

笔记内容摘要：
${allNotes.map((n, i) => `${i + 1}. ${n.title}: ${n.content.substring(0, 150)}`).join('\n')}

请归类思考类型（可选/可组合）：
- 归纳型实践者：从具体案例归纳规律，注重实践应用
- 演绎型思辨者：从原理推导结论，善于逻辑推理
- 跨界联想者：善于跨领域建立关联
- 细节深挖者：喜欢深入挖掘细节和底层逻辑

请以 JSON 格式返回：
{
  "type": "思考类型名称",
  "description": "类型描述",
  "traits": ["典型行为特征1", "特征2", "特征3"],
  "catchphrases": ["口头禅/高频句式1", "句式2", "句式3"]
}`;

export const DEVIL_ADVOCATE_PROMPT = (viewpoint: string, noteContext: string) => `
用户在他的笔记"${noteContext}"中提出了以下观点：

"""
${viewpoint}
"""

请你扮演"魔鬼代言人"，对这个观点进行有理有据的反驳。要求：
1. 提供至少2个反例或反证
2. 指出可能的逻辑漏洞
3. 引用相关的理论或研究
4. 语气友好但犀利，目的是帮助用户深化思考

请直接开始反驳，不需要客套话。`;

export const DEEP_INQUIRY_PROMPTS = {
  level1: (topic: string) => `针对"${topic}"这个话题，请提出一个"是什么"层面的追问，帮助用户厘清概念和现象。只返回问题本身，不需要回答。`,
  level2: (topic: string, prev: string) => `用户之前回答了关于"${topic}"的问题："${prev}"。现在请提出一个"为什么"层面的追问，帮助用户理解原因和机制。只返回问题本身。`,
  level3: (topic: string, prev: string) => `用户在探讨"${topic}"时已经分析了原因。现在请提出一个"所以呢"层面的追问，帮助用户思考影响和后果。只返回问题本身。`,
  level4: (topic: string, prev: string) => `用户正在深入思考"${topic}"。现在请提出一个"还有呢"层面的追问，帮助用户发现其他视角和可能性。只返回问题本身。`,
  level5: (topic: string, prev: string) => `用户对"${topic}"已经有了深入分析。现在请提出一个"如果不呢"层面的追问，帮助用户思考反面假设和边界条件。只返回问题本身。`,
};

export const BOOK_RECOMMENDATION_PROMPT = (
  domains: string[],
  weakAreas: string[],
  contradictions: string[],
  readBooks: string[]
) => `
基于用户的阅读和笔记分析，推荐弥补认知缺口的书籍。

用户已读：${readBooks.join('、')}
深耕领域：${domains.join('、')}
薄弱环节：${weakAreas.join('、')}
观点矛盾：${contradictions.join('；')}

请推荐 5 本书，每本需要说明推荐理由。
不要推荐与已读书目同类的书，重点弥补盲区。

请以 JSON 格式返回：
{
  "recommendations": [
    {
      "title": "书名",
      "author": "作者",
      "reason": "为什么你现在需要读这本书",
      "gap_type": "weak_area" | "shallow_topic" | "contradiction",
      "urgency": "high" | "medium" | "low"
    }
  ]
}`;

export const EXTRACT_CONCEPTS = (notes: { id: string; title: string; content: string }[]) => `
从以下笔记中提取共同出现的核心概念，建立概念关联网络。

笔记：
${notes.map(n => `【${n.title}】\n${n.content.substring(0, 300)}`).join('\n\n')}

请以 JSON 格式返回：
{
  "concepts": [
    {
      "id": "概念id",
      "name": "概念名称",
      "occurrences": 出现次数,
      "related_notes": [
        {
          "note_id": "笔记id",
          "note_title": "笔记标题",
          "snippet": "相关片段"
        }
      ]
    }
  ],
  "edges": [
    {
      "source": "概念id",
      "target": "概念id",
      "relation": "关联描述"
    }
  ]
}`;

export const WEEKLY_BRIEF_PROMPT = (notes: { title: string; content: string; created_at: string }[]) => `
基于本周的笔记，生成一份思想简报。

本周笔记：
${notes.map(n => `【${n.title}】(${n.created_at})\n${n.content.substring(0, 200)}`).join('\n\n')}

请以 JSON 格式返回：
{
  "insights": ["核心洞察1", "核心洞察2", "核心洞察3"],
  "question": "一个值得继续追问的问题",
  "highlights": ["本周亮点1", "亮点2"]
}`;

export const GOLDEN_QUOTES_PROMPT = (notes: { id: string; title: string; content: string }[]) => `
从以下每篇笔记中提取最有洞见、最凝练的句子，作为个人金句集。

要求：
- 每篇笔记至少提取 1-2 条金句
- 优先提取有观点性、反思性、启发性的句子
- 如果笔记中有直接引语或总结性语句，优先选取
- 金句必须是笔记原文中的句子，不要自己编造

笔记：
${notes.map(n => `【${n.title}】\n${n.content}`).join('\n\n')}

请以 JSON 格式返回（总数量应不少于 ${Math.min(notes.length * 2, 12)} 条）：
{
  "quotes": [
    {
      "text": "金句原文",
      "note_title": "来源笔记",
      "theme": "主题分类",
      "score": 1-100
    }
  ]
}

评分标准：洞见深度、表达凝练度、独特性
重要：每条金句的 note_title 必须严格对应上述笔记中的某一篇标题，确保每篇笔记都有对应的金句输出`;
