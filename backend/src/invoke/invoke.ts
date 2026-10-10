import { HumanMessage } from "@langchain/core/messages";
import { semanticExtendedAgent } from "../stateGraphs/semanticExtendedGraph.js";
import { bm25Graph } from "../stateGraphs/bm25Graph.js";
import { StateGraph } from "@langchain/langgraph";
import { bm25ExtendedGraph } from "../stateGraphs/bm25ExtendedGraph.js";
import { persistQueryResult } from "../mongo/mongoClientFactory.js";
import { randomUUID } from "crypto";

//@ts-ignore
const graphMap = new Map<string, StateGraph>();
graphMap.set("BM25", bm25Graph);
graphMap.set("SemanticExtended", semanticExtendedAgent);
graphMap.set("BM25Extended", bm25ExtendedGraph);

export const sendAndReceiveMessage = async (
  userQuery: string,
  searchType: string,
  threadId: string = randomUUID(),
) => {
  const graph = graphMap.get(searchType);
  if (!graph) {
    throw new Error(`Graph for search type '${searchType}' not found`);
  }

  const result = await graph.invoke(
    {
      messages: [new HumanMessage(userQuery)],
    },
    {
      configurable: {
        thread_id: threadId,
      },
    },
  );

  console.log("Final output from graph:", result.finalOutput);

  await persistQueryResult(
    JSON.stringify(result.finalOutput?.response || "no response"),
    JSON.stringify(result.finalOutput?.reasoning || "no response"),
    userQuery,
    searchType,
    threadId,
  );

  return [
    JSON.stringify(result.finalOutput?.reasoning || "no response"),
    JSON.stringify(result.finalOutput?.response || "no response"),
    threadId,
  ];
};
