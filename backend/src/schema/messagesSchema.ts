import * as z from "zod";
import { StateSchema, MessagesValue, ReducedValue } from "@langchain/langgraph";

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

export const queryExtenderOutput = z.object({
  searchQueries: z.array(z.string()).describe("Your extended user queries"),
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
