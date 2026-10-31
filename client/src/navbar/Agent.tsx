function Agent({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        aria-label="Code analysis agent (experimental)"
        aria-pressed={enabled}
        aria-describedby="code-analysis-description"
        onClick={() => onChange(!enabled)}
        className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-300 ${enabled ? "bg-red-200 ring-2 ring-red-400" : "bg-red-100 hover:bg-red-200"}`}
      >
        Code analysis
      </button>
      <span id="code-analysis-description" role="tooltip" className="pointer-events-none absolute right-0 top-full z-20 mt-1 rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        experimental
      </span>
    </div>
  );
}

export default Agent;
