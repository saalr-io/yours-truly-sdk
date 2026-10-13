# @saalr-io/yours-truly

Official Node.js SDK for the [Yours Truly](https://yourstrulymail.com) email API.
A thin, typed wrapper over the REST API — methods resolve to the parsed response
and throw `YoursTrulyError` on a non-2xx status.

## Install

```bash
npm install @saalr-io/yours-truly
```

## Quickstart

Save this as `send.ts`:

```ts
import { YoursTruly } from "@saalr-io/yours-truly";

const yt = new YoursTruly(process.env.YT_API_KEY);

async function main() {
  const { id, status } = await yt.emails.send({
    from: "hello@yourdomain.com", // must be on a domain you've verified
    to: ["you@example.com"],
    subject: "Email that lands",
    html: "<strong>Yours, truly.</strong>",
  });
  console.log("Sent", id, status); // → Sent email_… sent
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Run it (any Node 18+ project, CommonJS or ESM):

```bash
# macOS / Linux
YT_API_KEY=yt_live_… npx tsx send.ts

# Windows PowerShell
$env:YT_API_KEY = "yt_live_…"; npx tsx send.ts
```

The `from` address must be on a domain you've verified in Yours Truly, or the
API rejects it with `domain_not_verified`.

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
import { YoursTruly, YoursTrulyError } from "@saalr-io/yours-truly";

try {
  await yt.emails.send({ /* … */ });
} catch (err) {
  if (err instanceof YoursTrulyError) {
    console.error(err.status, err.code, err.message);
  }
}
```

Requires Node 18+ (global `fetch`), or pass a `fetch` implementation in options.
