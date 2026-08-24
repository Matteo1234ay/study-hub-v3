import test from "node:test";
import assert from "node:assert/strict";
import { fetchGoogleDoc } from "../src/google/docs-client.js";

test("requests a document with bearer authorization", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, json: async () => ({ documentId: "doc-1" }) };
  };
  const doc = await fetchGoogleDoc("doc-1", "token-1", fetchImpl);
  assert.equal(doc.documentId, "doc-1");
  assert.equal(calls[0].init.headers.Authorization, "Bearer token-1");
  assert.equal(calls[0].url, "https://docs.googleapis.com/v1/documents/doc-1");
});

for (const [status, code] of [[401, "authorization-required"], [403, "document-not-authorized"], [404, "document-not-found"], [429, "quota-exceeded"]]) {
  test(`maps HTTP ${status} to ${code}`, async () => {
    const fetchImpl = async () => ({ ok: false, status });
    await assert.rejects(fetchGoogleDoc("doc-1", "token-1", fetchImpl), { code });
  });
}

test("maps network failures without exposing the token", async () => {
  const fetchImpl = async () => { throw new TypeError("offline"); };
  await assert.rejects(fetchGoogleDoc("doc-1", "secret-token", fetchImpl), {
    code: "network-unavailable",
    message: "Google non è raggiungibile."
  });
});
