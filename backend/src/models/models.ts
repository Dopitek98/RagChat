import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { QueriesStructuredOutput } from "../schema/messagesSchema.js";

const DEFAULT_MODEL = "qwen3.5:4b";
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_DIMENSIONS = 1024;
const DEFAULT_EMBEDDING_MODEL = "qwen3-embedding:latest";

export const defaultStructuredModel = new ChatOllama({
  model: DEFAULT_MODEL,
  temperature: DEFAULT_TEMPERATURE,
}).withStructuredOutput(QueriesStructuredOutput);

export const defaultChatModel = new ChatOllama({
  model: DEFAULT_MODEL,
  temperature: DEFAULT_TEMPERATURE,
});

export const defaultEmbeddingModel = new OllamaEmbeddings({
  model: DEFAULT_EMBEDDING_MODEL,
  baseUrl: DEFAULT_BASE_URL,
  dimensions: DEFAULT_DIMENSIONS,
});
