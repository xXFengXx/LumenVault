import type { QaAnswer } from '../shared/types';
import { PersistenceService } from './persistence-service';

export class QaService {
  constructor(private readonly persistence: PersistenceService) {}
  async ask(question: string): Promise<QaAnswer> {
    const words = question.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    const matches: Array<{ score: number; documentId: string; title: string; excerpt: string }> = [];
    for (const document of await this.persistence.listDocuments()) {
      const content = await this.persistence.readContent(document.id);
      const paragraphs = content.split(/\n\s*\n/).filter(Boolean);
      for (const paragraph of paragraphs) { const lower = paragraph.toLowerCase(); const score = words.filter((word) => lower.includes(word)).length; if (score > 0) matches.push({ score, documentId: document.id, title: document.title, excerpt: paragraph.slice(0, 240) }); }
    }
    matches.sort((a, b) => b.score - a.score); const citations = matches.slice(0, 3).map(({ documentId, title, excerpt }) => ({ documentId, title, excerpt }));
    return citations.length ? { answer: `在本地文档中找到了 ${citations.length} 条相关内容，请查看下方引用。`, confidence: 0.85, citations } : { answer: '本地知识库中暂未找到相关内容。请尝试换一种问法，或先导入文档。', confidence: 0.3, citations: [] };
  }
}
