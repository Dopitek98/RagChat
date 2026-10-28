import { SystemMessage } from "@langchain/core/messages";
import { defaultAgentClassifyModel } from "../../models/models.js";

export const classifyAgentCall = async (state: any) => {
  const response = await defaultAgentClassifyModel.invoke([
    new SystemMessage(
      `
Classify the user's request for the coding-agent workflow. Return a structured
result with a classifications array. Each entry must use one of these sources:
- extendQueryCall: Documentation, codebase, and technical references
- answerUserQueryCall: Questions outside the technical domain

Select every category explicitly relevant to the request, using each source at
most once. Use answerUserQueryCall if query is not related to software development; do not select multiple classifications. If the request is
ambiguous, choose the closest category without assuming unstated requirements.
      `,
    ),
    {
      role: "user",
      content: state.messages[state.messages.length - 1].content,
    },
  ]);

  return { classifications: response.classifications };
};
