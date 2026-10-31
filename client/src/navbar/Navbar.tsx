import type { NavBarProps } from "../types/types";
import Agent from "./Agent";
import SearchTypes from "./searchTypes";

function NavBar({ searchType, setSearchType, codeAnalysis, setCodeAnalysis }: NavBarProps) {

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-sm">
            R
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink sm:text-base">
            QA Agent
          </span>
        </div>
        <div className="ml-auto flex max-w-full min-w-0 items-center gap-2">
          <SearchTypes searchType={searchType} setSearchType={setSearchType} />
          <Agent enabled={codeAnalysis} onChange={setCodeAnalysis} />
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
