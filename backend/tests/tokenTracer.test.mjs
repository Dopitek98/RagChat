import { test } from "node:test";
import assert from "node:assert/strict";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { END, START, StateGraph, MessagesValue, StateSchema } from "@langchain/langgraph";
import { TokenTracker } from "../dist/tokenCounter/tokenTracer.js";

const generation = (message) => ({ text: "answer", message });

test("tracks provider usage without counting alternatives twice", () => {
  const tracker = new TokenTracker();
  tracker.handleLLMEnd({ generations: [[
    generation(new AIMessage({ content: "a", usage_metadata: { input_tokens: 10, output_tokens: 5, total_tokens: 17 } })),
    generation(new AIMessage({ content: "b", usage_metadata: { input_tokens: 10, output_tokens: 5, total_tokens: 17 } })),
  ]] });
  tracker.handleLLMEnd({ generations: [[generation(new AIMessage({ content: "a", response_metadata: { prompt_eval_count: 4, eval_count: 2 } }))]] });
  tracker.handleLLMEnd({ generations: [[{ text: "a" }]], llmOutput: { tokenUsage: { promptTokens: 3, completionTokens: 1, totalTokens: 4 } } });
  tracker.handleLLMEnd({ generations: [[generation(new AIMessage("no usage"))]] });
  assert.deepEqual(tracker.usage, { inputTokens: 17, outputTokens: 8, totalTokens: 27, modelCalls: 4, callsWithUsage: 3 });
});

class UsageModel extends BaseChatModel {
  _llmType() { return "usage-test"; }
  async _generate(messages) {
    const input = messages[0].content === "first" ? 2 : 7;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { generations: [generation(new AIMessage({ content: "answer", usage_metadata: { input_tokens: input, output_tokens: 1, total_tokens: input + 1 } }))] };
  }
}

test("graph callbacks include nested model calls and isolate concurrent chats", async () => {
  const model = new UsageModel({});
  const inner = new StateGraph(new StateSchema({ messages: MessagesValue }))
    .addNode("model", async (state) => ({ messages: [await model.invoke(state.messages)] }))
    .addEdge(START, "model").addEdge("model", END).compile();
  const outer = new StateGraph(new StateSchema({ messages: MessagesValue }))
    .addNode("nested", async (state) => {
      await inner.invoke({ messages: state.messages });
      await model.invoke(state.messages);
      return {};
    }).addEdge(START, "nested").addEdge("nested", END).compile();
  const first = new TokenTracker();
  const second = new TokenTracker();
  await Promise.all([
    outer.invoke({ messages: [new HumanMessage("first")] }, { callbacks: [first] }),
    outer.invoke({ messages: [new HumanMessage("second")] }, { callbacks: [second] }),
  ]);
  assert.deepEqual(first.usage, { inputTokens: 4, outputTokens: 2, totalTokens: 6, modelCalls: 2, callsWithUsage: 2 });
  assert.deepEqual(second.usage, { inputTokens: 14, outputTokens: 2, totalTokens: 16, modelCalls: 2, callsWithUsage: 2 });
});
