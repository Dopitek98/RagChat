import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentMessagesState } from "../schema/messagesSchema.js";
import {
  createMongoDBCheckpointer,
  memoryCheckpointer,
} from "../retrival/LangChainUtils.js";
import { answerUserQueryCall } from "../calls/answerQuery/answerQueryCall.js";
import { routeToAgents } from "../calls/route/routeCalls.js";
import { classifyAgentCall } from "../calls/classify/classifyAgentCall.js";
import { extendAgentCall } from "../calls/queryExtender/extendAgentCall.js";
import { graphifyCodeCall } from "../calls/code/graphifyCodeCall.js";
import { sofwareDeveloperCall } from "../calls/code/sofwareDeveloperCall.js";

const checkpointer = memoryCheckpointer;

export const agentDevGraph = new StateGraph(AgentMessagesState)
  .addNode("classifyAgentCall", classifyAgentCall)
  .addNode("extendAgentCall", extendAgentCall)
  .addNode("graphifyCodeCall", graphifyCodeCall)
  .addNode("sofwareDeveloperCall", sofwareDeveloperCall)
  .addNode("answerUserQueryCall", answerUserQueryCall)
  .addEdge(START, "classifyAgentCall")
  .addConditionalEdges("classifyAgentCall", routeToAgents, [
    "extendAgentCall",
    "answerUserQueryCall",
  ])
  .addEdge("extendAgentCall", "graphifyCodeCall")
  .addEdge("classifyAgentCall", "answerUserQueryCall")
  .addEdge("graphifyCodeCall", "sofwareDeveloperCall")
  .addEdge("sofwareDeveloperCall", END)
  .addEdge("answerUserQueryCall", END)
  .compile({ checkpointer });
