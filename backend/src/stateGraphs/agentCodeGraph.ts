import { StateGraph, START, END } from "@langchain/langgraph";
import {
  agentCodeState,
  AgentMessagesState,
  MessagesState,
} from "../schema/messagesSchema.js";
import { memoryCheckpointer } from "../retrival/LangChainUtils.js";
import { answerUserQueryCall } from "../calls/answerQuery/answerQueryCall.js";
import { Send } from "@langchain/langgraph";
import { classifyCodeAgentCall } from "../calls/classify/classifyAgentCall.js";
import { routeToAgents } from "../calls/route/routeCalls.js";
import { syntheziserCodeHybridCall } from "../calls/hybrid/syntheziserHybrid.js";
import { joernCodeAnalystCall } from "../calls/code/joernCodeAnalystCall.js";
import { joernSofwareDeveloperCall } from "../calls/code/joernSofwareDeveloperCall.js";

const checkpointer = memoryCheckpointer;

function routeToDevAgents(state: typeof AgentMessagesState.State): Send[] {
  return state.classifications.map(
    (classification) =>
      new Send(classification.source, {
        query: classification.query,
        userQuery: state.userQuery,
        combinedFinalOutput: state.combinedFinalOutput,
      }),
  );
}
export const agentCodeGraph = new StateGraph(agentCodeState)
  .addNode("classifyAgentCall", classifyCodeAgentCall)
  .addNode("syntheziserCall", syntheziserCodeHybridCall)
  .addNode("joernCodeAnalystCall", joernCodeAnalystCall)
  .addNode("joernSofwareDeveloperCall", joernSofwareDeveloperCall)
  .addNode("answerUserQueryCall", answerUserQueryCall)
  .addEdge(START, "classifyAgentCall")
  .addConditionalEdges("classifyAgentCall", routeToAgents, [
    "syntheziserCall",
    "joernCodeAnalystCall",
    "answerUserQueryCall",
  ])
  .addEdge("syntheziserCall", "joernCodeAnalystCall")
  .addEdge("joernCodeAnalystCall", "joernSofwareDeveloperCall")
  .addEdge("joernSofwareDeveloperCall", END)
  .addEdge("answerUserQueryCall", END)
  .compile({ checkpointer });

// export const agentCodeGraph = new StateGraph(AgentMessagesState)
//   .addNode("classifyAgentCall", classifyAgentCall)
//   .addNode("extendAgentCall", extendAgentCall)
//   .addNode("graphifyCodeCall", graphifyCodeCall)
//   .addNode("evaluateInvestigationCall", evaluateInvestigationCall)
//   .addNode("sofwareDeveloperCall", sofwareDeveloperCall)
//   .addNode("answerUserQueryCall", answerUserQueryCall)
//   .addEdge(START, "classifyAgentCall")
//   .addConditionalEdges("classifyAgentCall", routeToDevAgents, [
//     "extendAgentCall",
//     "answerUserQueryCall",
//   ])
//   .addConditionalEdges(
//     "extendAgentCall",
//     (state) =>
//       state.currentStepIndex < (state.searchQueries?.length ?? 0)
//         ? "graphifyCodeCall"
//         : "sofwareDeveloperCall",
//     ["graphifyCodeCall", "sofwareDeveloperCall"],
//   )
//   .addEdge("graphifyCodeCall", "sofwareDeveloperCall")
//   .addEdge("sofwareDeveloperCall", "evaluateInvestigationCall")
//   .addConditionalEdges("evaluateInvestigationCall", routeAfterEvaluation, [
//     "graphifyCodeCall",
//     END,
//   ])
//   .addEdge("answerUserQueryCall", END)
//   .compile({ checkpointer });
