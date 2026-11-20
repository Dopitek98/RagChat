import { joernSoftwareDeveloperAgent } from "../../models/models.js";
import { agentCodeState } from "../../schema/messagesSchema.js";
import { getAgentAnswer } from "./getAgentAnswer.js";

export const joernSofwareDeveloperCall = async (
  state: typeof agentCodeState.State,
) => {
  const analystAnswers = state.retrievedContextAnswers ?? [];
  const retrievedSoftwareContextAnswersSchema = [];

  console.log("state.userQuery:", state.userQuery);
  for (const analystAnswer of analystAnswers) {
    const response = await joernSoftwareDeveloperAgent.invoke(
      {
        messages: {
          role: "human",
          content: [
            `User request:\n${state.userQuery}`,
            "Analyze the following Joern analyst handoff. Verify relevant methods by retrieving their source with the available tool.",
            `Joern analyst handoff:\n${JSON.stringify(analystAnswer)}`,
          ].join("\n\n"),
        },
      },
      { recursionLimit: 40 },
    );

    retrievedSoftwareContextAnswersSchema.push({
      answer: getAgentAnswer(response, "Joern software developer"),
      retrievedContext: analystAnswer,
    });
  }

  return { retrievedSoftwareContextAnswersSchema };
};
