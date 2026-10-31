import type {
  HistoryResponse,
  LlmResponse,
  RetrievedContext,
} from "../types/types";

export async function getEmbedding(
  query: string,
  searchType: string,
  threadId?: string,
): Promise<EmbeddingResponse> {
  const response = await fetch("http://localhost:5000/api/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, searchType, threadId }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export type EmbeddingResponse = LlmResponse;
export type DevResponse = [string, string, string, RetrievedContext[] | null];

export async function getDevMessage(
  query: string,
  searchType: string,
  threadId?: string,
): Promise<DevResponse> {
  const response = await fetch("http://localhost:5000/api/dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, searchType, threadId }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export async function getHistory(): Promise<HistoryResponse> {
  const response = await fetch("http://localhost:5000/api/history", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  console.log("History response:", response);

  return response.json();
}
