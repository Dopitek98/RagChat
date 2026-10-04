import Chat from "./chat/Chat";
import HistoryTab from "./history/historyTab";
import NavBar from "./navbar/Navbar";
import { useState, useEffect } from "react";
import type { HistoryEntry, SearchType } from "./types/types";
import { getHistory } from "./api/api";

function App() {
  const [searchType, setSearchType] = useState<SearchType>("BM25");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [llmResponse, setLlmResponse] = useState<[string, string]>(["", ""]);

  const refreshHistory = async () => {
    const entries = await getHistory();
    setHistory(entries);
  };

  useEffect(() => {
    void refreshHistory();
  }, []);

  return (
    <div className="min-h-screen bg-white text-ink">
      <NavBar searchType={searchType} setSearchType={setSearchType} />
      <HistoryTab entries={history} setLlmResponse={setLlmResponse} />
      <main className="flex min-h-[calc(100vh-65px)] w-full flex-col items-center justify-center px-4 sm:px-6">
        <Chat
          searchType={searchType}
          onQuerySubmitted={refreshHistory}
          llmResponse={llmResponse}
          setLlmResponse={setLlmResponse}
        />
      </main>
    </div>
  );
}

export default App;
