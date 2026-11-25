import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";

const moduleUrl = (path) => new URL(`../dist/${path}.js`, import.meta.url).href;
let scenario = "one";
let analystCalls = [];
let developerCalls = [];
let broadCalls = [];

mock.module(moduleUrl("retrival/LangChainUtils"), { namedExports: { memoryCheckpointer: new MemorySaver() } });
mock.module(moduleUrl("models/models"), { namedExports: {
  defaultAgentClassifyModel: {},
  defaultCodeAgentClassifyModel: { invoke: async (messages) => ({ classifications: [{
    source: messages.at(-1).content === "ordinary" ? "syntheziserCall" : messages.at(-1).content === "hello" ? "answerUserQueryCall" : "joernCodeAnalystCall",
    query: "classifier paraphrase",
  }] }) },
  joernAnalystAgent: { invoke: async ({ messages }) => {
    analystCalls.push(messages.content);
    if (scenario === "analyst-error" || (scenario === "late-failure" && analystCalls.length === 2)) throw new Error("Joern unavailable");
    if (scenario === "analyst-empty") return { structuredResponse: { answer: " " }, messages: [] };
    return { structuredResponse: { answer: `handoff ${analystCalls.length}` }, messages: [] };
  } },
  focusedJoernSoftwareDeveloperAgent: { invoke: async ({ messages }) => {
    developerCalls.push(messages.content);
    if (scenario === "developer-error") throw new Error("developer unavailable");
    if (scenario === "developer-invalid") return { structuredResponse: { sufficient: true, answer: "" } };
    const sufficient = scenario === "one" || (scenario === "follow" && developerCalls.length === 2);
    return { structuredResponse: {
      sufficient, reasoning: sufficient ? "source verified" : "missing caller",
      answer: `Verified source ${developerCalls.length}; analyst claims are unverified.`,
      nextLookup: sufficient ? null : "Find callers of Example.run",
    } };
  } },
} });
mock.module(moduleUrl("calls/hybrid/syntheziserHybrid"), { namedExports: { syntheziserCodeHybridCall: async () => { broadCalls.push("synth"); return {}; } } });
mock.module(moduleUrl("calls/code/joernCodeAnalystCall"), { namedExports: { joernCodeAnalystCall: async () => { broadCalls.push("analyst"); return { retrievedContextAnswers: [] }; } } });
mock.module(moduleUrl("calls/code/joernSofwareDeveloperCall"), { namedExports: { joernSofwareDeveloperCall: async () => { broadCalls.push("developer"); return { retrievedSoftwareContextAnswersSchema: [{ answer: "ordinary answer" }] }; } } });
mock.module(moduleUrl("calls/answerQuery/answerQueryCall"), { namedExports: { answerUserQueryCall: async () => ({ finalOutput: { response: "hello answer", reasoning: "direct" } }) } });

const { agentCodeGraph } = await import("../dist/stateGraphs/agentCodeGraph.js");
const invoke = (query, thread) => agentCodeGraph.invoke({ messages: [new HumanMessage(query)] }, { configurable: { thread_id: thread } });
const reset = (value) => { scenario = value; analystCalls = []; developerCalls = []; broadCalls = []; };

test("focused Joern loop, failures, and existing routes", async () => {
  reset("one");
  const query = 'Investigate error "Exact ERROR: X!" in Example.run';
  const first = await invoke(query, "focused-shared");
  assert.equal(first.focusedJoernSteps.length, 1);
  assert.equal(first.focusedJoernSufficient, true);
  assert.match(analystCalls[0], /Exact ERROR: X!/);
  assert.match(analystCalls[0], /Current single focused lookup:\nInvestigate error/);
  assert.match(developerCalls[0], /Exact ERROR: X!/);
  assert.match(first.retrievedSoftwareContextAnswersSchema[0].answer, /Verified source/);

  reset("follow");
  const second = await invoke(query, "focused-shared");
  assert.equal(second.focusedJoernSteps.length, 2);
  assert.equal(second.focusedJoernSufficient, true);
  assert.match(analystCalls[1], /Current single focused lookup:\nFind callers of Example.run/);
  assert.match(analystCalls[1], /handoff 1/);
  assert.match(analystCalls[1], /missing caller/);
  assert.match(developerCalls[1], /handoff 1/);
  assert.match(developerCalls[1], /handoff 2/);

  reset("limit");
  const limited = await invoke(query, "focused-limit");
  assert.equal(limited.focusedJoernSteps.length, 7);
  assert.equal(developerCalls.length, 7);
  assert.equal(limited.focusedJoernSufficient, false);
  assert.match(limited.retrievedSoftwareContextAnswersSchema[0].answer, /7-iteration limit/);

  for (const failure of ["analyst-error", "analyst-empty", "developer-error", "developer-invalid"]) {
    reset(failure);
    const result = await invoke(query, failure);
    assert.equal(result.focusedJoernSteps.length, 1);
    assert.equal(result.focusedJoernSufficient, false);
    assert.match(result.focusedJoernSteps[0].error, /failed|empty|invalid|unavailable/i);
    assert.match(result.retrievedSoftwareContextAnswersSchema[0].answer, /could not complete/);
    if (failure.startsWith("analyst")) assert.equal(developerCalls.length, 0);
  }

  reset("late-failure");
  const lateFailure = await invoke(query, "late-failure");
  assert.equal(lateFailure.focusedJoernSteps.length, 2);
  assert.match(lateFailure.retrievedSoftwareContextAnswersSchema[0].answer, /Verified source 1/);
  assert.match(lateFailure.retrievedSoftwareContextAnswersSchema[0].answer, /could not complete/);

  reset("one");
  const ordinary = await invoke("ordinary", "focused-shared");
  assert.deepEqual(broadCalls, ["synth", "analyst", "developer"]);
  assert.equal(ordinary.retrievedSoftwareContextAnswersSchema[0].answer, "ordinary answer");
  assert.equal(ordinary.focusedJoernSteps.length, 0);
  const direct = await invoke("hello", "focused-shared");
  assert.equal(direct.finalOutput.response, "hello answer");
  assert.equal(direct.retrievedSoftwareContextAnswersSchema.length, 0);
});
