---
title: GET /v1/holdings (bulk)
description: Fetch up to 25 tickers in one request, mixing equity, leveraged, and option-income funds freely.
---

# `GET /v1/holdings` (bulk)

Fetches multiple tickers in one call, reusing the exact same fetch/cache
path as the single-ticker endpoint. Tickers are comma-separated,
case-insensitive, and deduplicated (a repeated ticker is only fetched and
counted once).

A bulk request always returns `200`, even when some or all tickers fail —
partial failure isn't a whole-request failure, since the point of the
endpoint is to let you fetch what you can in one round trip.

## Request: one equity fund, one leveraged fund, and one option-income fund together

::: code-group

```bash [curl]
curl "https://etf-api-production-c321.up.railway.app/v1/holdings?tickers=SPY,TQQQ,QYLD" \
  -H "X-Api-Key: etf_YOUR_API_KEY_HERE"
```

```js [JavaScript]
const tickers = ["SPY", "TQQQ", "QYLD"];
const res = await fetch(
  `https://etf-api-production-c321.up.railway.app/v1/holdings?tickers=${tickers.join(",")}`,
  { headers: { "X-Api-Key": "etf_YOUR_API_KEY_HERE" } }
);
const body = await res.json();
for (const fund of body.results) {
  console.log(fund.ticker, fund.freshness_status, fund.strategy?.direction ?? "not leveraged");
}
```

```python [Python]
import requests

tickers = ["SPY", "TQQQ", "QYLD"]
res = requests.get(
    "https://etf-api-production-c321.up.railway.app/v1/holdings",
    params={"tickers": ",".join(tickers)},
    headers={"X-Api-Key": "etf_YOUR_API_KEY_HERE"},
)
body = res.json()
for fund in body["results"]:
    strategy = fund.get("strategy") or {}
    print(fund["ticker"], fund["freshness_status"], strategy.get("direction", "not leveraged"))
```

:::

## Response

```json
{
  "requested": 3,
  "succeeded": 3,
  "failed": 0,
  "results": [
    { "ticker": "SPY", "fundName": "SPDR S&P 500 ETF Trust", "freshness_status": "fresh", "source_mode": "primary", "strategy": null, "...": "..." },
    { "ticker": "TQQQ", "fundName": "ProShares UltraPro QQQ", "freshness_status": "fresh", "source_mode": "primary", "strategy": { "direction": "long", "leverageMultiple": 3, "resetFrequency": "daily", "confidence": "high", "underlying": { "name": "Nasdaq-100 Index", "type": "index", "ticker": null }, "source": "issuer_objective" }, "...": "..." },
    { "ticker": "QYLD", "fundName": "Global X Nasdaq 100 Covered Call ETF", "freshness_status": "fresh", "source_mode": "primary", "strategy": null, "...": "..." }
  ],
  "errors": []
}
```

Each entry in `results` carries the exact same fields as the single-ticker
endpoint's full response (`fetched_at`, `age_minutes`, `freshness_status`,
`source_mode`, `source`, `normalization_confidence`, `warnings`,
`strategy`, `targetExposure`, `holdings`, ...) — a bulk call is just N
single-ticker fetches sharing one request, not a separate response shape.
`"..."` above stands in for the same fields shown on the
[single-ticker page](/endpoints/holdings), omitted here for length.

## Partial failure

```json
{
  "requested": 3,
  "succeeded": 2,
  "failed": 1,
  "results": [
    { "ticker": "SPY", "fundName": "SPDR S&P 500 ETF Trust", "freshness_status": "fresh", "...": "..." },
    { "ticker": "QQQ", "fundName": "Invesco QQQ Trust", "freshness_status": "fresh", "...": "..." }
  ],
  "errors": [
    { "ticker": "NOTREAL", "error": "Unsupported ticker \"NOTREAL\"", "code": "UNSUPPORTED_TICKER" }
  ]
}
```

`results` and `errors` are both ordered to match the order tickers were
requested in. Every entry in `errors` carries a `code` — see the
[Error reference](/errors) — and an issuer-fetch failure (as opposed to an
unsupported ticker) also carries a `detail` field with the underlying
error message.

## Limits

- **At most 25 tickers per request.** Exceeding it returns `400` before
  any fetch is attempted:

  ```json
  { "error": "Too many tickers requested (30); a single bulk request allows at most 25", "code": "TOO_MANY_TICKERS", "maxTickers": 25, "requested": 30 }
  ```

- **Counts as exactly one request against your rate limit**, however many
  tickers you request — see [Rate limits & tiers](/rate-limits).
- Upstream fetches within one bulk request are throttled to at most 8
  concurrent, so a large batch fans out gradually rather than firing every
  fetch at once.
