import { HumanMessage } from "@langchain/core/messages";
import { semanticExtendedAgent } from "../stateGraphs/semanticExtendedGraph.js";
import { bm25Graph } from "../stateGraphs/bm25Graph.js";
import { StateGraph } from "@langchain/langgraph";
import { bm25ExtendedGraph } from "../stateGraphs/bm25ExtendedGraph.js";

//@ts-ignore
const graphMap = new Map<string, StateGraph>();
graphMap.set("BM25", bm25Graph);
graphMap.set("SemanticExtended", semanticExtendedAgent);
graphMap.set("BM25Extended", bm25ExtendedGraph);

export const sendAndReceiveMessage = async (
  userQuery: string,
  searchType: string,
) => {
  const graph = graphMap.get(searchType);
  if (!graph) {
    throw new Error(`Graph for search type '${searchType}' not found`);
  }

  const result = await graph.invoke({
    messages: [new HumanMessage(userQuery)],
  });

  return [
    JSON.stringify(
      result.messages[1].contentBlocks[0]?.reasoning || "no response",
    ),
    JSON.stringify(result.messages[1].contentBlocks[1]?.text || "no response"),
  ];
};
