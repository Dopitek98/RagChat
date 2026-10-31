import { MCPAdapter } from "@langchain/mcp-adapters";
import {
  createAgent,
  SystemMessage,
  ToolMessage,
} from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenRouter } from "@langchain/openrouter";

import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";

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
  console.log(tools);

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
