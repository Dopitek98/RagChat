import { MCPAdapter } from "@langchain/mcp-adapters";
import { createAgent, SystemMessage, ToolMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenRouter } from "@langchain/openrouter";

import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  queryJoern,
  queryJoernForClassMethods,
  toJoernFilePattern,
} from "./joernTools.js";

const TOKEN_BUDGET = 10000;
const GRAPHIFY_MCP_URL = "http://localhost:8080/mcp";

export const adapter = new MCPAdapter({
  servers: {
    graphify: {
      url: GRAPHIFY_MCP_URL,
    },
  },
});

async function createWrappedTools() {
  const tools = await adapter.listTools();

  return tools.map((mcpTool) => {
    return tool(
      async (args) => {
        return await mcpTool.invoke({
          ...args,
          token_budget: TOKEN_BUDGET,
        });
      },
      {
        name: mcpTool.name,
        description: mcpTool.description ?? "",
        schema: mcpTool.schema,
      },
    );
  });
}

export const wrappedTools = await createWrappedTools();

function createReadFileTool(
  projectRoot = "C:\\Users\\Michał\\Desktop\\AIJS\\ragChat",
) {
  const root = path.resolve(projectRoot);

  return tool(
    async ({ filePath }) => {
      try {
        // Accept both relative paths and absolute paths within the project root.
        const resolvedPath = path.resolve(root, filePath);
        const relativePath = path.relative(root, resolvedPath);

        // Reject paths outside the project root.
        if (relativePath === ".." || relativePath.startsWith(`..${path.sep}`)) {
          return "Error: path is outside the project directory.";
        }

        // Keep this first version simple: only regular files.
        const stats = await fs.lstat(resolvedPath);

        if (!stats.isFile()) {
          return "Error: the requested path is not a regular file.";
        }

        // Avoid accidentally loading huge files into the context.
        const maxBytes = 100_000;

        if (stats.size > maxBytes) {
          return `Error: file is too large (${stats.size} bytes). Maximum: ${maxBytes} bytes.`;
        }
        const content = await fs.readFile(resolvedPath, "utf8");
        console.log("=====Content======");
        console.log(content);
        console.log("=====Content======");
        return content;
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return "Error: file does not exist.";
        }

        return `Error reading file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
      }
    },
    {
      name: "read_file",
      description:
        "Read a UTF-8 text file from the project directory. " +
        "Provide a relative or absolute path within the project root, such as src/index.ts or package.json. " +
        "Use this tool to inspect source code before proposing changes.",
      schema: z.object({
        filePath: z
          .string()
          .min(1)
          .describe("Relative or absolute path to a file within the project"),
      }),
    },
  );
}

export const toolRead = createReadFileTool();

export const joernToolRead = createReadFileTool(
  "C:\\opensource\\jenkins\\core\\src\\main\\java",
);

export const joernListClassMethodsTool = tool(
  async ({ className }) =>
    JSON.stringify(
      await queryJoernForClassMethods(
        className,
        `cpg.typeDecl.name(placeholder).method.filterNot(el => Set("<clinit>","<init>").contains(el.name)).toSet.map(el => (el.name, el.filename,el.lineNumber,el.lineNumberEnd)).l`,
      ),
      null,
      2,
    ),
  {
    name: "joern_list_class_methods",
    description:
      "List methods declared by a class in the Joern code property graph, " +
      "excluding constructors and class initializers. Returns method name, source file, start line, and end line.",
    schema: z.object({
      className: z
        .string()
        .min(1)
        .max(256)
        .describe("Exact class or type declaration name to look up in Joern"),
    }),
  },
);

export const joernListClassMethodsWithCallersTool = tool(
  async ({ className }) =>
    JSON.stringify(
      await queryJoernForClassMethods(
        className,
        `cpg.typeDecl.name(placeholder).method.repeat(_.caller)(_.emit.maxDepth(5)).toSet.map(el => (el.name, el.filename,el.lineNumber,el.lineNumberEnd)).l`,
      ),
      null,
      2,
    ),
  {
    name: "joern_list_class_methods_with_callers_of_it_deepth_5",
    description:
      "List class methods and caller methods reachable up to five levels deep in the Joern code property graph. Returns method name, source file, start line, and end line.",
    schema: z.object({
      className: z
        .string()
        .min(1)
        .max(256)
        .describe("Exact class or type declaration name to look up in Joern"),
    }),
  },
);

export const joernFindMethodCallersDeepth5Tool = tool(
  async ({ methodName }) =>
    JSON.stringify(
      await queryJoernForClassMethods(
        `.*${methodName}.*`,
        `cpg.method.code(placeholder).repeat(_.callIn.method)(_.emit.maxDepth(5)).toSet.map(el => (el.name, el.filename,el.lineNumber,el.lineNumberEnd)).l`,
      ),
      null,
      2,
    ),
  {
    name: "joern_find_method_callers_depth_5",
    description:
      "Find where a method is called in the Joern code property graph, following incoming calls up to five levels deep. Returns method name, source file, start line, and end line.",
    schema: z.object({
      methodName: z
        .string()
        .min(1)
        .max(256)
        .describe("Method name or code fragment to search for in Joern"),
    }),
  },
);

export const joernDumpMethodCodeTool = tool(
  async ({ method_name, filepath }) => {
    const methodPattern = `.*${method_name}.*`;
    const filePattern = toJoernFilePattern(filepath);
    const query =
      `cpg.method.name(${JSON.stringify(methodPattern)})` +
      `.filename(${JSON.stringify(filePattern)}).dumpRaw`;

    return await queryJoern(query);
  },
  {
    name: "joern_dump_method_code",
    description:
      "Dump raw source code for methods whose names contain the given method name and whose source file matches the provided path. The file path is converted to a Joern regex; returns Joern's raw method dump.",
    schema: z.object({
      method_name: z
        .string()
        .max(256)
        .describe("Method name or empty string to search for in Joern"),
      filepath: z
        .string()
        .min(1)
        .max(4096)
        .describe("Source file path, converted to a Joern file pattern"),
    }),
  },
);

export const joernGetParentMethodContainingCallTool = tool(
  async ({ callCode }) =>
    JSON.stringify(
      await queryJoernForClassMethods(
        `.*${callCode}.*`,
        `cpg.call.code(placeholder).repeat(_.astParent)(_.until(_.isMethod)).isMethod.toSet.map(el => (el.name, el.filename,el.lineNumber,el.lineNumberEnd)).l`,
      ),
      null,
      2,
    ),
  {
    name: "joern_get_parent_method_containing_call",
    description:
      "Find the parent method containing a call with the given code in the Joern code property graph. Pass raw code or message text without surrounding quotes; it is searched as a substring. Returns method name, source file, start line, and end line.",
    schema: z.object({
      callCode: z
        .string()
        .min(1)
        .max(4096)
        .describe("Call code or message text to search for in Joern"),
    }),
  },
);
export const joernFindMethodsIncludingLiteralTool = tool(
  async ({ literal }) =>
    JSON.stringify(
      await queryJoernForClassMethods(
        `.*${literal}.*`,
        `cpg.fieldIdentifier.filter(f => cpg.literal.code(placeholder).inCall.name("<operator>.assignment").argument(1).ast.isFieldIdentifier.canonicalName.l.distinct.contains(f.canonicalName)).method.repeat(_.caller)(_.emit.maxDepth(4)).filterNot(_.name == "<clinit>").toSet.map(el => Map("name" -> el.name,"filename" -> el.filename,"lineNumber" -> el.lineNumber,"lineNumberEnd" -> el.lineNumberEnd)).l`,
      ),
      null,
      2,
    ),
  {
    name: "joern_find_methods_including_literal",
    description:
      "Find methods associated with a field assigned the exact given string literal, plus caller methods up to three levels deep. Pass the literal value without surrounding quotes; the tool adds query quoting itself. Excludes class initializers and returns method name, source file, start line, and end line. It may take some time to run, depending on the size of the codebase and the number of matches.",
    schema: z.object({
      literal: z
        .string()
        .min(1)
        .max(4096)
        .describe("String literal value, without surrounding quotes"),
    }),
  },
);
