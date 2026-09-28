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
    const [reasoning, textResponse] = await getEmbedding(text, searchType);
    setLlmResponse([reasoning, textResponse]);
  };

  useEffect(() => {}, [text]);

  return (
    <>
      <LLMOutput agentResponse={llmResponse} />
      <div className="input-container">
        <UserInput handleTextChange={handleTextChange} />
        <button onClick={() => sendToLLM()} className="submit-button">
          Submit
        </button>
      </div>
    </>
  );
}

export default Chat;
