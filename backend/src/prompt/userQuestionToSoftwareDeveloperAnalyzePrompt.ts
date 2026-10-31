export const userQuestionToSoftwareDeveloperAnalyzePrompt = (
  userQuery: string,
  searchQuery: string,
  graphifyOutput: string,
) => `Please investigate the following user request using the available search handoff and answer user question.

User request:
${userQuery}

Search query:
${searchQuery}

Search handoff (unverified):
${graphifyOutput}`;
