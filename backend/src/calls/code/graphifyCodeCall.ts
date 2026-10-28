import { graphifyInvestigationAgent } from "../../models/models.js";

export const graphifyCodeCall = async (state: any) => {
  let idx = 0;
  let response;
  for (const investigation of state.searchQueries) {
    console.log("investigation: " + investigation);
    if (idx === 1) break;
    response = await graphifyInvestigationAgent.invoke(
      {
        messages: {
          role: "human",
          content: investigation,
        },
      },
      {
        recursionLimit: 200, // default is typically 25
      },
    );
    idx++;
  }

  return {
    graphifyOutput: response!.messages.at(-1)?.text || "no response",
  };
};
