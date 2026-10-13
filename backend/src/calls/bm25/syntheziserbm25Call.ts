import { SystemMessage } from "@langchain/core/messages";
import { queryExtenderPrompt } from "../../prompt/queryExtenderPrompt.js";
import {
  defaultChatModel,
  defaultFinalOutputModel,
} from "../../models/models.js";
import type { ResultBm25 } from "../../types/types.js";
import { bm25Search } from "../../retrival/utils.js";
import { getAllDocuments } from "../../mongo/mongoClientFactory.js";
import { returnTopFiveDocuments } from "./utilsBM25.js";

export const syntheziserBm25Call = async (state: any) => {
  const topFiveDocuments = await returnTopFiveDocuments(state);

  const retrievedContext = topFiveDocuments
    .map((el: any) => el.pageContent)
    .flat()
    .join("\n");

  const systemMessage: string = queryExtenderPrompt(
    retrievedContext,
    state.combinedFinalOutput,
    state.userQuery,
  );
  const response = await defaultFinalOutputModel.invoke([
    new SystemMessage(systemMessage),
  ]);

  const finalOutput = {
    response: response.response,
    reasoning: response.reasoning,
  };

  return {
    retrievedContext: topFiveDocuments,
    combinedFinalOutput: [finalOutput],
    finalOutput,
  };
};
