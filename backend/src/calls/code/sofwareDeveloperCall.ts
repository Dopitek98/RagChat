import { softwareDeveloperAnalystAgent } from "../../models/models.js";
import { userQuestionToSoftwareDeveloperAnalyzePrompt } from "../../prompt/userQuestionToSoftwareDeveloperAnalyzePrompt.js";

export const sofwareDeveloperCall = async (state: any) => {
  const response = await softwareDeveloperAnalystAgent.invoke(
    {
      messages: {
        role: "human",
        content: userQuestionToSoftwareDeveloperAnalyzePrompt(
          state.userQuery,
          state.searchQuery[0],
          state.graphifyOutput,
        ),
      },
    },
    {
      recursionLimit: 50, // default is typically 25
    },
  );

  return {
    investigationReportOutput: response!.structuredResponse || "no response",
  };
};
