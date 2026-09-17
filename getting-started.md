---
title: Getting Started
description: How to get an API key and make your first request to the ETF Holdings API.
---

# Getting started

## Base URL

All examples on this site use the live base URL:

```
https://etf-api-production-c321.up.railway.app
```

Every real endpoint lives under **`/v1`** — for example
`/v1/holdings/SPY`. Unversioned paths (`/holdings/SPY`, no `/v1`) still work
today as a **deprecated compatibility alias** — the exact same route
handlers serve both — but new integrations should only ever call `/v1/`
paths. See [API versioning policy](/reference/versioning) for what that
guarantee actually covers.

## 1. Get an API key

Every request (except the root `/` info endpoint) requires an
`X-Api-Key` header. There is currently no self-serve signup flow — request
a key from the API operator, who will hand you a value shaped like:

```
etf_YOUR_API_KEY_HERE
```

::: warning Never share a real key
The key above is a placeholder. Never commit a real API key to source
control or paste it into a public issue, chat, or docs page — treat it like
any other credential.
:::

Keys carry a **tier** (`free`, `individual`, `business`, `enterprise`) that
determines your rate limit — see [Rate limits & tiers](/rate-limits).

## 2. Make your first request

::: code-group

```bash [curl]
curl "https://etf-api-production-c321.up.railway.app/v1/holdings/SPY" \
  -H "X-Api-Key: etf_YOUR_API_KEY_HERE"
```

```js [JavaScript]
const res = await fetch(
  "https://etf-api-production-c321.up.railway.app/v1/holdings/SPY",
  { headers: { "X-Api-Key": "etf_YOUR_API_KEY_HERE" } }
);
const data = await res.json();
console.log(data.fundName, data.holdingsCount, data.freshness_status);
```

```python [Python]
import requests

res = requests.get(
    "https://etf-api-production-c321.up.railway.app/v1/holdings/SPY",
    headers={"X-Api-Key": "etf_YOUR_API_KEY_HERE"},
)
data = res.json()
print(data["fundName"], data["holdingsCount"], data["freshness_status"])
```

:::

A successful response looks like this (trimmed to the top holding):

```json
{
  "ticker": "SPY",
  "fundName": "SPDR S&P 500 ETF Trust",
  "asOfDate": "2026-09-10",
  "source": "State Street Global Advisors (SSGA)",
  "sourceUrl": "https://www.ssga.com/.../holdings-daily-us-en-spy.xlsx",
  "holdingsCount": 505,
  "holdings": [
    { "ticker": "NVDA", "name": "NVIDIA CORP", "type": "EQUITY", "weightPct": 8.08, "sharesHeld": 297296135 }
  ],
  "fetched_at": "2026-09-15T14:03:11.482Z",
  "age_minutes": 2.3,
  "freshness_status": "fresh",
  "source_mode": "primary",
  "normalization_confidence": "high",
  "strategy": null,
  "targetExposure": null
}
```

Every field beyond the raw `holdings` array is explained in the
[Response field reference](/fields) — the ones worth understanding first
are `freshness_status` and `source_mode`, covered in
[How freshness works](/freshness).

## 3. Authentication errors

| Situation | Response |
|---|---|
| Header missing | `401` — `{ "error": "Missing X-API-Key header", "code": "MISSING_API_KEY" }` |
| Header present but not a known key | `401` — `{ "error": "Invalid API key", "code": "INVALID_API_KEY" }` |
| Key valid but over its rate limit | `429` — see [Rate limits & tiers](/rate-limits) |

::: tip Header name casing
HTTP header names are case-insensitive, so `X-Api-Key`, `X-API-Key`, and
`x-api-key` are all the same header. This site writes it `X-Api-Key` in
prose and `X-API-Key` where it matches the API's own error messages
verbatim.
:::

## Where to next

- [Endpoint reference](/endpoints/) — every `/v1/` route, with curl/JS/Python
  examples across an equity fund, a leveraged fund, and a covered-call fund.
- [How freshness works](/freshness) — the concept that makes this API
  trustworthy to build on.
- [Known limitations](/limitations) — the honest boundaries, stated plainly.
