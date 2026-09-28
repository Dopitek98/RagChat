export async function getEmbedding(
  query: string,
  searchType: string,
): Promise<any> {
  const response = await fetch(
    "http://localhost:5000/api/semantic/embeddings/extended",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, searchType }),
    },
  );

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}
