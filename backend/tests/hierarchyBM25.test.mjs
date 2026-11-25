import { test } from "node:test";
import assert from "node:assert/strict";
import { rankHierarchyByKeywords } from "../dist/calls/bm25/hierarchyBM25.js";

const record = (name, keywords) => ({
  content: { level: 3, keywords, score: 0, name, parentName: null, child: null, description: null },
});

test("sums only the five best individual keyword scores for a string query", () => {
  const keywords = ["Groovy", "Initialization", "Content", "Handler", "Script", "Runtime", "Install"];
  const doc = record("impl", keywords);
  const query = keywords.join(" ");
  const combined = rankHierarchyByKeywords([doc], query)[0];
  const separate = rankHierarchyByKeywords(keywords.map((keyword) => record(keyword, [keyword])), query);
  const expected = separate.map((item) => item.content.score).sort((a, b) => b - a).slice(0, 5).reduce((sum, score) => sum + score, 0);
  assert.equal(separate.length, 7);
  assert.ok(Math.abs(combined.content.score - expected) < 1e-10);
  assert.equal(doc.content.score, 0);
});

test("ranks up to 40 matching hierarchy records instead of the engine's default 10", () => {
  const docs = Array.from({ length: 50 }, (_, i) => record(`doc-${i}`, ["Groovy", `unique${i}`]));
  const result = rankHierarchyByKeywords(docs, "Groovy");
  assert.equal(result.length, 40);
  assert.ok(result.every((doc) => doc.content.score > 0));
  assert.ok(result.every((doc, i) => i === 0 || result[i - 1].content.score >= doc.content.score));
});

test("handles small, empty, and unmatched inputs", () => {
  assert.equal(rankHierarchyByKeywords([record("one", ["Groovy"])], "Groovy").length, 1);
  assert.deepEqual(rankHierarchyByKeywords([record("one", ["Groovy"])], "missing"), []);
  assert.deepEqual(rankHierarchyByKeywords([record("one", null)], "Groovy"), []);
  assert.deepEqual(rankHierarchyByKeywords([record("one", ["Groovy"])], "  "), []);
});
