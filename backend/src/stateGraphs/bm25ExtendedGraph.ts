import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { MessagesState } from "../schema/messagesSchema.js";
import { extendQueryCall } from "../calls/queryExtender/extendQueryCall.js";
import { syntheziserBm25ExtendedCall } from "../calls/bm25/syntheziserbm25ExtendedCall.js";
import {
  createMongoDBCheckpointer,
  memoryCheckpointer,
} from "../retrival/LangChainUtils.js";
import { classifyQueryCall } from "../calls/classify/classifyQueryCall.js";
import { answerUserQueryCall } from "../calls/answerQuery/answerQueryCall.js";
import { routeToAgents } from "../calls/route/routeCalls.js";

// const checkpointer = await createMongoDBCheckpointer();
const checkpointer = memoryCheckpointer;

export const bm25ExtendedGraph = new StateGraph(MessagesState)
  .addNode("classifyQueryCall", classifyQueryCall)
  .addNode("extendQueryCall", extendQueryCall)
  .addNode("syntheziserCall", syntheziserBm25ExtendedCall)
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
