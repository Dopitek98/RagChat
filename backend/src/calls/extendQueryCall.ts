import { SystemMessage } from "@langchain/core/messages";
import { defaultStructuredModel } from "../models/models.js";

export const extendQueryCall = async (state: any) => {
  const response = await defaultStructuredModel.invoke([
    new SystemMessage(
      `
You are a expert assistanct of langchain documentation

## Guidelines:
Your task is to rephrase the given query by removing loaded language and making it more detailed.
Include relevant synonyms and related terms to improve retrieval.
Each query should be separated in new line
Return only the expanded query without any explanations or additional text.
      `,
    ),

    ...state.messages,
  ]);

  return {
    searchQueries: response.queries,
  };
};
