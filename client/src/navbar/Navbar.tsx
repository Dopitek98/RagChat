import type { NavBarProps } from "../types/types";
import "./navbar.css";

function NavBar({ searchType, setSearchType }: NavBarProps) {
  const navItems = ["BM25", "BM25Extended", "SemanticExtended"];

  return (
    <nav className="navbar">
      {navItems.map((item, index) => (
        <a
          key={index}
          href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => setSearchType(item)}
          className={searchType === item ? "active" : ""}
        >
          {item}
        </a>
      ))}
    </nav>
  );
}

export default NavBar;
