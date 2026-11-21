import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import {
  AgentFinalOutput,
  ClassificationResultSchema,
  ClassificationAgentSchema,
  CodeClassificationAgentSchema,
  queryExtenderOutput,
  investigationExtenderOutput,
  investigationSufficiencyOutput,
  joernAgentAnswerSchema,
  focusedJoernAssessmentSchema,
} from "../schema/messagesSchema.js";
import { ChatOpenRouter } from "@langchain/openrouter";
import { createAgent, toolCallLimitMiddleware } from "langchain";
import {
  joernFindMethodsIncludingLiteralTool,
  joernGetParentMethodContainingCallTool,
  joernListClassMethodsTool,
  joernListClassMethodsWithCallersTool,
  toolRead,
  joernToolRead,
  wrappedTools,
  joernFindMethodCallersDeepth5Tool,
  joernDumpMethodCodeTool,
} from "../tools/tools.js";
import { investigationReportOutput } from "../schema/messagesSchema.js";
import { softwareDeveloperAnalyzePrompt } from "../prompt/softwareDeveloperAnalyzePrompt.js";
import { graphifyInvestigationAssistant } from "../prompt/graphifyInvestigationAssistant.js";
import { joernAnalyzePrompt } from "../prompt/joernAnalyzePrompt.js";
import { joernSoftwareDeveloperPrompt } from "../prompt/joernSoftwareDeveloperPrompt.js";
import { joernReadOnlySoftwareDeveloperPrompt } from "../prompt/joernReadOnlySoftwareDeveloperPrompt.js";

const DEFAULT_MODEL = "qwen3.8:latest";
//const DEFAULT_MODEL = "qwen3.5:9b";
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const DEFAULT_DIMENSIONS = 1024;
const DEFAULT_EMBEDDING_MODEL = "qwen3-embedding:latest";
//const VERIFIED_PAY_MODEL = "openai/gpt-4o-mini";
const VERIFIED_PAY_MODEL = "deepseek/deepseek-v4.1-flash";
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

export const defaultCodeAgentClassifyModel = new ChatOllama({
  model: DEFAULT_MODEL,
  temperature: DEFAULT_TEMPERATURE,
  baseUrl: DEFAULT_BASE_URL,
}).withStructuredOutput(CodeClassificationAgentSchema);

export const defaultFinalOutputModel = new ChatOllama({
  model: DEFAULT_MODEL,
  temperature: DEFAULT_TEMPERATURE,
  baseUrl: DEFAULT_BASE_URL,
}).withStructuredOutput(AgentFinalOutput);

//api key set in env is needed
export const defaultInvestigationChatModel = new ChatOpenRouter({
  model: VERIFIED_PAY_MODEL,
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
// });

// export const graphifyInvestigationAgent = createAgent({
//   model: defaultChatModel,
//   tools: wrappedTools,
//   systemPrompt: graphifyInvestigationAssistant(),
// });

export const defaultPaidChatModel = new ChatOpenRouter({
  model: VERIFIED_PAY_MODEL,
  temperature: 0,
});

export const investigationSufficiencyModel =
  defaultPaidChatModel.withStructuredOutput(investigationSufficiencyOutput);

export const graphifyInvestigationAgent = createAgent({
  model: defaultPaidChatModel,
  tools: wrappedTools,
  systemPrompt: graphifyInvestigationAssistant(),
});

export const softwareDeveloperAnalystAgent = createAgent({
  model: defaultPaidChatModel,
  tools: [toolRead],
  // responseFormat: investigationReportOutput,
  systemPrompt: softwareDeveloperAnalyzePrompt(),
});

export const joernAnalystAgent = createAgent({
  model: defaultChatModel,
  tools: [
    joernListClassMethodsTool,
    joernListClassMethodsWithCallersTool,
    joernFindMethodCallersDeepth5Tool,
    joernGetParentMethodContainingCallTool,
    joernFindMethodsIncludingLiteralTool,
  ],
  systemPrompt: joernAnalyzePrompt(),
  responseFormat: joernAgentAnswerSchema,
});

//joernDumpMethodCodeTool
export const focusedJoernSoftwareDeveloperAgent = createAgent({
  model: defaultPaidChatModel,
  tools: [joernToolRead],
  systemPrompt: joernReadOnlySoftwareDeveloperPrompt(),
  responseFormat: focusedJoernAssessmentSchema,
  middleware: [
    toolCallLimitMiddleware({
      toolName: "read_file",
      runLimit: 7,
      exitBehavior: "continue",
    }),
  ],
});

export const joernSoftwareDeveloperAgent = createAgent({
  model: defaultChatModel,
  tools: [joernDumpMethodCodeTool, joernToolRead],
  systemPrompt: joernSoftwareDeveloperPrompt(),
  responseFormat: joernAgentAnswerSchema,
  middleware: [
    toolCallLimitMiddleware({
      toolName: "read_file",
      runLimit: 7,
      exitBehavior: "continue",
    }),
  ],
});
