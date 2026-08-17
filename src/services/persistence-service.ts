import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DocumentMeta } from '../shared/types';

export class PersistenceService {
  private readonly contentDirectory: string;
  private readonly metadataPath: string;
  constructor(readonly dataDirectory: string) {
    this.contentDirectory = path.join(dataDirectory, 'content');
    this.metadataPath = path.join(dataDirectory, 'documents-meta.json');
  }
  async initialize(): Promise<void> {
    await Promise.all(['content', 'chunks', 'index'].map((name) => fs.mkdir(path.join(this.dataDirectory, name), { recursive: true })));
    try { await fs.access(this.metadataPath); } catch { await this.writeJson(this.metadataPath, []); }
  }
  async listDocuments(): Promise<DocumentMeta[]> { return JSON.parse(await fs.readFile(this.metadataPath, 'utf8')) as DocumentMeta[]; }
  async saveDocuments(documents: DocumentMeta[]): Promise<void> { await this.writeJson(this.metadataPath, documents); }
  async saveContent(id: string, content: string): Promise<void> { await fs.writeFile(path.join(this.contentDirectory, `${id}.txt`), content, 'utf8'); }
  async readContent(id: string): Promise<string> { return fs.readFile(path.join(this.contentDirectory, `${id}.txt`), 'utf8'); }
  async deleteContent(id: string): Promise<void> { await fs.rm(path.join(this.contentDirectory, `${id}.txt`), { force: true }); }
  private async writeJson(file: string, value: unknown): Promise<void> { const temporary = `${file}.tmp`; await fs.writeFile(temporary, JSON.stringify(value, null, 2), 'utf8'); await fs.rename(temporary, file); }
}
