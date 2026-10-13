import { SystemMessage } from "@langchain/core/messages";
import { queryExtenderPrompt } from "../../prompt/queryExtenderPrompt.js";
import { defaultFinalOutputModel } from "../../models/models.js";
import {
  extendChunksWithMoreContext,
  groupAndMergeBySource,
} from "../../retrival/utils.js";
import { DEFAULT_CHUNK_EXTENSION } from "../../mongo/mongoClientFactory.js";
import { returnTopFiveDocuments } from "./utilsBM25.js";

export const syntheziserBm25ExtendedCall = async (state: any) => {
  const topFiveDocuments = await returnTopFiveDocuments(state);

  const mergedRanges = groupAndMergeBySource(
    topFiveDocuments,
    DEFAULT_CHUNK_EXTENSION,
  );

  const extendedChunks = await extendChunksWithMoreContext(mergedRanges);

  const retrievedDocuments = extendedChunks.flat().map((item) => ({
    pageContent: item.text,
    source: item.source,
    fromLine: item.fromLine,
    toLine: item.toLine,
  }));

  const retrievedContext = retrievedDocuments
    .map((item) => item.pageContent)
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
    retrievedContext: retrievedDocuments,
    combinedFinalOutput: [finalOutput],
    finalOutput,
  };
};
