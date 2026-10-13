import { StateGraph, START, END } from "@langchain/langgraph";
import { MessagesState } from "../schema/messagesSchema.js";
import { extendQueryCall } from "../calls/queryExtender/extendQueryCall.js";
import { syntheziserSemanticExtendedCall } from "../calls/semanticExtended/syntheziserSemanticExtendedCall.js";
import {
  createMongoDBCheckpointer,
  memoryCheckpointer,
} from "../retrival/LangChainUtils.js";
import { classifyQueryCall } from "../calls/classify/classifyQueryCall.js";
import { routeToAgents } from "../calls/route/routeCalls.js";
import { answerUserQueryCall } from "../calls/answerQuery/answerQueryCall.js";
import { syntheziserHybridCall } from "../calls/hybrid/syntheziserHybrid.js";

// const checkpointer = await createMongoDBCheckpointer();
const checkpointer = memoryCheckpointer;

export const hybridAgent = new StateGraph(MessagesState)
  .addNode("classifyQueryCall", classifyQueryCall)
  .addNode("extendQueryCall", extendQueryCall)
  .addNode("syntheziserCall", syntheziserHybridCall)
  .addNode("answerUserQueryCall", answerUserQueryCall)
  .addEdge(START, "classifyQueryCall")
  .addConditionalEdges("classifyQueryCall", routeToAgents, [
    "extendQueryCall",
    "answerUserQueryCall",
  ])
  .addEdge("extendQueryCall", "syntheziserCall")
  .addEdge("syntheziserCall", END)
  .addEdge("answerUserQueryCall", END)
  .compile({ checkpointer });
