import { marked } from "marked";
import { useState } from "react";
import type { LlmResponse } from "../types/types";

function LLMOutput({ agentResponse }: { agentResponse: LlmResponse }) {
  const [showReasoning, setShowReasoning] = useState(false);
  const reasoning = agentResponse[0];
  const reasoningText = reasoning.replace(/\\n/g, "\n");

  const response = agentResponse[1];
  const responseText = response.replace(/\\n/g, "\n");
  const usage = agentResponse[4];

  return (
    <div className="space-y-4">
      {reasoning && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <button onClick={() => setShowReasoning((visible) => !visible)} className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Reasoning</span>
            <span className="text-brand">{showReasoning ? "Hide" : "Show"}</span>
          </button>
          {showReasoning && <div className="markdown-content mt-3 border-t border-slate-200 pt-3 text-sm leading-7 text-slate-600" dangerouslySetInnerHTML={{ __html: marked.parse(reasoningText) }} />}
        </div>
      )}
      {response ? (
        <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-brand"><span className="h-2 w-2 rounded-full bg-brand" />Assistant</div>
          <div className="markdown-content text-sm leading-7 text-ink" dangerouslySetInnerHTML={{ __html: marked.parse(responseText) }} />
        </article>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center text-sm text-slate-400">Your grounded answer will appear here.</div>
      )}
      {usage && (
        <p className="text-xs text-slate-500">
          Reported tokens: {usage.inputTokens} input, {usage.outputTokens} output, {usage.totalTokens} total
          {` (${usage.callsWithUsage}/${usage.modelCalls} model calls reported usage)`}
        </p>
      )}
    </div>
  );
}

export default LLMOutput;
