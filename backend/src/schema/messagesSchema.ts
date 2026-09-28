import * as z from "zod";
import { StateSchema, MessagesValue, ReducedValue } from "@langchain/langgraph";

export const MessagesState = new StateSchema({
  messages: MessagesValue,
  searchResults: z.array(z.string()).optional(),
  searchQueries: z.array(z.string()).optional(),
  llmCalls: new ReducedValue(z.number().default(0), {
    reducer: (x, y) => x + y,
  }),
});

export const QueriesStructuredOutput = z.object({
  userQuery: z.string().describe("Question asked by the user"),
  queries: z.array(z.string()).describe("Your extended user queries"),
});
