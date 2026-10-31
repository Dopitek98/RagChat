import { graphifyInvestigationAgent } from "../../models/models.js";

export const graphifyCodeCall = async (state: any) => {
  const outputs: string[] = [];

  for (const investigation of state.searchQueries ?? []) {
    console.log("investigation: " + investigation);
    const response = await graphifyInvestigationAgent.invoke(
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

    outputs.push(response.messages.at(-1)?.text || "no response");
    console.log("INV ENDED ***********");
    break;
  }

  const graphifyOutput = outputs.join("\n\n");
  console.log("GRAPHIFY STATE");
  console.log("FINAL OUTPUT STATE: " + graphifyOutput);
  return { graphifyOutput: graphifyOutput || "no response" };
};
