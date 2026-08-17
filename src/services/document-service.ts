import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentMeta } from '../shared/types';
import { PersistenceService } from './persistence-service';

export class DocumentService {
  constructor(private readonly persistence: PersistenceService) {}
  list(): Promise<DocumentMeta[]> { return this.persistence.listDocuments(); }
  async importFiles(paths: string[]): Promise<DocumentMeta[]> {
    const documents = await this.list();
    const imported: DocumentMeta[] = [];
    for (const filePath of paths) {
      const stat = await fs.stat(filePath);
      if (stat.size > 10 * 1024 * 1024) throw new Error('文件不能超过 10 MB');
      const content = await fs.readFile(filePath, 'utf8');
      const filename = path.basename(filePath);
      const document: DocumentMeta = { id: randomUUID(), title: path.parse(filename).name, filename, size: stat.size, importedAt: new Date().toISOString(), indexed: true };
      await this.persistence.saveContent(document.id, content);
      documents.unshift(document); imported.push(document);
    }
    await this.persistence.saveDocuments(documents); return imported;
  }
  async delete(id: string): Promise<void> { await this.persistence.saveDocuments((await this.list()).filter((document) => document.id !== id)); await this.persistence.deleteContent(id); }
}
