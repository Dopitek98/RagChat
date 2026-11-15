import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { queryExtenderPrompt } from "../../prompt/queryExtenderPrompt.js";
import { defaultFinalOutputModel } from "../../models/models.js";
import {
  groupAndMergeBySource,
  extendChunksWithMoreContext,
  DEFAULT_CLASS_LEVEL,
} from "../../retrival/utils.js";
import { SMALL_CHUNK_EXTENSION } from "../../mongo/mongoClientFactory.js";
import {
  getCodeAnalysisSemanticResponse,
  getSemanticExtendedResponse,
} from "../semanticExtended/syntheziserSemanticExtendedCall.js";
import {
  returnTopFiveDocuments,
  returnTopFourtyDocuments,
} from "../bm25/utilsBM25.js";
import { buildRrfTopDocuments } from "./utilsHybrid.js";

export const syntheziserHybridCall = async (state: any) => {
  const topSemanticDocuments = await getSemanticExtendedResponse(state);
  const topFiveDocuments = await returnTopFiveDocuments(state);

  const topHybridDocuments = buildRrfTopDocuments(
    topSemanticDocuments,
    topFiveDocuments,
    {
      getKey: (item) =>
        JSON.stringify([item.source, item.fromLine, item.toLine]),
      getScore: (item) => item.score,
      withScore: (item, score) => ({
        source: item.source,
        pageContent: item.pageContent,
        fromLine: item.fromLine,
        toLine: item.toLine,
        score,
      }),
      merge: (semantic, bm25) => ({
        ...semantic,
        pageContent: semantic.pageContent || bm25.pageContent,
      }),
      semanticRatio: state?.rrfSemanticRatio,
    },
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

export const syntheziserCodeHybridCall = async (state: any) => {
  const topLevelClassesSemantic = await getCodeAnalysisSemanticResponse(
    state,
    DEFAULT_CLASS_LEVEL,
    DEFAULT_CLASS_LEVEL,
    20,
    1.5,
  );

  const topLevelPackagesSemantic = await getCodeAnalysisSemanticResponse(
    state,
    2,
    3,
    10,
    1.1,
  );

  const restLevelPackagesSemantic = await getCodeAnalysisSemanticResponse(
    state,
    4,
    6,
    10,
    1.2,
  );

  const topFourtyDocuments = await returnTopFourtyDocuments(state);

  console.log("=============");
  console.log("topFourtyDocuments", topFourtyDocuments);
  console.log("=============");

  const topHybridDocuments = buildRrfTopDocuments(
    [
      ...topLevelClassesSemantic,
      ...topLevelPackagesSemantic,
      ...restLevelPackagesSemantic,
    ],
    topFourtyDocuments,
    {
      getKey: (item) => item.content.id.toString(),
      getScore: (item) => item.content.score,
      withScore: (item, score) => ({
        ...item,
        content: { ...item.content, score },
      }),
      semanticRatio: state?.rrfSemanticRatio,
    },
  );

  const retrievedContext = topHybridDocuments
    .map((item) => JSON.stringify(item.content))
    .join("\n");

  console.log("retrievedContext", retrievedContext);
  // const systemMessage = queryExtenderPrompt(
  //   retrievedContext,
  //   state.combinedFinalOutput,
  //   state.userQuery,
  // );
  const response = await defaultFinalOutputModel.invoke([
    new SystemMessage(`
    You are a helpful assistant that provides answers to user queries based on the provided context. Use the context to generate a comprehensive and accurate response to the user's question.
      `),
    new HumanMessage(`
## User's question:
${state.userQuery ?? "No user query provided."}

## Available Context
${JSON.stringify(retrievedContext, null, 2)}
        `),
  ]);

  const finalOutput = {
    response: response.response,
    reasoning: response.reasoning,
  };

  return {
    retrievedContext,
    combinedFinalOutput: [finalOutput],
    finalOutput,
  };
};
