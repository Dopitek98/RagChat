import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { queryJoernForClassMethods, scalaOutputToJson } from "../dist/tools/joernTools.js";

const color = (text, code) => `\x1b[${code}m${text}\x1b[0m`;
const stdout = `${color("val", 33)} ${color("res34", 36)}: ${color("List", 32)}[${color("Map", 32)}[${color("String", 32)}, ${color("String", 32)} ${color("|", 32)} ${color("Option", 32)}[${color("Int", 32)}]]] = List(
  Map(
    "name" -> "run",
    "filename" -> """src\\main\\java\\hudson\\cli\\BuildCommand.java""",
    "lineNumber" -> Some(value = 101),
    "lineNumberEnd" -> Some(value = 224)
  ),
  Map(
    "name" -> "<lambda>1",
    "filename" -> """src\\main\\java\\hudson\\cli\\CLIAction.java""",
    "lineNumber" -> Some(value = 207),
    "lineNumberEnd" -> Some(value = 217)
  )
)\r\n`;

const expected = [
  { name: "run", file: String.raw`src\main\java\hudson\cli\BuildCommand.java`, lineNumber: 101, lineNumberEnd: 224 },
  { name: "<lambda>1", file: String.raw`src\main\java\hudson\cli\CLIAction.java`, lineNumber: 207, lineNumberEnd: 217 },
];

test("parses a colorized Joern result through the class-method query", async (t) => {
  const fetchMock = mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/query")) {
      assert.equal(JSON.parse(options.body).query, 'cpg.typeDecl.name("CLIAction")');
      return Response.json({ uuid: "test-id" });
    }
    assert.ok(url.endsWith("/result/test-id"));
    return Response.json({ success: true, uuid: "test-id", stdout });
  });
  t.after(() => fetchMock.mock.restore());

  assert.deepEqual(await queryJoernForClassMethods("CLIAction", "cpg.typeDecl.name(placeholder)"), expected);
});

test("continues to parse uncolored tuples, null options, and empty lists", () => {
  assert.deepEqual(scalaOutputToJson('val res0: List[(String, String, Option[Int])] = List(("run", "Example.java", None))'), [
    { method: "run", signatureOrFile: "Example.java", value: null, endLine: null },
  ]);
  assert.deepEqual(scalaOutputToJson("val res1: List[Map[String, String]] = List()"), []);
  assert.deepEqual(scalaOutputToJson('List(Map("name" -> "run", "filename" -> "Example.java", "lineNumber" -> None, "lineNumberEnd" -> None))'), [
    { method: "run", signatureOrFile: "Example.java", value: null, endLine: null },
  ]);
});
