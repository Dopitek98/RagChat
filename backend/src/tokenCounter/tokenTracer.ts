import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { AIMessage } from "@langchain/core/messages";
import type { LLMResult } from "@langchain/core/outputs";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  modelCalls: number;
  callsWithUsage: number;
}

function tokenCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

export class TokenTracker extends BaseCallbackHandler {
  name = "TokenTracker";

  readonly usage: TokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    modelCalls: 0,
    callsWithUsage: 0,
  };

  handleLLMEnd(result: LLMResult): void {
    this.usage.modelCalls += 1;
    let foundUsage = false;

    // A provider reports usage for the request, not separately for each candidate.
    for (const generations of result.generations) {
      const generation = generations[0];
      const message = generation && "message" in generation ? generation.message : undefined;
      if (!AIMessage.isInstance(message)) continue;

      const metadata = message.usage_metadata;
      const response = message.response_metadata;
      const input = tokenCount(metadata?.input_tokens) ?? tokenCount(response?.prompt_eval_count);
      const output = tokenCount(metadata?.output_tokens) ?? tokenCount(response?.eval_count);
      const total = tokenCount(metadata?.total_tokens);
      if (input === undefined && output === undefined && total === undefined) continue;

      this.addUsage(input, output, total);
      foundUsage = true;
    }

    if (!foundUsage) {
      const providerUsage = result.llmOutput?.tokenUsage ?? result.llmOutput?.usage;
      const input = tokenCount(providerUsage?.promptTokens) ?? tokenCount(providerUsage?.prompt_tokens) ?? tokenCount(providerUsage?.input_tokens);
      const output = tokenCount(providerUsage?.completionTokens) ?? tokenCount(providerUsage?.completion_tokens) ?? tokenCount(providerUsage?.output_tokens);
      const total = tokenCount(providerUsage?.totalTokens) ?? tokenCount(providerUsage?.total_tokens);
      if (input !== undefined || output !== undefined || total !== undefined) {
        this.addUsage(input, output, total);
        foundUsage = true;
      }
    }

    if (foundUsage) this.usage.callsWithUsage += 1;
  }

  private addUsage(input = 0, output = 0, total?: number): void {
    this.usage.inputTokens += input;
    this.usage.outputTokens += output;
    this.usage.totalTokens += total ?? input + output;
  }
}
