import { useEffect, useState } from "react";
import UserInput from "./UserInput";
import LLMOutput from "./LLMOutput";
import { getEmbedding } from "../api/api";
import type { ChatProps } from "../types/types";

function Chat({ searchType }: ChatProps) {
  const [text, setText] = useState("");
  const [llmResponse, setLlmResponse] = useState(["", ""]);
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  const sendToLLM = async () => {
    if (!text.trim()) return;
    const [reasoning, textResponse] = await getEmbedding(text, searchType);
    setLlmResponse([reasoning, textResponse]);
  };

  useEffect(() => {}, [text]);

  return (
    <section className="flex flex-1 flex-col">
      <div className="flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-white shadow-md shadow-brand/20">R</div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">How can I help you?</h1>
            <p className="mt-2 text-sm text-slate-500">Ask a question and retrieve a grounded answer.</p>
          </div>
          <LLMOutput agentResponse={llmResponse} />
        </div>
      </div>
      <div className="sticky bottom-0 mx-auto w-full max-w-3xl bg-white pb-5 pt-3 sm:pb-8">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/60 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
          <UserInput handleTextChange={handleTextChange} />
          <button onClick={sendToLLM} className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-[#117eB5] focus:outline-none focus:ring-4 focus:ring-brand/20" aria-label="Send message">
            Send
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">Using {searchType} retrieval</p>
      </div>
    </section>
  );
}

export default Chat;
