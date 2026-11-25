import { Send } from "@langchain/langgraph";
import {
  MessagesState,
  AgentMessagesState,
  agentCodeState,
} from "../../schema/messagesSchema.js";

export function routeToAgents(
  state:
    | typeof MessagesState.State
    | typeof AgentMessagesState.State
    | typeof agentCodeState.State,
): Send[] {
  console.log("Routing to agents based on classifications:", state);
  return state.classifications.map(
    (c) =>
      new Send(c.source, {
        query: c.query,
        userQuery: state.userQuery,
        isDirectJoernRequest: c.source === "joernCodeAnalystCall",
        combinedFinalOutput: state.combinedFinalOutput,
      }),
  );
}
