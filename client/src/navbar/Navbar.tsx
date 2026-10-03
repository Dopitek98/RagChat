import type { NavBarProps } from "../types/types";
import type { SearchType } from "../types/types";

function NavBar({ searchType, setSearchType }: NavBarProps) {
  const navItems: SearchType[] = ["BM25", "BM25Extended", "SemanticExtended"];

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-sm">R</div>
          <span className="text-sm font-semibold tracking-tight text-ink sm:text-base">RAG Chat</span>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSearchType(item)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${searchType === item ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-ink"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
