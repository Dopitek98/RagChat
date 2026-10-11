import { useEffect, useState } from "react";
import UserInput from "./UserInput";
import LLMOutput from "./LLMOutput";
import { getEmbedding } from "../api/api";
import type { ChatProps } from "../types/types";
import { v4 as uuidv4 } from "uuid";

function Chat({
  searchType,
  onQuerySubmitted,
  llmResponse,
  setLlmResponse,
}: ChatProps) {
  const [text, setText] = useState("");

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  const sendToLLM = async () => {
    if (!text.trim()) return;
    setLlmResponse(["", "", "", []]);
    const [reasoning, textResponse, threadId, retrievedContext] = await getEmbedding(
      text.trim(),
      searchType,
      llmResponse[2] || uuidv4(),
    );
    setLlmResponse([
      reasoning,
      textResponse,
      threadId,
      retrievedContext ?? [],
    ]);
    await onQuerySubmitted();
  };

  useEffect(() => {}, [text, llmResponse]);

  return (
    <section className="flex w-full max-w-5xl flex-1 flex-col">
      <div className="flex-1 flex flex-col items-center justify-center py-10 sm:py-16">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              How can I help you?
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Ask a question and retrieve a grounded answer.
            </p>
          </div>
          <LLMOutput agentResponse={llmResponse} />
        </div>
      </div>
      <div className="sticky bottom-0 mx-auto w-full max-w-3xl bg-white pb-5 pt-3 sm:pb-8">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/60 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
          <UserInput handleTextChange={handleTextChange} />
          <button
            onClick={sendToLLM}
            className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-[#117eB5] focus:outline-none focus:ring-4 focus:ring-brand/20"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Using {searchType} retrieval
        </p>
      </div>
    </section>
  );
}

export default Chat;
