# QA Agent

React + TypeScript + Vite + LangChain client for the QA agent.

Fresh chat responses include token usage as the fifth array item: `inputTokens`,
`outputTokens`, `totalTokens`, `modelCalls`, and `callsWithUsage`. Counts are
per request and include nested model calls; only provider-reported usage is
counted. Cached responses and history may not include usage. `modelCalls`
counts completed calls, and `callsWithUsage` shows how many reported token data.
