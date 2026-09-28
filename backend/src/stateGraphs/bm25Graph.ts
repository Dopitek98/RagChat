import { StateGraph, START, END } from "@langchain/langgraph";
import { MessagesState } from "../schema/messagesSchema.js";
import { extendQueryCall } from "../calls/semanticExtended/extendQueryCall.js";
import { syntheziserBm25Call } from "../calls/bm25/syntheziserbm25Call.js";

export const bm25Graph = new StateGraph(MessagesState)
  .addNode("extendQueryCall", extendQueryCall)
  .addNode("syntheziserCall", syntheziserBm25Call)
  .addEdge(START, "extendQueryCall")
  .addEdge("extendQueryCall", "syntheziserCall")
  .addEdge("syntheziserCall", END)
  .compile();
