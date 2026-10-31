import { softwareDeveloperAnalystAgent } from "../../models/models.js";
import { userQuestionToSoftwareDeveloperAnalyzePrompt } from "../../prompt/userQuestionToSoftwareDeveloperAnalyzePrompt.js";

export const sofwareDeveloperCall = async (state: any) => {
  console.log("STATE");
  console.log(state);
  const response = await softwareDeveloperAnalystAgent.invoke(
    {
      messages: {
        role: "human",
        content: userQuestionToSoftwareDeveloperAnalyzePrompt(
          state.userQuery,
          state.searchQueries[0],
          state.graphifyOutput,
        ),
      },
    },
    {
      recursionLimit: 50, // default is typically 25
    },
  );

  return {
    investigationReportOutput: response.messages.at(-1)?.text || "no response",
  };
};
