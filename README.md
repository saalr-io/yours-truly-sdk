# @yours-truly/node

Official Node.js SDK for the [Yours Truly](https://yourstrulymail.com) email API.
A thin, typed wrapper over the REST API — methods resolve to the parsed response
and throw `YoursTrulyError` on a non-2xx status.

## Install

```bash
npm install @yours-truly/node
```

## Quickstart

```ts
import { YoursTruly } from "@yours-truly/node";

const yt = new YoursTruly(process.env.YT_API_KEY);

const { id, status } = await yt.emails.send({
  from: "hello@yourstrulymail.com",
  to: ["you@example.com"],
  subject: "Email that lands",
  html: "<strong>Yours, truly.</strong>",
});
// → { id: "email_…", status: "sent" }
```

## Configuration

```ts
new YoursTruly("yt_live_…");                       // bare key
new YoursTruly({ apiKey, baseUrl, fetch });        // options
```

Environment fallbacks (when no key/baseUrl is passed):
`YT_API_KEY` / `YOURS_TRULY_API_KEY`, and `YT_API_URL` / `YOURS_TRULY_BASE_URL`.

## Resources

| Namespace | Methods |
|-----------|---------|
| `emails` | `send`, `get`, `list`, `events` |
| `domains` | `create`, `get`, `list`, `verify`, `remove` |
| `apiKeys` | `create(name, scope?)`, `list`, `revoke` |
| `audiences` | `create`, `list`, `get`, `contacts` |
| `broadcasts` | `create`, `list`, `get`, `send` |
| `webhooks` | `create(url, events)`, `list`, `deliveries` |
| `analytics` | `overview(from?, to?)`, `timeseries(from?, to?)` |
| `logs` | `list(date?)` |

## Errors

```ts
import { YoursTruly, YoursTrulyError } from "@yours-truly/node";

try {
  await yt.emails.send({ /* … */ });
} catch (err) {
  if (err instanceof YoursTrulyError) {
    console.error(err.status, err.code, err.message);
  }
}
```

Requires Node 18+ (global `fetch`), or pass a `fetch` implementation in options.
