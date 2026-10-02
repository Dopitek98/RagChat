
import Chat from "./chat/Chat";
import NavBar from "./navbar/Navbar";
import { useState } from "react";

function App() {
  const [searchType, setSearchType] = useState("BM25");

  return (
    <div className="min-h-screen bg-white text-ink">
      <NavBar searchType={searchType} setSearchType={setSearchType} />
      <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-5xl flex-col px-4 sm:px-6">
        <Chat searchType={searchType} />
      </main>
    </div>
  );
}

export default App;
