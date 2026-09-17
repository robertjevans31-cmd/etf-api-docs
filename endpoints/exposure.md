---
title: GET /v1/exposure/:symbol
description: Reverse lookup — which currently registered funds have exposure to a given symbol, and how.
---

# `GET /v1/exposure/:symbol`

Answers the reverse question: **"which currently registered funds have
exposure to this symbol, and what kind of exposure is it?"** — scanning
every fund's already-normalized holdings, `strategy`, and `optionDetail`
rather than re-parsing any issuer page separately. Lookup is by ticker
only in this version.

## Request

::: code-group

```bash [curl]
curl "https://etf-api-production-c321.up.railway.app/v1/exposure/NVDA" \
  -H "X-Api-Key: etf_YOUR_API_KEY_HERE"
```

```js [JavaScript]
const res = await fetch(
  "https://etf-api-production-c321.up.railway.app/v1/exposure/NVDA",
  { headers: { "X-Api-Key": "etf_YOUR_API_KEY_HERE" } }
);
const { results } = await res.json();
for (const r of results) {
  console.log(r.fundTicker, r.relationship);
}
```

```python [Python]
import requests

res = requests.get(
    "https://etf-api-production-c321.up.railway.app/v1/exposure/NVDA",
    headers={"X-Api-Key": "etf_YOUR_API_KEY_HERE"},
)
for r in res.json()["results"]:
    print(r["fundTicker"], r["relationship"])
```

:::

## Example: direct holding, leveraged target, and written option, in one response

Querying `NVDA` surfaces an ordinary equity fund holding it directly, a
leveraged fund whose entire stated objective *is* NVDA, and (querying its
option root separately, see below) a fund that's written options against
it — three fundamentally different kinds of exposure, **never blended into
one number or implied to be equivalent**:

```json
{
  "symbol": "NVDA",
  "scannedFunds": 37,
  "totalFunds": 37,
  "results": [
    {
      "fundTicker": "NVDX",
      "relationship": "leveraged_target",
      "direction": "long",
      "targetExposureMultiple": 2,
      "confidence": "high",
      "source": "REX Shares",
      "asOfDate": "2026-09-16",
      "fetched_at": "2026-09-16T14:03:11.482Z",
      "freshness_status": "fresh",
      "source_mode": "primary"
    },
    {
      "fundTicker": "SPY",
      "relationship": "direct_holding",
      "weight": 7.42,
      "confidence": "high",
      "source": "State Street Global Advisors (SSGA)",
      "asOfDate": "2026-09-16",
      "fetched_at": "2026-09-16T14:03:08.117Z",
      "freshness_status": "fresh",
      "source_mode": "primary"
    }
  ]
}
```

## Relationship types

| `relationship` | Meaning | Fields |
|---|---|---|
| `direct_holding` | The fund directly owns the symbol as a plain `EQUITY` position. | `weight` (the real disclosed `weightPct`), always `confidence: "high"`. |
| `leveraged_target` | The symbol **is** what a leveraged/inverse fund's own stated objective targets — the fund typically achieves this via swaps/futures/replication, not by holding the symbol's shares directly. | `direction`, `targetExposureMultiple`, inherits `strategy`'s own `confidence`. |
| `option_underlying` | The fund holds an `OPTION` contract disclosed against the symbol — a derivative position, not ownership. | `putCall`, `side`, inherits that position's own `optionDetail.confidence`. |

A single fund can legitimately appear more than once in the same query if
it has more than one kind of exposure to the symbol (e.g. a direct holding
*and* a separately written option).

Every result also carries the same `source`/`asOfDate`/`fetched_at`/
`freshness_status`/`source_mode` provenance fields every other endpoint
has, for the specific fund that relationship came from — see
[How freshness works](/freshness).

## Example: an option-income fund's written call (querying by option root)

`QYLD` writes calls against the Nasdaq-100 index, disclosed under the root
symbol `NDX` — querying that root surfaces it as `option_underlying`:

```json
{
  "symbol": "NDX",
  "results": [
    { "fundTicker": "QYLD", "relationship": "option_underlying", "putCall": "call", "side": "short", "confidence": "high", "source": "Global X", "asOfDate": "2026-09-16", "freshness_status": "fresh", "source_mode": "primary" }
  ]
}
```

## Honest limitation: ticker-only lookup

Lookup is **by ticker only** in this version. A real, verified underlying
with no disclosed ticker symbol genuinely can't be found yet: `TQQQ`'s
objective names its target as "the Nasdaq-100 Index" and `UPRO`'s as "the
S&P 500" — real, correctly classified `index`-type underlyings — but
neither fund's objective text discloses a ticker/symbol for it, so
`GET /v1/exposure/NDX` won't surface `TQQQ` today (it does surface `QYLD`,
above, since `QYLD`'s written option is disclosed against the literal root
symbol `NDX`, which genuinely is real ticker-shaped data straight from the
source text). Looking up by an underlying's full name can come later.

A symbol with no exposure anywhere in current coverage returns `200` with
an empty `results` array, not an error. A fund whose own scan fails is
skipped and reported in an `errors[]` array (each entry carrying a `code`
— see the [Error reference](/errors)) rather than failing the whole
request.
