/**
 * @yours-truly/node — official Node.js SDK for the Yours Truly email API.
 *
 *   import { YoursTruly } from "@yours-truly/node";
 *   const yt = new YoursTruly(process.env.YT_API_KEY);
 *   await yt.emails.send({ from, to, subject, html });
 *
 * A thin, typed wrapper over the REST API. Methods resolve to the parsed
 * response body and throw `YoursTrulyError` on a non-2xx status.
 */

const DEFAULT_BASE_URL = "https://api.yourstrulymail.com";
const VERSION = "0.0.0";

export interface YoursTrulyOptions {
  /** Your API key (Bearer token). Falls back to YT_API_KEY / YOURS_TRULY_API_KEY. */
  apiKey?: string;
  /** API base URL. Falls back to YT_API_URL, then the production default. */
  baseUrl?: string;
  /** Custom fetch implementation (defaults to the global `fetch`). */
  fetch?: typeof fetch;
}

export class YoursTrulyError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "YoursTrulyError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type ApiKeyScope = "full" | "sending";

export interface SendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  template_id?: string;
}
export interface SendEmailResult { id: string; status: string; }
export interface CreateBroadcastParams {
  name: string;
  audience_id: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  template_id?: string;
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";
interface Core { request<T>(method: Method, path: string, body?: unknown): Promise<T>; }

function range(from?: string, to?: string): string {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  const s = q.toString();
  return s ? `?${s}` : "";
}

class Emails {
  constructor(private core: Core) {}
  send(params: SendEmailParams): Promise<SendEmailResult> {
    const to = Array.isArray(params.to) ? params.to : [params.to];
    return this.core.request<SendEmailResult>("POST", "/v1/emails", { ...params, to });
  }
  get<T = unknown>(id: string) { return this.core.request<T>("GET", `/v1/emails/${id}`); }
  list<T = unknown>() { return this.core.request<T>("GET", "/v1/emails"); }
  events<T = unknown>(id: string) { return this.core.request<T>("GET", `/v1/emails/${id}/events`); }
}

class Domains {
  constructor(private core: Core) {}
  create<T = unknown>(name: string) { return this.core.request<T>("POST", "/v1/domains", { name }); }
  get<T = unknown>(id: string) { return this.core.request<T>("GET", `/v1/domains/${id}`); }
  list<T = unknown>() { return this.core.request<T>("GET", "/v1/domains"); }
  verify<T = unknown>(id: string) { return this.core.request<T>("POST", `/v1/domains/${id}/verify`); }
  remove<T = unknown>(id: string) { return this.core.request<T>("DELETE", `/v1/domains/${id}`); }
}

class ApiKeys {
  constructor(private core: Core) {}
  create<T = unknown>(name: string, scope: ApiKeyScope = "full") { return this.core.request<T>("POST", "/v1/api-keys", { name, scope }); }
  list<T = unknown>() { return this.core.request<T>("GET", "/v1/api-keys"); }
  revoke<T = unknown>(id: string) { return this.core.request<T>("DELETE", `/v1/api-keys/${id}`); }
}

class Audiences {
  constructor(private core: Core) {}
  create<T = unknown>(name: string) { return this.core.request<T>("POST", "/v1/audiences", { name }); }
  list<T = unknown>() { return this.core.request<T>("GET", "/v1/audiences"); }
  get<T = unknown>(id: string) { return this.core.request<T>("GET", `/v1/audiences/${id}`); }
  contacts<T = unknown>(id: string) { return this.core.request<T>("GET", `/v1/audiences/${id}/contacts`); }
}

class Broadcasts {
  constructor(private core: Core) {}
  create<T = unknown>(params: CreateBroadcastParams) { return this.core.request<T>("POST", "/v1/broadcasts", params); }
  list<T = unknown>() { return this.core.request<T>("GET", "/v1/broadcasts"); }
  get<T = unknown>(id: string) { return this.core.request<T>("GET", `/v1/broadcasts/${id}`); }
  send<T = unknown>(id: string) { return this.core.request<T>("POST", `/v1/broadcasts/${id}/send`); }
}

class Webhooks {
  constructor(private core: Core) {}
  create<T = unknown>(url: string, events: string[]) { return this.core.request<T>("POST", "/v1/webhooks", { url, events }); }
  list<T = unknown>() { return this.core.request<T>("GET", "/v1/webhooks"); }
  deliveries<T = unknown>(id: string) { return this.core.request<T>("GET", `/v1/webhooks/${id}/deliveries`); }
}

class Analytics {
  constructor(private core: Core) {}
  overview<T = unknown>(from?: string, to?: string) { return this.core.request<T>("GET", `/v1/analytics/overview${range(from, to)}`); }
  timeseries<T = unknown>(from?: string, to?: string) { return this.core.request<T>("GET", `/v1/analytics/timeseries${range(from, to)}`); }
}

class Logs {
  constructor(private core: Core) {}
  list<T = unknown>(date?: string) { return this.core.request<T>("GET", `/v1/logs${date ? `?date=${date}` : ""}`); }
}

function env(name: string): string | undefined {
  return typeof process !== "undefined" && process.env ? process.env[name] : undefined;
}

export class YoursTruly {
  readonly emails: Emails;
  readonly domains: Domains;
  readonly apiKeys: ApiKeys;
  readonly audiences: Audiences;
  readonly broadcasts: Broadcasts;
  readonly webhooks: Webhooks;
  readonly analytics: Analytics;
  readonly logs: Logs;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(keyOrOptions?: string | YoursTrulyOptions) {
    const opts: YoursTrulyOptions = typeof keyOrOptions === "string" ? { apiKey: keyOrOptions } : (keyOrOptions ?? {});
    this.apiKey = opts.apiKey ?? env("YOURS_TRULY_API_KEY") ?? env("YT_API_KEY") ?? "";
    this.baseUrl = (opts.baseUrl ?? env("YOURS_TRULY_BASE_URL") ?? env("YT_API_URL") ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
    if (!this.apiKey) {
      throw new YoursTrulyError(0, "missing_api_key", "A Yours Truly API key is required. Pass it to `new YoursTruly(apiKey)` or set YT_API_KEY.");
    }
    if (typeof this.fetchImpl !== "function") {
      throw new YoursTrulyError(0, "no_fetch", "No fetch implementation available. Use Node 18+ or pass `fetch` in options.");
    }
    const core: Core = { request: this.request.bind(this) };
    this.emails = new Emails(core);
    this.domains = new Domains(core);
    this.apiKeys = new ApiKeys(core);
    this.audiences = new Audiences(core);
    this.broadcasts = new Broadcasts(core);
    this.webhooks = new Webhooks(core);
    this.analytics = new Analytics(core);
    this.logs = new Logs(core);
  }

  private async request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": `yours-truly-node/${VERSION}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data: unknown = {};
    if (text) {
      try { data = JSON.parse(text); } catch { data = { message: text }; }
    }
    if (!res.ok) {
      const e = (data && typeof data === "object" ? data : {}) as { error?: string; message?: string; details?: unknown };
      throw new YoursTrulyError(res.status, e.error ?? "request_failed", e.message ?? `Request failed with status ${res.status}`, e.details);
    }
    return data as T;
  }
}

export default YoursTruly;
