import { StateGraph, START, END } from "@langchain/langgraph";
import { MessagesState } from "../schema/messagesSchema.js";
import { extendQueryCall } from "../calls/semanticExtended/extendQueryCall.js";
import { syntheziserSemanticExtendedCall } from "../calls/semanticExtended/syntheziserSemanticExtendedCall.js";

export const semanticExtendedAgent = new StateGraph(MessagesState)
  .addNode("extendQueryCall", extendQueryCall)
  .addNode("syntheziserCall", syntheziserSemanticExtendedCall)
  .addEdge(START, "extendQueryCall")
  .addEdge("extendQueryCall", "syntheziserCall")
  .addEdge("syntheziserCall", END)
  .compile();
