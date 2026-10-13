import type { HistoryMessage, LlmResponse } from "../types/types";

interface DiscussionHistoryProps {
  messages: HistoryMessage[];
  onMessageSelect: (response: LlmResponse) => void;
}

function DiscussionHistory({ messages, onMessageSelect }: DiscussionHistoryProps) {
  const sortedMessages = [...messages].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );

  return (
    <div className="mt-2 border-t border-slate-200 pt-2">
      <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Previous messages
      </p>
      <div className="space-y-1">
        {sortedMessages.map((message) => (
          <button
            key={message._id}
            type="button"
            className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 transition-colors hover:bg-brand/10 hover:text-ink"
            onClick={(event) => {
              event.stopPropagation();
              onMessageSelect([
                message.queryReasoning,
                message.queryResult,
                message.threadId,
                message.retrievedContext ?? [],
              ]);
            }}
          >
            <span className="line-clamp-2">{message.userQuery}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default DiscussionHistory;
