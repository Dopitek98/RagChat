import { joernAnalystAgent } from "../../models/models.js";
import { agentCodeState } from "../../schema/messagesSchema.js";
import { getAgentAnswer } from "./getAgentAnswer.js";

export const joernCodeAnalystCall = async (
  state: typeof agentCodeState.State,
) => {
  const retrievedContext = state.retrievedContext;
  if (!retrievedContext?.length) {
    if (!state.isDirectJoernRequest) {
      return { retrievedContextAnswers: [] };
    }

    const response = await joernAnalystAgent.invoke(
      {
        messages: {
          role: "human",
          content: state.userQuery,
        },
      },
      { recursionLimit: 30 },
    );

    return {
      retrievedContextAnswers: [
        { answer: getAgentAnswer(response, "Joern code analyst") },
      ],
    };
  }

  const retrievedContextAnswers = [];
  for (const step of retrievedContext) {
    const response = await joernAnalystAgent.invoke(
      {
        messages: {
          role: "human",
          content: JSON.stringify(step),
        },
      },
      { recursionLimit: 40 },
    );

    retrievedContextAnswers.push({
      answer: getAgentAnswer(response, "Joern code analyst"),
      retrievedContext: step,
    });
  }

  console.log(
    "Retrieved context answers:",
    JSON.stringify(retrievedContextAnswers),
  );

  return { retrievedContextAnswers };
};
