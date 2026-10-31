import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import {
  AgentFinalOutput,
  ClassificationResultSchema,
  ClassificationAgentSchema,
  queryExtenderOutput,
  investigationExtenderOutput,
} from "../schema/messagesSchema.js";
import { ChatOpenRouter } from "@langchain/openrouter";
import { createAgent } from "langchain";
import { toolRead, tokenTracker, wrappedTools } from "../tools/tools.js";
import { investigationReportOutput } from "../schema/messagesSchema.js";
import { softwareDeveloperAnalyzePrompt } from "../prompt/softwareDeveloperAnalyzePrompt.js";
import { graphifyInvestigationAssistant } from "../prompt/graphifyInvestigationAssistant.js";

// const DEFAULT_MODEL = "gemma4:12b";
const DEFAULT_MODEL = "qwen3.5:9b";
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const DEFAULT_DIMENSIONS = 1024;
const DEFAULT_EMBEDDING_MODEL = "qwen3-embedding:latest";

export const defaultStructuredModel = new ChatOllama({
  model: DEFAULT_MODEL,
  temperature: DEFAULT_TEMPERATURE,
  baseUrl: DEFAULT_BASE_URL,
}).withStructuredOutput(queryExtenderOutput);

export const defaultClassifyModel = new ChatOllama({
  model: DEFAULT_MODEL,
  temperature: DEFAULT_TEMPERATURE,
  baseUrl: DEFAULT_BASE_URL,
}).withStructuredOutput(ClassificationResultSchema);

export const defaultAgentClassifyModel = new ChatOllama({
  model: DEFAULT_MODEL,
  temperature: DEFAULT_TEMPERATURE,
  baseUrl: DEFAULT_BASE_URL,
}).withStructuredOutput(ClassificationAgentSchema);

export const defaultFinalOutputModel = new ChatOllama({
  model: DEFAULT_MODEL,
  temperature: DEFAULT_TEMPERATURE,
  baseUrl: DEFAULT_BASE_URL,
}).withStructuredOutput(AgentFinalOutput);

//api key set in env is needed
export const defaultInvestigationChatModel = new ChatOpenRouter({
  model: "openai/gpt-4o-mini",
  temperature: 0,
}).withStructuredOutput(investigationExtenderOutput);

// export const GraphifyFinalOutputModel = new ChatOllama({
//   model: DEFAULT_MODEL,
//   temperature: DEFAULT_TEMPERATURE,
//   baseUrl: DEFAULT_BASE_URL,
// }).withStructuredOutput(AgentFinalOutput);

export const defaultChatModel = new ChatOllama({
  model: DEFAULT_MODEL,
  temperature: DEFAULT_TEMPERATURE,
  baseUrl: DEFAULT_BASE_URL,
});

export const defaultEmbeddingModel = new OllamaEmbeddings({
  model: DEFAULT_EMBEDDING_MODEL,
  baseUrl: DEFAULT_BASE_URL,
  dimensions: DEFAULT_DIMENSIONS,
});

// Agents

// export const softwareDeveloperAnalystAgent = createAgent({
//   model: defaultChatModel,
//   tools: [toolRead],
//   // responseFormat: investigationReportOutput,
//   systemPrompt: softwareDeveloperAnalyzePrompt(),
//   middleware: [tokenTracker],
// });

// export const graphifyInvestigationAgent = createAgent({
//   model: defaultChatModel,
//   tools: wrappedTools,
//   systemPrompt: graphifyInvestigationAssistant(),
//   middleware: [tokenTracker],
// });

export const defaultPaidChatModel = new ChatOpenRouter({
  model: "deepseek/deepseek-v4.1-flash-1017",
  temperature: 0,
});

export const graphifyInvestigationAgent = createAgent({
  model: defaultPaidChatModel,
  tools: wrappedTools,
  systemPrompt: graphifyInvestigationAssistant(),
  middleware: [tokenTracker],
});

export const softwareDeveloperAnalystAgent = createAgent({
  model: defaultPaidChatModel,
  tools: [toolRead],
  // responseFormat: investigationReportOutput,
  systemPrompt: softwareDeveloperAnalyzePrompt(),
  middleware: [tokenTracker],
});
