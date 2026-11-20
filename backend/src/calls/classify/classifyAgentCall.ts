import { SystemMessage } from "@langchain/core/messages";
import { defaultAgentClassifyModel } from "../../models/models.js";
import { defaultCodeAgentClassifyModel } from "../../models/models.js";

export const classifyAgentCall = async (state: any) => {
  const response = await defaultAgentClassifyModel.invoke(
    classificationMessages(state, "extendAgentCall"),
  );

  return {
    classifications: response.classifications,
    userQuery: state.messages[state.messages.length - 1].content,
  };
};

export const classifyCodeAgentCall = async (state: any) => {
  const response = await defaultCodeAgentClassifyModel.invoke(
    classificationMessages(state, "syntheziserCall", true),
  );

  return {
    classifications: response.classifications,
    userQuery: state.messages[state.messages.length - 1].content,
  };
};

function classificationMessages(
  state: any,
  technicalRoute: "extendAgentCall" | "syntheziserCall",
  includeJoernRoute = false,
) {
  const routingGuidance = includeJoernRoute
    ? `For code requests, prefer joernCodeAnalystCall when the user supplies a
concrete code target as described above; otherwise use ${technicalRoute}.`
    : `For software-development requests, use ${technicalRoute}.`;

  return [
    new SystemMessage(
      `
Classify the user's request for the ${technicalRoute} workflow. Return a structured
result with a classifications array. Each entry must use one of these sources:
- ${technicalRoute}: Documentation, codebase, and technical references
${includeJoernRoute ? `- joernCodeAnalystCall: Direct Joern investigation of a concrete code target
  such as an exact application error/message/log, a named Java class, or a specific method.
  Preserve exact application text in the query.
` : ""}- answerUserQueryCall: Questions outside the technical domain

Select exactly one source. Use answerUserQueryCall if the request is not related to
software development. ${routingGuidance} If the request is ambiguous, choose the
closest category without assuming unstated requirements.
      `,
    ),
    {
      role: "user",
      content: state.messages[state.messages.length - 1].content,
    },
  ];
}
