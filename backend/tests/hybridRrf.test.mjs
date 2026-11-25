import { test } from "node:test";
import assert from "node:assert/strict";
import { ObjectId } from "mongodb";
import { buildRrfTopDocuments } from "../dist/calls/hybrid/utilsHybrid.js";

const documentOptions = {
  getKey: (item) => JSON.stringify([item.source, item.fromLine, item.toLine]),
  getScore: (item) => item.score,
  withScore: (item, score) => ({ source: item.source, fromLine: item.fromLine, toLine: item.toLine, pageContent: item.pageContent, score }),
  merge: (semantic, bm25) => ({ ...semantic, pageContent: semantic.pageContent || bm25.pageContent }),
};
const doc = (source, score, pageContent = source) => ({ source, fromLine: 1, toLine: 2, pageContent, score });
const code = (id, score, name) => ({ content: { id, score, name, level: 7, parentName: null, keywords: null, child: null, description: "description" } });
const codeOptions = {
  getKey: (item) => item.content.id.toString(),
  getScore: (item) => item.content.score,
  withScore: (item, score) => ({ ...item, content: { ...item.content, score } }),
};

test("fuses document rankings without mutating input and fills missing text", () => {
  const semantic = [doc("a", 0.1, ""), doc("b", 0.9)];
  const bm25 = [doc("a", 4, "text"), { ...doc("c", 2), id: "not returned" }];
  const output = buildRrfTopDocuments(semantic, bm25, documentOptions);
  assert.deepEqual(output.map((item) => item.source), ["a", "b", "c"]);
  assert.equal(output[0].score, 0.5 / 62 + 0.5 / 61);
  assert.equal(output[0].pageContent, "text");
  assert.equal(semantic[0].pageContent, "");
  assert.equal(bm25[1].score, 2);
  assert.equal("id" in output[2], false);
});

test("uses stable hierarchy identity, scores both sources, and keeps metadata", () => {
  const id = new ObjectId();
  const semantic = [code(id, 0.8, "shared"), code(new ObjectId(), 0.7, "shared")];
  const bm25 = [code(new ObjectId(id.toString()), 3, "shared")];
  const result = buildRrfTopDocuments(semantic, bm25, codeOptions);
  assert.equal(result.length, 2);
  assert.equal(result[0].content.id.toString(), id.toString());
  assert.equal(result[0].content.score, 1 / 61);
  assert.equal(result[0].content.description, "description");
  assert.equal(semantic[0].content.score, 0.8);
});

test("deduplicates each ranked list before assigning ranks", () => {
  const a = new ObjectId();
  const b = new ObjectId();
  const result = buildRrfTopDocuments(
    [code(a, 10, "a"), code(a, 9, "a"), code(b, 8, "b")],
    [code(b, 5, "b"), code(b, 4, "b")],
    codeOptions,
  );
  assert.equal(result[0].content.id.toString(), b.toString());
  assert.equal(result[0].content.score, 0.5 / 62 + 0.5 / 61);
});

test("honors ratio, invalid ratio fallback, limits and empty lists", () => {
  const semantic = [doc("a", 1)];
  const bm25 = [doc("b", 1)];
  assert.equal(buildRrfTopDocuments(semantic, bm25, { ...documentOptions, semanticRatio: 0 })[0].source, "b");
  assert.equal(buildRrfTopDocuments(semantic, bm25, { ...documentOptions, semanticRatio: 1 })[0].source, "a");
  assert.equal(buildRrfTopDocuments(semantic, bm25, { ...documentOptions, semanticRatio: NaN })[0].score, 0.5 / 61);
  assert.equal(buildRrfTopDocuments(semantic, bm25, { ...documentOptions, limit: 1 }).length, 1);
  assert.deepEqual(buildRrfTopDocuments([], [], documentOptions), []);
  assert.equal(buildRrfTopDocuments(Array.from({ length: 10 }, (_, i) => doc(String(i), i)), [], documentOptions).length, 5);
});
