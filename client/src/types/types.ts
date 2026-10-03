export type SearchType = "BM25" | "BM25Extended" | "SemanticExtended";

export interface ChatProps {
  searchType: SearchType;
  onQuerySubmitted: () => void | Promise<void>;
  llmResponse: [string, string];
  setLlmResponse: (response: [string, string]) => void;
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
  createdAt: Date;
}
