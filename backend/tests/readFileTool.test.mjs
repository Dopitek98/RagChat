import { test, mock } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const reads = [];
mock.module("@langchain/mcp-adapters", { namedExports: {
  MCPAdapter: class { async listTools() { return []; } },
} });
mock.module("node:fs/promises", { namedExports: {
  lstat: async (file) => {
    if (file.endsWith("missing.txt")) throw Object.assign(new Error("not found"), { code: "ENOENT" });
    return { isFile: () => !file.endsWith("directory"), size: file.endsWith("large.txt") ? 100_001 : 10 };
  },
  readFile: async (file) => { reads.push(file); return "file contents"; },
} });

const { toolRead, joernToolRead } = await import("../dist/tools/tools.js");
const projectRoot = String.raw`C:\Users\Michał\Desktop\AIJS\ragChat`;
const joernRoot = String.raw`C:\opensource\jenkins\core\src\main\java`;

test("read_file tools retain their separate roots and shared schema", async () => {
  assert.equal(toolRead.name, "read_file");
  assert.equal(joernToolRead.name, "read_file");
  assert.equal(await toolRead.invoke({ filePath: "example.txt" }), "file contents");
  assert.equal(reads.at(-1), path.resolve(projectRoot, "example.txt"));
  assert.equal(await joernToolRead.invoke({ filePath: "Example.java" }), "file contents");
  assert.equal(reads.at(-1), path.resolve(joernRoot, "Example.java"));
  assert.equal(await joernToolRead.invoke({ filePath: path.join(joernRoot, "Example.java") }), "file contents");
  await assert.rejects(joernToolRead.invoke({ filePath: "" }));
});

test("read_file rejects invalid paths and oversized files", async () => {
  assert.match(await joernToolRead.invoke({ filePath: "..\\outside.txt" }), /outside the project/);
  assert.match(await joernToolRead.invoke({ filePath: String.raw`D:\outside.txt` }), /outside the project/);
  assert.match(await joernToolRead.invoke({ filePath: "directory" }), /not a regular file/);
  assert.match(await joernToolRead.invoke({ filePath: "large.txt" }), /too large/);
  assert.match(await joernToolRead.invoke({ filePath: "missing.txt" }), /does not exist/);
});
