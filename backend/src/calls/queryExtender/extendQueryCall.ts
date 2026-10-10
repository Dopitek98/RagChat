import { SystemMessage } from "@langchain/core/messages";
import { defaultStructuredModel } from "../../models/models.js";

export const extendQueryCall = async (state: any) => {
  console.log("extendQueryCall state:", state);

  // const userQuery = state?.classifications?.[state.classifications.length - 1]?.query ?? "";
  const userQuery = state?.query ?? "";
  console.log("userQuery:", userQuery);
  const response = await defaultStructuredModel.invoke([
    new SystemMessage(
      `
You are a expert assistanct of langchain documentation

## Guidelines:
Your task is to create 5 rephrased versions of the given query by removing loaded language and making them more detailed.
Include relevant synonyms and related terms to improve retrieval.
Each query should be separated in new line
Return only the expanded queries without any explanations or additional text.

## Given Query:
${userQuery}
      `,
    ),
  ]);

  console.log("extendQueryCall response:", response);

  return {
    userQuery,
    searchQueries: response.searchQueries,
    combinedFinalOutput: state.combinedFinalOutput,
  };
};
