export type SearchType =
  | "BM25"
  | "BM25Extended"
  | "SemanticExtended"
  | "Hybrid";

export interface RetrievedContext {
  pageContent: string;
  source: string;
  fromLine: number;
  toLine: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  modelCalls: number;
  callsWithUsage: number;
}

export type LlmResponse = [string, string, string, RetrievedContext[], TokenUsage?];

export interface ChatProps {
  searchType: SearchType;
  codeAnalysis: boolean;
  onQuerySubmitted: () => void | Promise<void>;
  llmResponse: LlmResponse;
  setLlmResponse: (response: LlmResponse) => void;
}

export interface NavBarProps {
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
  codeAnalysis: boolean;
  setCodeAnalysis: (enabled: boolean) => void;
}

export interface HistoryEntry {
  _id: string;
  queryResult: string;
  queryReasoning: string;
  userQuery: string;
  searchType: SearchType;
  createdAt: string;
  threadId: string;
  messageCount: number;
  messages: HistoryMessage[];
}

export interface HistoryResponse {
  entries: HistoryEntry[];
}

export interface HistoryMessage {
  _id: string;
  queryResult: string;
  queryReasoning: string;
  userQuery: string;
  searchType: SearchType;
  createdAt: string;
  threadId: string;
  retrievedContext?: RetrievedContext[];
}
