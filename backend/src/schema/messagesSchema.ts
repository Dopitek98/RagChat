import * as z from "zod";
import { StateSchema, MessagesValue, ReducedValue } from "@langchain/langgraph";
import { ObjectId } from "mongodb";
import type { CodeContentResult } from "../types/types.js";

const codeContentResultSchema: z.ZodType<CodeContentResult> = z.object({
  content: z.object({
    id: z.instanceof(ObjectId),
    level: z.number(),
    keywords: z.array(z.string()).nullable(),
    score: z.number(),
    name: z.string(),
    parentName: z.string().nullable(),
    child: z.array(z.instanceof(ObjectId)).nullable(),
    description: z.string().nullable(),
    type: z.string().nullable().optional(),
    source: z.string().nullable(),
    relatedClasses: z
      .array(
        z.object({
          source: z.string().nullable(),
          name: z.string().nullable(),
          parentName: z.string().nullable(),
          description: z.string().nullable(),
        }),
      )
      .optional(),
  }),
});

export const retrievedContextAnswersSchema = z.object({
  answer: z.string().nullable(),
  retrievedContext: codeContentResultSchema.optional(),
});

export const joernAgentAnswerSchema = z.object({
  answer: z.string().nullable(),
});

export const retrievedSoftwareContextAnswersSchema = z.object({
  answer: z.string().nullable(),
  retrievedContext: retrievedContextAnswersSchema.optional(),
});

export const AgentFinalOutput = z.object({
  response: z
    .string()
    .describe("The final response to the user query")
    .optional(),
  reasoning: z.string().describe("The reasoning behind the final response"),
});

export const MessagesState = new StateSchema({
  messages: MessagesValue,
  userQuery: z.string().describe("The original user query"),
  searchQueries: z.array(z.string()).optional(),
  retrievedContext: z
    .array(
      z.object({
        pageContent: z.string(),
        source: z.string(),
        fromLine: z.number(),
        toLine: z.number(),
      }),
    )
    .optional(),
  classifications: z.array(
    z.object({
      source: z.enum(["answerUserQueryCall", "extendQueryCall"]),
      query: z.string(),
    }),
  ),
  combinedFinalOutput: new ReducedValue(
    z.array(AgentFinalOutput).default(() => []),
    { reducer: (current, update) => current.concat(update) },
  ),
  finalOutput: AgentFinalOutput.optional(),
});

export const agentCodeState = new StateSchema({
  messages: MessagesValue,
  userQuery: z.string().describe("The original user query"),
  searchQueries: z.array(z.string()).optional(),
  retrievedContext: z.array(codeContentResultSchema).optional(),
  isDirectJoernRequest: z.boolean().optional(),
  retrievedContextAnswers: z.array(retrievedContextAnswersSchema).optional(),
  retrievedSoftwareContextAnswersSchema: z
    .array(retrievedSoftwareContextAnswersSchema)
    .optional(),
  classifications: z.array(
    z.object({
      source: z.enum([
        "answerUserQueryCall",
        "syntheziserCall",
        "joernCodeAnalystCall",
      ]),
      query: z.string(),
    }),
  ),
  combinedFinalOutput: new ReducedValue(
    z.array(AgentFinalOutput).default(() => []),
    { reducer: (current, update) => current.concat(update) },
  ),
  finalOutput: AgentFinalOutput.optional(),
});

export const queryExtenderOutput = z.object({
  searchQueries: z.array(z.string()).describe("Your extended user queries"),
});

export const investigationExtenderOutput = z.object({
  searchQueries: z
    .array(z.string())
    .length(5)
    .describe("Up to 5 analyst investigation queries, one per item"),
});

export const ClassificationResultSchema = z.object({
  classifications: z
    .array(
      z.object({
        source: z.enum(["answerUserQueryCall", "extendQueryCall"]),
        query: z.string(),
      }),
    )
    .describe("List of agents to invoke with their targeted sub-questions"),
});

export const ClassificationAgentSchema = z.object({
  classifications: z
    .array(
      z.object({
        source: z.enum(["answerUserQueryCall", "extendAgentCall"]),
        query: z.string(),
      }),
    )
    .describe("List of agents to invoke with their targeted sub-questions"),
});

export const CodeClassificationAgentSchema = z.object({
  classifications: z
    .array(
      z.object({
        source: z.enum([
          "answerUserQueryCall",
          "syntheziserCall",
          "joernCodeAnalystCall",
        ]),
        query: z.string(),
      }),
    )
    .describe("List of agents to invoke with their targeted sub-questions"),
});

export const AgentClassificationResultSchema = z.object({
  classifications: z
    .array(
      z.object({
        source: z.enum([
          "bugsAgent",
          "featureAgent",
          "refactoringAgent",
          "directAgent",
          "notRelatedAgent",
        ]),
        query: z.string(),
      }),
    )
    .describe("List of agents to invoke with their targeted sub-questions"),
});

export const investigationReportOutput = z.object({
  summary: z
    .string()
    .describe(
      "Brief description of the reported issue without assuming its cause",
    ),
  observedBehavior: z
    .string()
    .describe("Reported behavior and any missing details"),
  expectedBehavior: z
    .string()
    .describe("User-provided expectation, or unknown if not provided"),
  stepsToReproduce: z
    .array(z.string())
    .describe("Supplied or verified reproduction steps; empty if unknown"),
  investigationAndEvidence: z
    .array(z.string())
    .describe(
      "Source findings with verified locations, unverified handoff claims, or a statement that no files were inspected",
    ),
  possibleCause: z
    .array(z.string())
    .describe(
      "Evidence-backed hypotheses with uncertainty, or why the cause is unknown",
    ),
  recommendedNextSteps: z
    .array(z.string())
    .describe("Prioritized verification or remediation steps"),
  openQuestionsAndLimitations: z
    .array(z.string())
    .describe(
      "Missing information, failed reads, and uncertainties; empty if none identified",
    ),
});

export const investigationSufficiencyOutput = z.object({
  sufficient: z
    .boolean()
    .describe(
      "Whether the developer's response meaningfully answers the user's request",
    ),
  reasoning: z.string().describe("Why the context is or is not sufficient"),
});

export const AgentMessagesState = new StateSchema({
  messages: MessagesValue,
  userQuery: z.string().describe("The original user query"),
  searchQueries: z.array(z.string()).optional(),
  currentStepIndex: z.number().int().nonnegative().default(0),
  sufficient: z.boolean().default(false),
  sufficiencyReasoning: z.string().optional(),
  retrievedContext: z.string().optional(),
  classifications: z.array(
    z.object({
      source: z.enum(["answerUserQueryCall", "extendAgentCall"]),
      query: z.string(),
    }),
  ),
  combinedFinalOutput: new ReducedValue(
    z.array(AgentFinalOutput).default(() => []),
    { reducer: (current, update) => current.concat(update) },
  ),
  finalOutput: AgentFinalOutput.optional(),
  investigationReportOutput: z.string().optional(),
  investigationSteps: z
    .array(
      z.object({
        query: z.string(),
        handoff: z.string(),
        developerResponse: z.string().optional(),
        evaluation: investigationSufficiencyOutput.optional(),
      }),
    )
    .default(() => []),
  graphifyOutput: z.string().optional(),
});
