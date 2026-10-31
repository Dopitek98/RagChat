import { softwareDeveloperAnalystAgent } from "../../models/models.js";
import { userQuestionToSoftwareDeveloperAnalyzePrompt } from "../../prompt/userQuestionToSoftwareDeveloperAnalyzePrompt.js";
import { AgentMessagesState } from "../../schema/messagesSchema.js";
import { formatInvestigationContext } from "./investigationContext.js";

export const sofwareDeveloperCall = async (state: typeof AgentMessagesState.State) => {
  const response = await softwareDeveloperAnalystAgent.invoke(
    {
      messages: {
        role: "human",
        content: userQuestionToSoftwareDeveloperAnalyzePrompt(
          state.userQuery,
          (state.searchQueries ?? []).slice(0, state.currentStepIndex).join("\n"),
          state.graphifyOutput ?? "",
          formatInvestigationContext(state),
        ),
      },
    },
    {
      recursionLimit: 50, // default is typically 25
    },
  );

  const developerResponse = response.messages.at(-1)?.text || "no response";
  const steps = [...(state.investigationSteps ?? [])];
  if (steps.length > 0) {
    const last = steps.length - 1;
    steps[last] = { ...steps[last], developerResponse };
  }

  return { investigationReportOutput: developerResponse, investigationSteps: steps };
};
