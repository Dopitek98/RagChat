import { StateGraph, START, END } from "@langchain/langgraph";
import { agentCodeState } from "../schema/messagesSchema.js";
import { memoryCheckpointer } from "../retrival/LangChainUtils.js";
import { answerUserQueryCall } from "../calls/answerQuery/answerQueryCall.js";
import { Send } from "@langchain/langgraph";
import { classifyCodeAgentCall } from "../calls/classify/classifyAgentCall.js";
import { syntheziserCodeHybridCall } from "../calls/hybrid/syntheziserHybrid.js";
import { joernCodeAnalystCall } from "../calls/code/joernCodeAnalystCall.js";
import { joernSofwareDeveloperCall } from "../calls/code/joernSofwareDeveloperCall.js";
import { focusedJoernAnalystCall } from "../calls/code/focusedJoernAnalystCall.js";
import { focusedJoernDeveloperCall, routeAfterFocusedJoernAssessment } from "../calls/code/focusedJoernDeveloperCall.js";

const checkpointer = memoryCheckpointer;

export const agentCodeGraph = new StateGraph(agentCodeState)
  .addNode("classifyAgentCall", classifyCodeAgentCall)
  .addNode("syntheziserCall", syntheziserCodeHybridCall)
  .addNode("joernCodeAnalystCall", joernCodeAnalystCall)
  .addNode("joernSofwareDeveloperCall", joernSofwareDeveloperCall)
  .addNode("focusedJoernAnalystCall", focusedJoernAnalystCall)
  .addNode("focusedJoernDeveloperCall", focusedJoernDeveloperCall)
  .addNode("answerUserQueryCall", answerUserQueryCall)
  .addEdge(START, "classifyAgentCall")
  .addConditionalEdges("classifyAgentCall", (state) =>
    state.classifications.map((classification) => new Send(
      classification.source === "joernCodeAnalystCall" ? "focusedJoernAnalystCall" : classification.source,
      {
        query: classification.query,
        userQuery: state.userQuery,
        combinedFinalOutput: state.combinedFinalOutput,
        focusedJoernSteps: [],
        focusedJoernSufficient: false,
      },
    )), ["syntheziserCall", "focusedJoernAnalystCall", "answerUserQueryCall"])
  .addEdge("syntheziserCall", "joernCodeAnalystCall")
  .addEdge("joernCodeAnalystCall", "joernSofwareDeveloperCall")
  .addEdge("joernSofwareDeveloperCall", END)
  .addEdge("focusedJoernAnalystCall", "focusedJoernDeveloperCall")
  .addConditionalEdges("focusedJoernDeveloperCall", routeAfterFocusedJoernAssessment, [
    "focusedJoernAnalystCall", END,
  ])
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
