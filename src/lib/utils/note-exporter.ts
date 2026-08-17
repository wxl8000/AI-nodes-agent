// Copyright 2026 WXL8000
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * TXT 笔记导出工具
 * 将笔记数据序列化为与 note-parser.ts 解析规则一致的 TXT 格式
 *
 * 导出格式：
 *   第1行: YYYY.MM.DD HH:MM （日期时间）
 *   第2行: 标题
 *   第3行（可选）: 来源名称（当来源名称与标题不同时）
 *   后续行: 正文内容
 */

import type { Note } from '@/types';

/**
 * 将 ISO 日期字符串格式化为 YYYY.MM.DD HH:MM
 */
function formatDateTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hour}:${minute}`;
  } catch {
    return isoStr;
  }
}

/**
 * 清理文件名中不合法的字符
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100); // 限制文件名长度
}

/**
 * 将单条笔记序列化为 TXT 格式字符串
 * 格式与 note-parser.ts 的解析规则一致
 */
function noteToTxt(note: Note): string {
  const lines: string[] = [];

  // 第1行：日期时间
  lines.push(formatDateTime(note.created_at));

  // 第2行：标题
  lines.push(note.title);

  // 第3行：来源名称（仅当与标题不同时输出）
  if (note.source_name && note.source_name !== note.title) {
    lines.push(note.source_name);
  }

  // 正文内容
  lines.push(note.content);

  return lines.join('\n');
}

export { noteToTxt, formatDateTime, sanitizeFileName };

/**
 * 将单条笔记导出为 TXT 并触发浏览器下载
 */
export function exportSingleNote(note: Note): void {
  const txt = noteToTxt(note);
  const fileName = `${sanitizeFileName(note.title)}.txt`;
  downloadTextFile(txt, fileName);
}

/**
 * 批量导出笔记为 ZIP 文件并触发浏览器下载
 * @param notes 要导出的笔记列表
 * @param zipName 可选的 ZIP 文件名（不含 .zip 后缀）
 */
export async function exportNotesAsZip(notes: Note[], zipName?: string): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // 处理文件名冲突：同名笔记添加序号
  const nameCountMap = new Map<string, number>();

  for (const note of notes) {
    const txt = noteToTxt(note);
    let baseName = sanitizeFileName(note.title);

    const count = nameCountMap.get(baseName) || 0;
    nameCountMap.set(baseName, count + 1);
    if (count > 0) {
      baseName = `${baseName}_${count + 1}`;
    }

    zip.file(`${baseName}.txt`, txt);
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fileName = zipName || `笔记导出_${timestamp}`;
  downloadBlob(blob, `${fileName}.zip`);
}

/**
 * 触发浏览器下载文本文件
 */
function downloadTextFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, fileName);
}

/**
 * 触发浏览器下载 Blob
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
