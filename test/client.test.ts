/**
 * UT-SDK-01..08 — ../src/index SDK
 * The SDK is a thin, typed wrapper over the REST API. These tests pin the
 * HTTP contract (method, path, auth header, body shape) and error behavior.
 */
import { describe, it, expect, vi } from "vitest";
import { YoursTruly, YoursTrulyError } from "../src/index";

type AnyFetch = ReturnType<typeof vi.fn>;

function mockFetch(status: number, body: unknown): AnyFetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  });
}

function client(fetchImpl: AnyFetch) {
  return new YoursTruly({ apiKey: "yt_test_key", baseUrl: "https://api.test", fetch: fetchImpl as unknown as typeof fetch });
}

describe("YoursTruly SDK", () => {
  it("UT-SDK-01: emails.send POSTs /v1/emails with auth + normalized recipient", async () => {
    const f = mockFetch(200, { id: "email_1", status: "sent" });
    const res = await client(f).emails.send({ from: "a@x.com", to: "b@y.com", subject: "Hi", html: "<b>hi</b>" });
    expect(res).toEqual({ id: "email_1", status: "sent" });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://api.test/v1/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer yt_test_key");
    const body = JSON.parse(init.body);
    expect(body.to).toEqual(["b@y.com"]);
    expect(body.subject).toBe("Hi");
  });

  it("UT-SDK-02: emails.send preserves an array of recipients", async () => {
    const f = mockFetch(200, { id: "e", status: "sent" });
    await client(f).emails.send({ from: "a@x.com", to: ["b@y.com", "c@z.com"], subject: "s", text: "t" });
    expect(JSON.parse(f.mock.calls[0][1].body).to).toEqual(["b@y.com", "c@z.com"]);
  });

  it("UT-SDK-03: emails.get GETs the email by id", async () => {
    const f = mockFetch(200, { id: "email_9" });
    await client(f).emails.get("email_9");
    expect(f.mock.calls[0][0]).toBe("https://api.test/v1/emails/email_9");
    expect(f.mock.calls[0][1].method).toBe("GET");
  });

  it("UT-SDK-04: domains.verify POSTs the verify path", async () => {
    const f = mockFetch(200, { id: "d", status: "verified" });
    await client(f).domains.verify("dom_1");
    expect(f.mock.calls[0][0]).toBe("https://api.test/v1/domains/dom_1/verify");
    expect(f.mock.calls[0][1].method).toBe("POST");
  });

  it("UT-SDK-05: apiKeys.create sends name + scope", async () => {
    const f = mockFetch(201, { id: "k", secret: "yt_live_x" });
    await client(f).apiKeys.create("CI", "sending");
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ name: "CI", scope: "sending" });
  });

  it("UT-SDK-06: throws YoursTrulyError on non-2xx with code + status", async () => {
    const f = mockFetch(422, { error: "validation_error", message: "Either html or text is required" });
    await expect(client(f).emails.send({ from: "a@x.com", to: "b@y.com", subject: "s" }))
      .rejects.toMatchObject({ name: "YoursTrulyError", status: 422, code: "validation_error" });
  });

  it("UT-SDK-07: accepts a bare api-key string and requires a key", () => {
    expect(() => new YoursTruly("yt_k")).not.toThrow();
    expect(() => new YoursTruly({ apiKey: "" })).toThrow(YoursTrulyError);
  });

  it("UT-SDK-08: analytics.overview builds a date-range query", async () => {
    const f = mockFetch(200, { sent: 1 });
    await client(f).analytics.overview("2026-06-01", "2026-06-15");
    expect(f.mock.calls[0][0]).toBe("https://api.test/v1/analytics/overview?from=2026-06-01&to=2026-06-15");
  });
});
