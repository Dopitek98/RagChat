import type { HistoryEntry } from "../types/types";

interface HistoryTabProps {
  entries: HistoryEntry[];
  setLlmResponse: (response: [string, string, string]) => void;
}

function HistoryTab({ entries, setLlmResponse }: HistoryTabProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-5 py-5">
          <h2 className="mt-1 text-lg font-semibold text-ink">
            Conversation history
          </h2>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {entries.length === 0 ? (
            <p className="px-2 py-4 text-sm leading-6 text-slate-500">
              Your previous queries will appear here.
            </p>
          ) : (
            entries.map((entry) => {
              const firstMessage = entry.messages[0];
              const lastMessage = entry.messages[entry.messages.length - 1];

              return (
                <article
                  key={entry.threadId}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:border-brand/40 hover:bg-brand/5"
                  onClick={() =>
                    setLlmResponse([
                      lastMessage.queryReasoning,
                      lastMessage.queryResult,
                      entry.threadId,
                    ])
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setLlmResponse([
                        lastMessage.queryReasoning,
                        lastMessage.queryResult,
                        entry.threadId,
                      ]);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <p className="line-clamp-3 text-sm font-medium leading-5 text-ink">
                    {firstMessage.userQuery}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {entry.messageCount} user message
                    {entry.messageCount === 1 ? "" : "s"}
                  </p>
                  <span className="mt-2 inline-flex rounded-md bg-brand/10 px-2 py-1 text-[11px] font-semibold text-brand">
                    {firstMessage.searchType}
                  </span>
                </article>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}

export default HistoryTab;
