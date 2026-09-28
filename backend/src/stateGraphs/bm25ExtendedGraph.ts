import { StateGraph, START, END } from "@langchain/langgraph";
import { MessagesState } from "../schema/messagesSchema.js";
import { extendQueryCall } from "../calls/semanticExtended/extendQueryCall.js";
import { syntheziserBm25ExtendedCall } from "../calls/bm25Extended/syntheziserbm25ExtendedCall.js";

export const bm25ExtendedGraph = new StateGraph(MessagesState)
  .addNode("extendQueryCall", extendQueryCall)
  .addNode("syntheziserCall", syntheziserBm25ExtendedCall)
  .addEdge(START, "extendQueryCall")
  .addEdge("extendQueryCall", "syntheziserCall")
  .addEdge("syntheziserCall", END)
  .compile();
