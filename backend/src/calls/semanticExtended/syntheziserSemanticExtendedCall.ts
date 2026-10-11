import { SystemMessage } from "@langchain/core/messages";
import { queryExtenderPrompt } from "../../prompt/queryExtenderPrompt.js";
import {
  defaultChatModel,
  defaultFinalOutputModel,
} from "../../models/models.js";
import type { ContentResult } from "../../types/types.js";
import {
  filterOutDuplicatesFromTopQueries,
  prepareDocumentBySimilaritySearch,
  groupAndMergeBySource,
  extendChunksWithMoreContext,
} from "../../retrival/utils.js";
import { DEFAULT_CHUNK_EXTENSION } from "../../mongo/mongoClientFactory.js";

export const syntheziserSemanticExtendedCall = async (state: any) => {
  const uploads: ContentResult[] =
    await prepareDocumentBySimilaritySearch(state);

  const topQueries = filterOutDuplicatesFromTopQueries(uploads);

  const mergedRanges = groupAndMergeBySource(
    topQueries,
    DEFAULT_CHUNK_EXTENSION,
  );

  const extendedChunks = await extendChunksWithMoreContext(mergedRanges);

  const retrievedDocuments = extendedChunks.flat().map((item) => ({
    pageContent: item.text,
    source: item.source,
    fromLine: item.fromLine,
    toLine: item.toLine,
  }));

  const retrievedContext = extendedChunks
    .flat()
    .map((item) => item.text)
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
