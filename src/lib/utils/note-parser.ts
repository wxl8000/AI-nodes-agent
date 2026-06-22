/**
 * TXT 笔记解析工具
 * 解析格式：
 *   第1行: MM.DD HH:MM （日期时间）
 *   第2行: 标题
 *   第3行（可选）: 来源/作者信息
 *   后续行: 正文内容
 */

import type { Note } from '@/types';

export interface ParsedNote {
  title: string;
  content: string;
  source_type: Note['source_type'];
  source_name: string;
  created_at: string; // ISO date string
  tags: string[];
}

/**
 * 解析 TXT 第一行的日期时间
 * 支持格式：MM.DD HH:MM / YYYY.MM.DD HH:MM / YYYY-MM-DD
 * 返回 ISO 格式日期字符串
 */
function parseDateTime(line: string): string {
  const trimmed = line.trim();

  // 格式1: YYYY.MM.DD HH:MM
  const fullMatch = trimmed.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
  if (fullMatch) {
    const year = parseInt(fullMatch[1], 10);
    const month = parseInt(fullMatch[2], 10);
    const day = parseInt(fullMatch[3], 10);
    const hour = parseInt(fullMatch[4], 10);
    const minute = parseInt(fullMatch[5], 10);
    return new Date(year, month - 1, day, hour, minute).toISOString();
  }

  // 格式2: MM.DD HH:MM
  const shortMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
  if (shortMatch) {
    const month = parseInt(shortMatch[1], 10);
    const day = parseInt(shortMatch[2], 10);
    const hour = parseInt(shortMatch[3], 10);
    const minute = parseInt(shortMatch[4], 10);
    const now = new Date();
    let year = now.getFullYear();
    if (month > now.getMonth() + 2) year -= 1;
    return new Date(year, month - 1, day, hour, minute).toISOString();
  }

  // 格式3: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  return new Date().toISOString().split('T')[0];
}

/**
 * 判断某行是否为日期格式
 * 支持: MM.DD HH:MM / YYYY.MM.DD HH:MM / YYYY-MM-DD
 */
function isDateLine(line: string): boolean {
  const trimmed = line.trim();
  return /^\d{1,2}\.\d{1,2}\s+\d{1,2}:\d{2}$/.test(trimmed) ||
         /^\d{4}\.\d{1,2}\.\d{1,2}\s+\d{1,2}:\d{2}$/.test(trimmed) ||
         /^\d{4}-\d{2}-\d{2}/.test(trimmed);
}

/**
 * 从标题和内容推断 source_type
 * 优先级：来源行关键词 > 标题特征 > 内容特征
 */
function inferSourceType(sourceLine: string, title: string, content: string): Note['source_type'] {
  const combined = (sourceLine + ' ' + title).toLowerCase();

  // 0. 经历类关键词（面试、实习、答辩等）
  if (/面试|实习|答辩|offer|入职|离职|求职|简历|校招|社招|转正|述职/.test(combined)) return 'experience';

  // 1. 来源行/标题中的强关键词
  if (/大会|会议|沙龙|活动|ted|论坛|讲座|演讲|峰会|展览/.test(combined)) return 'activity';
  if (/教授|专家|顾问|作者|记者|研究员|战略|博士/.test(combined)) return 'article';

  // 2. 标题特征识别书籍
  //    - 书名号《》
  //    - 标题含数字编号（如“变量4”“金融危机500年”）
  //    - 标题像书名（短且无动词句式）
  if (/《.*》/.test(title)) return 'book';
  if (/\d+[年天]|^.{2,8}[-\u2014].{2,}/.test(title) && title.length < 30) return 'book';

  // 3. 内容特征识别
  const contentPreview = content.substring(0, 500);
  //    - 有明确章节标记（一、二、三...）
  if (/^[一二三四五六七八九十]+、/m.test(content)) {
    // 有章节 + 内容较长 = 可能是书籍笔记或文章
    if (content.length > 500) return 'book';
    return 'article';
  }
  //    - 纯感想/随想特征（短句、个人语气）
  if (/感想|我觉得|我认为|我的感受|最大的感触|让我想到/.test(contentPreview)) {
    if (!sourceLine) return 'thought';
  }

  // 4. 来源行关键词
  if (/书|读|笔记|著|编|出版/.test(combined)) return 'book';

  // 5. 默认：如果内容较长且结构化，视为文章；否则随想
  if (content.length > 800 && !sourceLine) return 'article';
  return 'thought';
}

/**
 * 从来源行提取来源名称（去除多余符号）
 */
function cleanSourceName(line: string): string {
  // 去除常见分隔符和前缀
  return line
    .replace(/^[|｜\s]+/, '')
    .replace(/\s*\|\s*/g, ' · ')
    .trim();
}

/**
 * 解析 TXT 笔记文本为结构化数据
 */
export function parseNoteText(text: string, fileName?: string): ParsedNote {
  const lines = text.split('\n');

  let dateStr = new Date().toISOString();
  let title = '';
  let sourceName = '';
  let contentStartIndex = 0;

  // 第1行：检查是否为日期
  if (lines.length > 0 && isDateLine(lines[0])) {
    dateStr = parseDateTime(lines[0]);
    contentStartIndex = 1;
  }

  // 第2行：标题
  if (lines.length > contentStartIndex) {
    title = lines[contentStartIndex].trim();
    contentStartIndex++;
  }

  // 第3行：判断是否为来源/作者行（非空且不像是正文开头）
  if (lines.length > contentStartIndex) {
    const thirdLine = lines[contentStartIndex].trim();
    // 如果第三行较短（< 60字）且包含作者/来源特征，视为来源行
    const isSourceLine = thirdLine.length > 0 &&
      thirdLine.length < 60 &&
      !/[。？！：:；;，,]/.test(thirdLine) && // 排除含标点符号的内容行
      (/[|｜]/.test(thirdLine) ||
       /教授|专家|顾问|作者|记者|研究员|博士|先生|女士/.test(thirdLine) ||
       /^[\u4e00-\u9fa5a-zA-Z\s·|｜]+$/.test(thirdLine));

    if (isSourceLine) {
      sourceName = cleanSourceName(thirdLine);
      contentStartIndex++;
    }
  }

  // 如果没有标题，用文件名
  if (!title && fileName) {
    title = fileName.replace(/\.txt$/i, '').replace(/^["""]+|["""]+$/g, '');
  }

  // 剩余内容为正文
  const contentLines = lines.slice(contentStartIndex);
  const content = contentLines.join('\n').trim();

  // 推断来源类型
  const sourceType = inferSourceType(sourceName, title, content);

  // 如果来源为空，用标题作为来源
  if (!sourceName) {
    sourceName = title;
  }

  return {
    title,
    content,
    source_type: sourceType,
    source_name: sourceName,
    created_at: dateStr,
    tags: [], // 标签后续由 AI 分析生成
  };
}

/**
 * 从文件名推断标题（备用）
 */
export function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.txt$/i, '')
    .replace(/^["""]+|["""]+$/g, '')
    .replace(/[,，]/g, ' ')
    .trim();
}
