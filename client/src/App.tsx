import "./App.css";
import Chat from "./chat/Chat";
import NavBar from "./navbar/Navbar";
import { useState } from "react";

function App() {
  const [searchType, setSearchType] = useState("BM25");

  return (
    <>
      <NavBar searchType={searchType} setSearchType={setSearchType} />
      <Chat searchType={searchType} />
    </>
  );
}

export default App;
