export interface DocumentMeta { id: string; title: string; filename: string; size: number; importedAt: string; indexed: boolean }
export interface Citation { documentId: string; title: string; excerpt: string }
export interface QaAnswer { answer: string; confidence: number; citations: Citation[] }
export interface KnowledgeBaseApi {
  documents: { list(): Promise<DocumentMeta[]>; import(): Promise<DocumentMeta[]>; delete(id: string): Promise<void> };
  qa: { ask(question: string): Promise<QaAnswer> };
  system: { dataDirectory(): Promise<string> };
}
export const IPC_CHANNELS = { DOCUMENTS_LIST: 'documents:list', DOCUMENTS_IMPORT: 'documents:import', DOCUMENTS_DELETE: 'documents:delete', QA_ASK: 'qa:ask', DATA_DIRECTORY: 'system:data-directory' } as const;
