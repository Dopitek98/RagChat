import { marked } from "marked";
import "./LLMOutput.css";
import { useState } from "react";

function LLMOutput({ agentResponse }: { agentResponse: any }) {
  const [showReasoning, setShowReasoning] = useState(false);
  const reasoning = agentResponse[0];
  const reasoningText = reasoning.replace(/\\n/g, "\n");

  const response = agentResponse[1];
  const responseText = response.replace(/\\n/g, "\n");

  return (
    <>
      {showReasoning ? (
        <>
          <div
            className="answer"
            dangerouslySetInnerHTML={{
              __html: marked.parse(reasoningText),
            }}
          ></div>
          <button onClick={() => setShowReasoning(false)}>
            Hide reasoning
          </button>
        </>
      ) : (
        <>
          {reasoning ? (
            <button onClick={() => setShowReasoning(true)}>
              Display reasoning
            </button>
          ) : (
            <div>No reasoning available.</div>
          )}
        </>
      )}
      {response ? (
        <div
          className="answer"
          dangerouslySetInnerHTML={{
            __html: marked.parse(responseText),
          }}
        ></div>
      ) : (
        <div>No response available.</div>
      )}
    </>
  );
}

export default LLMOutput;
