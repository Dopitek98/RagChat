type AgentAnswerResponse = {
  structuredResponse?: { answer?: string | null };
  messages: Array<{ text: string }>;
};

export const getAgentAnswer = (
  response: AgentAnswerResponse,
  agentName: string,
): string | null => {
  const structuredAnswer = response.structuredResponse?.answer;
  if (structuredAnswer !== undefined) {
    return structuredAnswer;
  }

  const finalMessage = response.messages.at(-1)?.text;
  if (finalMessage === undefined) {
    throw new Error(`${agentName} returned no structured answer or final message.`);
  }

  return finalMessage;
};
