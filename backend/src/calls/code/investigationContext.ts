import { AgentMessagesState } from "../../schema/messagesSchema.js";

type InvestigationState = typeof AgentMessagesState.State;

export function formatInvestigationContext(state: InvestigationState): string {
  return JSON.stringify({
    userRequest: state.userQuery,
    plan: state.searchQueries ?? [],
    nextStepIndex: state.currentStepIndex,
    steps: state.investigationSteps ?? [],
  }, null, 2);
}
