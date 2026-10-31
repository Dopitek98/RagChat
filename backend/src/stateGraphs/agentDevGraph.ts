import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentMessagesState } from "../schema/messagesSchema.js";
import { memoryCheckpointer } from "../retrival/LangChainUtils.js";
import { answerUserQueryCall } from "../calls/answerQuery/answerQueryCall.js";
import { Send } from "@langchain/langgraph";
import { classifyAgentCall } from "../calls/classify/classifyAgentCall.js";
import { extendAgentCall } from "../calls/queryExtender/extendAgentCall.js";
import { graphifyCodeCall } from "../calls/code/graphifyCodeCall.js";
import { sofwareDeveloperCall } from "../calls/code/sofwareDeveloperCall.js";
import { evaluateInvestigationCall, routeAfterEvaluation } from "../calls/code/evaluateInvestigationCall.js";

const checkpointer = memoryCheckpointer;

function routeToDevAgents(state: typeof AgentMessagesState.State): Send[] {
  return state.classifications.map((classification) => new Send(classification.source, {
    query: classification.query,
    userQuery: state.userQuery,
    combinedFinalOutput: state.combinedFinalOutput,
  }));
}

export const agentDevGraph = new StateGraph(AgentMessagesState)
  .addNode("classifyAgentCall", classifyAgentCall)
  .addNode("extendAgentCall", extendAgentCall)
  .addNode("graphifyCodeCall", graphifyCodeCall)
  .addNode("evaluateInvestigationCall", evaluateInvestigationCall)
  .addNode("sofwareDeveloperCall", sofwareDeveloperCall)
  .addNode("answerUserQueryCall", answerUserQueryCall)
  .addEdge(START, "classifyAgentCall")
  .addConditionalEdges("classifyAgentCall", routeToDevAgents, [
    "extendAgentCall",
    "answerUserQueryCall",
  ])
  .addConditionalEdges("extendAgentCall", (state) =>
    state.currentStepIndex < (state.searchQueries?.length ?? 0)
      ? "graphifyCodeCall"
      : "sofwareDeveloperCall", ["graphifyCodeCall", "sofwareDeveloperCall"])
  .addEdge("graphifyCodeCall", "sofwareDeveloperCall")
  .addEdge("sofwareDeveloperCall", "evaluateInvestigationCall")
  .addConditionalEdges("evaluateInvestigationCall", routeAfterEvaluation, [
    "graphifyCodeCall",
    END,
  ])
  .addEdge("answerUserQueryCall", END)
  .compile({ checkpointer });
