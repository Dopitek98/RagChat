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
  console.log(mergedRanges);

  const extendedChunks = await extendChunksWithMoreContext(mergedRanges);

  const systemMessage: string = queryExtenderPrompt(extendedChunks);
  const response = await defaultFinalOutputModel.invoke([
    new SystemMessage(systemMessage),
  ]);
  return {
    finalOutput: {
      response: response.response,
      reasoning: response.reasoning,
    },
  };
};
