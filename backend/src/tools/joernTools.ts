const JOERN_BASE_URL = process.env.JOERN_BASE_URL ?? "http://localhost:8081";
const JOERN_QUERY_TIMEOUT_MS = 100_000;
const JOERN_POLL_INTERVAL_MS = 250;

export function scalaOutputToJson(output: string): Array<{
  method: string;
  signatureOrFile: string;
  value: number | null;
  endLine: number | null;
}> {
  const tokens = output
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .match(/"""[\s\S]*?"""|"(?:\\.|[^"\\])*"|[A-Za-z_]\w*|->|-?\d+|[()[\],=]/g);

  if (!tokens) return [];

  const parsedTokens = tokens;
  const listIndex = tokens.findIndex(
    (token, index) => token === "List" && tokens[index + 1] === "(",
  );
  if (listIndex === -1) throw new Error("Expected a Scala List result");

  let pos = listIndex + 1;

  function next() {
    return parsedTokens[pos++];
  }

  function expect(token: string) {
    const actual = next();
    if (actual !== token) {
      throw new Error(`Expected ${token}, got ${actual}`);
    }
  }

  function parseString() {
    const token = next();

    if (token.startsWith('"""')) {
      return token.slice(3, -3);
    }

    return JSON.parse(token);
  }

  function parseOption() {
    const token = next();

    if (token === "None") return null;

    if (token === "Some") {
      expect("(");
      expect("value");
      expect("=");

      const value = Number(next());
      expect(")");

      return value;
    }

    throw new Error(`Unexpected option: ${token}`);
  }

  function parseTuple() {
    expect("(");

    const method = parseString();
    expect(",");

    const signatureOrFile = parseString();
    expect(",");

    const third = parseOption();

    let fourth = null;

    // Check whether this tuple has a fourth element
    if (parsedTokens[pos] === ",") {
      next();
      fourth = parseOption();
    }

    expect(")");

    return {
      method,
      signatureOrFile,
      value: third,
      endLine: fourth,
    };
  }

  function parseMap() {
    expect("Map");
    expect("(");

    let method: string | undefined;
    let signatureOrFile: string | undefined;
    let value: number | null | undefined;
    let endLine: number | null | undefined;

    while (parsedTokens[pos] !== ")") {
      const key = parseString();
      expect("->");
      switch (key) {
        case "name":
          method = parseString();
          break;
        case "filename":
          signatureOrFile = parseString();
          break;
        case "lineNumber":
          value = parseOption();
          break;
        case "lineNumberEnd":
          endLine = parseOption();
          break;
        default:
          throw new Error(`Unexpected map key: ${key}`);
      }
      if (parsedTokens[pos] !== ",") break;
      next();
    }

    expect(")");
    if (
      method === undefined ||
      signatureOrFile === undefined ||
      value === undefined ||
      endLine === undefined
    ) {
      throw new Error("Scala method map is missing required fields");
    }
    return { method, signatureOrFile, value, endLine };
  }

  expect("(");

  const results = [];

  while (parsedTokens[pos] !== ")") {
    results.push(parsedTokens[pos] === "Map" ? parseMap() : parseTuple());

    if (parsedTokens[pos] === ",") {
      next();
    } else {
      break;
    }
  }

  expect(")");

  return results;
}

async function readJsonResponse(response: Response, operation: string) {
  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `${operation} failed with HTTP ${response.status}: ${body || response.statusText}`,
    );
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(
      `${operation} returned invalid JSON: ${
        error instanceof Error ? error.message : "unknown parse error"
      }`,
    );
  }
}

function createJoernQuery(placeholder: string, placeholderQuery: string) {
  return placeholderQuery.replaceAll("placeholder", () =>
    JSON.stringify(placeholder),
  );
}

//needs to be passed to dump code tool
export function toJoernFilePattern(filePath: string) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new TypeError("filePath must be a non-empty string.");
  }

  const escapedPath = filePath
    .split(/[\\/]+/)
    .filter(Boolean)
    .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[/\\\\]");

  return `.*${escapedPath}.*`;
}

export async function queryJoern(query: string) {
  console.log("Query: " + query);
  const queryResponse = await fetch(`${JOERN_BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const queryResult = await readJsonResponse(
    queryResponse,
    "Joern query submission",
  );

  console.log("Query result:", queryResult);

  if (typeof queryResult.uuid !== "string" || queryResult.uuid.length === 0) {
    throw new Error("Joern query submission did not return a result UUID.");
  }

  const deadline = Date.now() + JOERN_QUERY_TIMEOUT_MS;
  let result;

  let lastPendingState = "Joern has not returned a result yet.";

  while (Date.now() < deadline) {
    const resultResponse = await fetch(
      `${JOERN_BASE_URL}/result/${encodeURIComponent(queryResult.uuid)}`,
      { headers: { "Content-Type": "application/json" } },
    );

    if (
      [202, 404, 408, 425, 429, 500, 502, 503, 504].includes(
        resultResponse.status,
      )
    ) {
      const responseBody = await resultResponse.text();
      lastPendingState =
        `Joern returned HTTP ${resultResponse.status}` +
        (responseBody ? `: ${responseBody.slice(0, 500)}` : ".");
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.min(JOERN_POLL_INTERVAL_MS, Math.max(0, deadline - Date.now())),
        ),
      );
      continue;
    }

    result = await readJsonResponse(resultResponse, "Joern query result");
    if (typeof result.stdout === "string" && result.stdout.length > 0) break;

    if (typeof result.stderr === "string" && result.stderr.length > 0) {
      throw new Error(`Joern query failed: ${result.stderr}`);
    }

    lastPendingState = "Joern returned a result without stdout.";
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        Math.min(JOERN_POLL_INTERVAL_MS, Math.max(0, deadline - Date.now())),
      ),
    );
  }

  if (
    !result ||
    typeof result.stdout !== "string" ||
    result.stdout.length === 0
  ) {
    throw new Error(
      `Joern query timed out after ${JOERN_QUERY_TIMEOUT_MS} ms. ${lastPendingState}`,
    );
  }

  if (result.stderr && result.stdout.trim() === "") {
    throw new Error(`Joern query failed: ${result.stderr}`);
  }

  return result.stdout;
}

export async function queryJoernForClassMethods(
  className: string,
  placeholderQuery: string,
) {
  const output = await queryJoern(
    createJoernQuery(className, placeholderQuery),
  );

  return scalaOutputToJson(output).map(
    ({ method, signatureOrFile, value, endLine }) => ({
      name: method,
      file: signatureOrFile,
      lineNumber: value,
      lineNumberEnd: endLine ?? null,
    }),
  );
}
