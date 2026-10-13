import { SystemMessage } from "@langchain/core/messages";
import { queryExtenderPrompt } from "../../prompt/queryExtenderPrompt.js";
import { defaultFinalOutputModel } from "../../models/models.js";
import {
  groupAndMergeBySource,
  extendChunksWithMoreContext,
} from "../../retrival/utils.js";
import { SMALL_CHUNK_EXTENSION } from "../../mongo/mongoClientFactory.js";
import { getSemanticExtendedResponse } from "../semanticExtended/syntheziserSemanticExtendedCall.js";
import { returnTopFiveDocuments } from "../bm25/utilsBM25.js";
import { buildRrfTopDocuments } from "./utilsHybrid.js";

export const syntheziserHybridCall = async (state: any) => {
  const topSemanticDocuments = await getSemanticExtendedResponse(state);
  const topFiveDocuments = await returnTopFiveDocuments(state);

  const topHybridDocuments = buildRrfTopDocuments(
    topSemanticDocuments,
    topFiveDocuments,
    state?.rrfSemanticRatio,
  );

  const mergedRanges = groupAndMergeBySource(
    topHybridDocuments,
    SMALL_CHUNK_EXTENSION,
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
