import { SystemMessage } from "@langchain/core/messages";
import { defaultClassifyModel } from "../../models/models.js";

export const classifyQueryCall = async (state: any) => {
  // console.log("classifyQueryCall state:", state);
  console.log(state.messages[state.messages.length - 1].content);
  // For each relevant source, generate a targeted sub-question optimized for that source.
  const response = await defaultClassifyModel.invoke([
    new SystemMessage(
      `
Classify the user's query by selecting the relevant knowledge-base source(s).
Do not answer, rewrite, summarize, expand, translate, or otherwise modify the user's query.
The 'query' value in every classification MUST be an exact character-for-character copy
of the user's original query. Do not generate a targeted sub-question.

Available sources:
- extendQueryCall: Documentation, codebase, and technical references
- answerUserQueryCall: Questions outside the technical domain

Return ONLY the relevant source(s). For each selected source, copy the original user
query exactly into its 'query' field. Include a source only when it is relevant.

Example input: "Which models does LangChain support?"
Example output:
- source: extendQueryCall
  query: "Which models does LangChain support?"
      `,
    ),
    {
      role: "user",
      content: state.messages[state.messages.length - 1].content,
    },
  ]);

  console.log("classifyQueryCall response:", response);

  return { classifications: response.classifications };
};
