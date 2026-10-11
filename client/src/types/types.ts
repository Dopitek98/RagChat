export type SearchType = "BM25" | "BM25Extended" | "SemanticExtended";

export interface RetrievedContext {
  pageContent: string;
  source: string;
  fromLine: number;
  toLine: number;
}

export type LlmResponse = [string, string, string, RetrievedContext[]];

export interface ChatProps {
  searchType: SearchType;
  onQuerySubmitted: () => void | Promise<void>;
  llmResponse: LlmResponse;
  setLlmResponse: (response: LlmResponse) => void;
}

export interface NavBarProps {
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
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
