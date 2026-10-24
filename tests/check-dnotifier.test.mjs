import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(
  new URL("../scripts/check-dnotifier.mjs", import.meta.url),
);
function check(mode, withCredentials = true) {
  const directory = mkdtempSync(join(tmpdir(), "nexa-check-"));
  const environmentFile = join(directory, ".env.local");
  const secret = "test-secret-never-print";
  writeFileSync(
    environmentFile,
    withCredentials
      ? `DNOTIFIER_APP_ID=test-app\nDNOTIFIER_SECRET=${secret}\n`
      : "",
  );
  // Replace all fetch calls before importing the SDK. No external calls occur.
  const preload = `
    let calls = 0;
    globalThis.fetch = async (_url, request) => {
      calls++;
      const body = JSON.parse(request.body);
      if (calls !== 1 || body.appId !== 'test-app' || body.appSecret !== '${secret}') throw new Error('Unexpected request');
      if (${JSON.stringify(mode)} === 'rejected') throw new Error('Server error includes ${secret}');
      return new Response(JSON.stringify({ _responseCode: 200, _responseData: {
        token: 'test-token-never-print',
        limits: ${mode === "no-limits" ? "null" : `{ aiEnabled: ${mode !== "disabled"}, ai_limits: { maxAIWordsPerMonth: 100 }, knowledge_base_limits: { maxWords: 200 } }`}
      }}), { status: 200 });
    };
    process.on('exit', () => { if (calls !== ${withCredentials ? 1 : 0}) process.exitCode = 2; });
  `;
  const env = { ...process.env };
  delete env.DNOTIFIER_APP_ID;
  delete env.DNOTIFIER_SECRET;
  try {
    const result = spawnSync(
      process.execPath,
      [
        "--env-file=" + environmentFile,
        "--import",
        "data:text/javascript," + encodeURIComponent(preload),
        script,
      ],
      { env, encoding: "utf8", timeout: 10000 },
    );
    assert.ifError(result.error);
    const output = result.stdout + result.stderr;
    assert.ok(!output.includes(secret), "Secret must not appear in output");
    assert.ok(
      !output.includes("test-token-never-print"),
      "Auth token must not appear in output",
    );
    return { code: result.status, output };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("missing credentials fail without a network request", () => {
  const result = check("success", false);
  assert.equal(result.code, 1);
  assert.match(result.output, /Missing credentials/);
});
test("authentication succeeds without making an AI request", () => {
  const result = check("success");
  assert.equal(result.code, 0);
  assert.match(result.output, /authentication successful/);
  assert.match(result.output, /AI enabled: true/);
  assert.match(result.output, /Monthly AI word limit: 100/);
});
test("rejected authentication hides raw SDK errors", () => {
  const result = check("rejected");
  assert.equal(result.code, 1);
  assert.match(result.output, /authentication failed/);
});
test("disabled AI is distinguished from failed authentication", () => {
  const result = check("disabled");
  assert.equal(result.code, 0);
  assert.match(result.output, /AI enabled: false/);
  assert.match(result.output, /AI is disabled/);
});
test("missing plan data warns without claiming AI access", () => {
  const result = check("no-limits");
  assert.equal(result.code, 0);
  assert.match(result.output, /Plan limits were not returned/);
});
