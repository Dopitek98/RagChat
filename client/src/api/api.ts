export async function getEmbedding(
  query: string,
  searchType: string,
  threadId?: string,
): Promise<any> {
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

export async function getHistory(): Promise<any> {
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
