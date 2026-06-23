/**
 * 轻量级实践意图检测器
 * 使用正则表达式快速扫描笔记内容，识别表达实践意图的语句
 */

export interface DetectedIntent {
  /** 匹配到的原文片段 */
  intention_text: string;
  /** 简要描述 */
  description: string;
}

// 实践意图关键词模式
const INTENT_PATTERNS = [
  // 直接尝试类
  /(?:这个?方法|这[个种]技巧|这[个种]策略|这[套种]做法)[\s,，]*(?:我?要?试试|我?要?尝试|我?要?实践)/g,
  // 计划行动类
  /(?:准备|打算|计划|决定|想要?)[\s,，]*(?:尝试|实践|应用|开始做|去?做?一下|试试)/g,
  // 下次/以后类
  /(?:下次|以后|今后|往后|将来)[\s,，]*(?:要|一定|记得|准备|打算)[\s,，]*(?:用|做|试|实践|应用|尝试)/g,
  // 从今天/现在开始类
  /(?:从今天[开始起]|从现在[开始起]|从[今明]天[开始起])[\s,，]*(?:要|开始|坚持|做)/g,
  // 值得一试类
  /(?:值得[\s,，]*(?:一试|尝试|实践|去做)|可以试试|应该试试)/g,
  // 学习应用类
  /(?:学[会到]了?[\s,，]*(?:要|准备|打算|开始)?[\s,，]*(?:用|应用|实践))/g,
  // 想要体验类
  /(?:想[\s,，]*(?:体验|尝试|试试|试一下|做一下))/g,
];

// 提取包含意图的完整句子
function extractSentence(text: string, matchIndex: number, matchLength: number): string {
  // 向前找到句子开头
  let start = matchIndex;
  while (start > 0 && !/[。！？\n.!?]/.test(text[start - 1])) {
    start--;
  }
  // 向后找到句子结尾
  let end = matchIndex + matchLength;
  while (end < text.length && !/[。！？\n.!?]/.test(text[end])) {
    end++;
  }
  return text.slice(start, end).trim();
}

/**
 * 从文本中检测实践意图
 * @param text 笔记内容
 * @returns 检测到的实践意图列表
 */
export function detectPracticeIntents(text: string): DetectedIntent[] {
  const intents: DetectedIntent[] = [];
  const seenTexts = new Set<string>();

  for (const pattern of INTENT_PATTERNS) {
    // 重置 lastIndex（正则带 g 标志）
    pattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const sentence = extractSentence(text, match.index, match[0].length);
      // 去重：避免同一句子被多个模式匹配
      if (seenTexts.has(sentence)) continue;
      seenTexts.add(sentence);

      intents.push({
        intention_text: sentence,
        description: `笔记中表达了实践意图：${match[0].trim()}`,
      });
    }
  }

  return intents;
}
