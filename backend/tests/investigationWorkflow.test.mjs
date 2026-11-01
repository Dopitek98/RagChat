import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";

mock.module(new URL("../dist/retrival/LangChainUtils.js", import.meta.url).href, {
  namedExports: { memoryCheckpointer: new MemorySaver() },
});

const plans = [["first", "second", "third"], ["new first", "new second"], [], ["only"], ["resume first", "resume second"], ["blank first", "blank second"]];
const evaluations = [false, true, true, false, false, false, true, true, true];
let failOnce = true;
const executions = [];
let plannerCalls = 0;
let analystCalls = 0;
let directCalls = 0;
let evaluationCalls = 0;
const evaluationsSeen = [];
const graphifyPrompts = [];
const analystPrompts = [];
const events = [];

mock.module(new URL("../dist/models/models.js", import.meta.url).href, {
  namedExports: {
    defaultAgentClassifyModel: {
      invoke: async (messages) => ({ classifications: [{
        source: messages.at(-1).content === "direct" ? "answerUserQueryCall" : "extendAgentCall",
        query: messages.at(-1).content === "investigate" ? "focused investigation" : messages.at(-1).content,
      }] }),
    },
    defaultInvestigationChatModel: { invoke: async () => ({ searchQueries: plans[plannerCalls++] }) },
    graphifyInvestigationAgent: {
      invoke: async ({ messages }) => {
        graphifyPrompts.push(messages.content);
        const query = messages.content.split("\n")[1];
        executions.push(query);
        events.push(`graphify:${query}`);
        if (query === "resume second" && failOnce) {
          failOnce = false;
          throw new Error("temporary execution failure");
        }
        return { messages: [new AIMessage(`handoff ${query}`)] };
      },
    },
    investigationSufficiencyModel: {
      invoke: async (messages) => {
        evaluationsSeen.push(messages.at(-1).content);
        events.push("evaluate");
        evaluationCalls++;
        return { sufficient: evaluations.shift(), reasoning: "evaluated" };
      },
    },
    softwareDeveloperAnalystAgent: {
      invoke: async ({ messages }) => {
        analystCalls++;
        analystPrompts.push(messages.content);
        events.push("developer");
        const response = messages.content.includes('"query": "blank first"') && !messages.content.includes('"query": "blank second"')
          ? "" : `developer response ${analystCalls}`;
        return { messages: [new AIMessage(response)] };
      },
    },
    defaultFinalOutputModel: { invoke: async () => { directCalls++; return { response: "direct answer", reasoning: "direct reasoning" }; } },
  },
});

const { agentDevGraph } = await import("../dist/stateGraphs/agentDevGraph.js");
const invoke = (query, thread) => agentDevGraph.invoke(
  { messages: [new HumanMessage(query)] },
  { configurable: { thread_id: thread } },
);

test("reuses the plan, accumulates context, and resets for a new request", async () => {
  const first = await invoke("investigate", "same-thread");
  assert.deepEqual(executions, ["first", "second"]);
  assert.equal(plannerCalls, 1);
  assert.equal(first.currentStepIndex, 2);
  assert.equal(first.sufficient, true);
  assert.equal(first.userQuery, "investigate");
  assert.equal(first.investigationReportOutput, "developer response 2");
  assert.deepEqual(events.slice(0, 6), ["graphify:first", "developer", "evaluate", "graphify:second", "developer", "evaluate"]);
  assert.match(graphifyPrompts[1], /handoff first/);
  assert.match(graphifyPrompts[1], /developer response 1/);
  assert.match(graphifyPrompts[1], /evaluated/);
  assert.match(analystPrompts[1], /handoff first/);
  assert.match(analystPrompts[1], /handoff second/);
  assert.match(analystPrompts[1], /developer response 1/);
  assert.match(evaluationsSeen[1], /developer response 2/);
  assert.match(evaluationsSeen[1], /developer response 1/);
  assert.equal(first.investigationSteps[0].evaluation.sufficient, false);
  assert.equal(first.investigationSteps[1].evaluation.sufficient, true);
  assert.equal(directCalls, 0);

  const next = await invoke("new investigation", "same-thread");
  assert.equal(plannerCalls, 2);
  assert.equal(next.currentStepIndex, 1);
  assert.match(next.graphifyOutput, /handoff new first/);
  assert.doesNotMatch(next.graphifyOutput, /handoff first/);

  const empty = await invoke("empty", "empty-thread");
  assert.equal(empty.currentStepIndex, 0);
  assert.equal(evaluationCalls, 4);

  const exhausted = await invoke("exhaust", "exhaust-thread");
  assert.equal(exhausted.currentStepIndex, 1);
  assert.equal(exhausted.sufficient, false);
  assert.equal(analystCalls, 5);
  assert.equal(plannerCalls, 4);

  const direct = await invoke("direct", "direct-thread");
  assert.equal(direct.finalOutput.response, "direct answer");
  assert.equal(plannerCalls, 4);
  assert.equal(directCalls, 1);

  await assert.rejects(invoke("resume", "resume-thread"), /temporary execution failure/);
  const resumed = await agentDevGraph.invoke(null, {
    configurable: { thread_id: "resume-thread" },
  });
  assert.equal(plannerCalls, 5);
  assert.equal(executions.filter((query) => query === "resume first").length, 1);
  assert.equal(executions.filter((query) => query === "resume second").length, 2);
  assert.equal(resumed.currentStepIndex, 2);
  assert.match(resumed.graphifyOutput, /handoff resume first/);
  assert.match(resumed.graphifyOutput, /handoff resume second/);
  assert.equal(resumed.investigationSteps[0].evaluation.sufficient, false);

  const blank = await invoke("blank", "blank-thread");
  assert.equal(blank.currentStepIndex, 2);
  assert.equal(blank.investigationSteps[0].evaluation.sufficient, false);
  assert.match(blank.investigationSteps[0].evaluation.reasoning, /did not produce/);
  assert.equal(blank.sufficient, true);
});
