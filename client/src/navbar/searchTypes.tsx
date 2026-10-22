import type { NavBarProps, SearchType } from "../types/types";

function SearchTypes({ searchType, setSearchType }: NavBarProps) {
  const navItems: SearchType[] = [
    "BM25",
    "BM25Extended",
    "SemanticExtended",
    "Hybrid",
  ];

  return (
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
  );
}

export default SearchTypes;
