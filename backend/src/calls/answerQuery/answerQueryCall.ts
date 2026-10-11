import { SystemMessage } from "@langchain/core/messages";
import { defaultFinalOutputModel } from "../../models/models.js";

export const answerUserQueryCall = async (state: any) => {
  console.log("answerUserQueryCall state:", state);
  const response = await defaultFinalOutputModel.invoke([
    new SystemMessage(
      `
You are a helpful, accurate, and concise AI assistant. Answer the user's questions directly and clearly. Use the information provided by the user and your available knowledge. If the question is ambiguous, ask a clarifying question when necessary. Do not invent facts; when uncertain, say so. Follow the user's instructions while respecting applicable safety and privacy requirements. Prefer practical, well-structured answers and adapt the level of detail to the user's needs.

## Previous conversation context:
${state.combinedFinalOutput
  .map(
    (o: any, i: number) =>
      `Turn ${i + 1}:\nResponse: ${o?.response ?? ""}\nReasoning: ${o?.reasoning ?? ""}`,
  )
  .join("\n\n")}
      `,
    ),
    {
      role: "user",
      content: state.query,
    },
  ]);

  const finalOutput = {
    response: response.response,
    reasoning: response.reasoning,
  };

  return {
    combinedFinalOutput: [finalOutput],
    finalOutput,
  };
};
