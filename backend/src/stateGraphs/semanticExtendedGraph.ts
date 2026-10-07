import { StateGraph, START, END } from "@langchain/langgraph";
import { MessagesState } from "../schema/messagesSchema.js";
import { extendQueryCall } from "../calls/extendQueryCall.js";
import { syntheziserSemanticExtendedCall } from "../calls/semanticExtended/syntheziserSemanticExtendedCall.js";
import { createMongoDBCheckpointer } from "../retrival/LangChainUtils.js";

const checkpointer = await createMongoDBCheckpointer();

export const semanticExtendedAgent = new StateGraph(MessagesState)
  .addNode("extendQueryCall", extendQueryCall)
  .addNode("syntheziserCall", syntheziserSemanticExtendedCall)
  .addEdge(START, "extendQueryCall")
  .addEdge("extendQueryCall", "syntheziserCall")
  .addEdge("syntheziserCall", END)
  .compile({ checkpointer });
