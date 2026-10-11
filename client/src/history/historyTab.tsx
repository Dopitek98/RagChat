import { useState } from "react";
import DiscussionHistory from "./discussionHistory";
import type { HistoryEntry, LlmResponse } from "../types/types";

interface HistoryTabProps {
  entries: HistoryEntry[];
  setLlmResponse: (response: LlmResponse) => void;
}

function HistoryTab({ entries, setLlmResponse }: HistoryTabProps) {
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);

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
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:border-brand/40 hover:bg-brand/5"
                  onClick={() =>
                    setLlmResponse([
                      lastMessage.queryReasoning,
                      lastMessage.queryResult,
                      entry.threadId,
                      lastMessage.retrievedContext ?? [],
                    ])
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setLlmResponse([
                        lastMessage.queryReasoning,
                        lastMessage.queryResult,
                        entry.threadId,
                        lastMessage.retrievedContext ?? [],
                      ]);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 line-clamp-3 text-sm font-medium leading-5 text-ink">
                      {firstMessage.userQuery}
                    </p>
                    <button
                      type="button"
                      aria-label={`${expandedThreadId === entry.threadId ? "Hide" : "Show"} previous messages`}
                      className="shrink-0 rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-brand/10 hover:text-brand focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand/30 group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpandedThreadId((current) =>
                          current === entry.threadId ? null : entry.threadId,
                        );
                      }}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          d={expandedThreadId === entry.threadId ? "m6 12 4-4 4 4" : "m6 8 4 4 4-4"}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {entry.messageCount} user message
                    {entry.messageCount === 1 ? "" : "s"}
                  </p>
                  <span className="mt-2 inline-flex rounded-md bg-brand/10 px-2 py-1 text-[11px] font-semibold text-brand">
                    {firstMessage.searchType}
                  </span>
                  {expandedThreadId === entry.threadId && (
                    <DiscussionHistory messages={entry.messages} onMessageSelect={setLlmResponse} />
                  )}
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


