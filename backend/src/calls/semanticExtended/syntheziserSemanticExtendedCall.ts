import { SystemMessage } from "@langchain/core/messages";
import { queryExtenderPrompt } from "../../prompt/queryExtenderPrompt.js";
import {
  defaultChatModel,
  defaultFinalOutputModel,
} from "../../models/models.js";
import type {
  CodeContentResult,
  DocumentContentResult,
} from "../../types/types.js";
import {
  filterOutDuplicatesFromTopQueries,
  prepareDocumentBySimilaritySearch,
  groupAndMergeBySource,
  extendChunksWithMoreContext,
  findObjectsBySimilaritySearch,
} from "../../retrival/utils.js";
import { DEFAULT_CHUNK_EXTENSION } from "../../mongo/mongoClientFactory.js";

export const syntheziserSemanticExtendedCall = async (state: any) => {
  const topQueries = await getSemanticExtendedResponse(state);

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

export const getSemanticExtendedResponse = async (state: any) => {
  const uploads: DocumentContentResult[] =
    await prepareDocumentBySimilaritySearch(state);

  const topQueries = filterOutDuplicatesFromTopQueries(uploads);

  return topQueries;
};

export const getCodeAnalysisSemanticResponse = async (
  state: any,
  levelFrom: number,
  levelTo: number = levelFrom,
  numberOfResults: number,
  scoreMultiplier: number,
) => {
  const uploads: CodeContentResult[] = await findObjectsBySimilaritySearch(
    state,
    levelFrom,
    levelTo,
    numberOfResults,
    scoreMultiplier,
  );

  return uploads;
};
