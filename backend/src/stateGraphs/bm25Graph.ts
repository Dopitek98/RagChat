import { StateGraph, START, END } from "@langchain/langgraph";
import { MessagesState } from "../schema/messagesSchema.js";
import { extendQueryCall } from "../calls/queryExtender/extendQueryCall.js";
import { syntheziserBm25Call } from "../calls/bm25/syntheziserbm25Call.js";
import {
  createMongoDBCheckpointer,
  memoryCheckpointer,
} from "../retrival/LangChainUtils.js";
import { classifyQueryCall } from "../calls/classify/classifyQueryCall.js";
import { answerUserQueryCall } from "../calls/answerQuery/answerQueryCall.js";
import { routeToAgents } from "../calls/route/routeCalls.js";

const checkpointer = memoryCheckpointer;

export const bm25Graph = new StateGraph(MessagesState)
  .addNode("classifyQueryCall", classifyQueryCall)
  .addNode("extendQueryCall", extendQueryCall)
  .addNode("syntheziserCall", syntheziserBm25Call)
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
