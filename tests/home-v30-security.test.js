import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function parseCsp(html) {
  const match = html.match(/<meta\s+http-equiv=(["'])Content-Security-Policy\1\s+content=(["'])(.*?)\2/i);
  assert.ok(match, "index.html must define a Content-Security-Policy meta tag");
  const directives = new Map();
  for (const raw of match[3].split(";")) {
    const tokens = raw.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    directives.set(tokens[0], tokens.slice(1));
  }
  return directives;
}

function assertNoExternalSources(tokens, directive) {
  for (const token of tokens) {
    assert.notEqual(token, "*", `${directive} must not allow wildcard origins`);
    assert.notEqual(token, "http:", `${directive} must not allow generic http origins`);
    assert.notEqual(token, "https:", `${directive} must not allow generic https origins`);
    assert.ok(!/^https?:\/\//i.test(token), `${directive} must not allow third-party origins: ${token}`);
  }
}

test("V30 CSP permits only the local blob/data mechanisms needed by glTF", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const directives = parseCsp(html);
  assert.deepEqual(directives.get("connect-src"), ["'self'", "blob:"]);
  assert.deepEqual(directives.get("img-src"), ["'self'", "data:", "blob:"]);
  assertNoExternalSources(directives.get("connect-src") ?? [], "connect-src");
  assertNoExternalSources(directives.get("img-src") ?? [], "img-src");
});

test("V30 CSP keeps script, object, base and form restrictions local", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const directives = parseCsp(html);
  assert.deepEqual(directives.get("script-src"), ["'self'"]);
  assert.deepEqual(directives.get("object-src"), ["'none'"]);
  assert.deepEqual(directives.get("base-uri"), ["'self'"]);
  assert.deepEqual(directives.get("form-action"), ["'self'"]);
});
