---
title: GET /v1/holdings/:ticker
description: Fetch a single fund's current holdings, with freshness, strategy, and option normalization.
---

# `GET /v1/holdings/:ticker`

Returns one fund's current holdings, normalized to a consistent schema
regardless of which issuer or instrument type is behind it. Results are
cached in memory per ticker for 5 minutes to avoid hammering issuer sites
on repeat requests.

## Request

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
const holdings = await res.json();
```

```python [Python]
import requests

res = requests.get(
    "https://etf-api-production-c321.up.railway.app/v1/holdings/SPY",
    headers={"X-Api-Key": "etf_YOUR_API_KEY_HERE"},
)
holdings = res.json()
```

:::

## Example: a plain equity ETF (SPY)

Every holding is a simple `EQUITY` position; `strategy` and
`targetExposure` are `null` — present as keys, not absent, so you can rely
on `"strategy" in response` rather than needing to distinguish "not
leveraged" from "we don't know."

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

## Example: a leveraged/inverse fund (RAMZ)

`strategy` and `targetExposure` are populated from the issuer's own
*stated investment objective* — not inferred from current holdings, which
can be misleading for a swap-based fund (see
[Known limitations](/limitations)). `RAMZ` is REX Shares' 2x **inverse**
daily target fund on DRAM (the Roundhill Memory ETF):

```json
{
  "ticker": "RAMZ",
  "fundName": "T-REX 2X Inverse DRAM Daily Target ETF",
  "asOfDate": "2026-09-16",
  "source": "REX Shares",
  "holdingsCount": 4,
  "holdings": [
    { "ticker": null, "name": "SWAP LEG A", "type": "SWAP", "weightPct": -112.4, "sharesHeld": null }
  ],
  "freshness_status": "fresh",
  "source_mode": "primary",
  "normalization_confidence": "medium",
  "warnings": [
    "holding[0] (SWAP LEG A) is type SWAP — a derivative/synthetic position normalized outside equity's usual weight/share conventions"
  ],
  "strategy": {
    "direction": "inverse",
    "leverageMultiple": 2,
    "underlying": { "name": "Roundhill Memory ETF", "type": "etf", "ticker": "DRAM" },
    "resetFrequency": "daily",
    "source": "issuer_objective",
    "confidence": "high"
  },
  "targetExposure": {
    "underlying": { "name": "Roundhill Memory ETF", "type": "etf", "ticker": "DRAM" },
    "direction": "inverse",
    "leverageMultiple": 2,
    "targetExposureMultiple": -2,
    "resetFrequency": "daily",
    "source": "issuer_objective",
    "confidence": "high"
  },
  "observedExposure": null,
  "observedExposureStatus": "not_calculable_from_disclosed_holdings",
  "reason": "issuer_discloses_swap_net_value_but_not_swap_notional"
}
```

`targetExposureMultiple: -2` restates the issuer's stated objective as one
signed number. Notice what's deliberately **not** claimed:
`observedExposure` is `null` — see
[Known limitations](/limitations#ram-ramz-observed-exposure-isn-t-calculable)
for exactly why, backed by the source prospectus language.

## Example: a covered-call / option-income fund (QYLD)

Holdings can include `OPTION`-type positions, each carrying a structured
`optionDetail` parsed from the position's own disclosed name — never
inferred from which fund holds it. `QYLD` writes calls against the
Nasdaq-100, not against "QQQ" just because that happens to be a similar
ticker:

```json
{
  "ticker": "QYLD",
  "fundName": "Global X Nasdaq 100 Covered Call ETF",
  "holdings": [
    {
      "ticker": null,
      "name": "NDX US 09/18/26 C29275",
      "type": "OPTION",
      "weightPct": -0.28,
      "sharesHeld": -2855,
      "optionDetail": {
        "underlying": { "name": "Nasdaq-100 Index", "type": "index", "ticker": "NDX" },
        "putCall": "call",
        "side": "short",
        "strike": 29275,
        "expiration": "2026-09-18",
        "rawContract": "NDX US 09/18/26 C29275",
        "source": "position_name",
        "confidence": "high"
      }
    }
  ],
  "freshness_status": "fresh",
  "source_mode": "primary",
  "strategy": null,
  "targetExposure": null
}
```

`side: "short"` here is the actual strategy — collecting premium — not an
incidental detail; it's read directly off the position's disclosed
quantity sign, the same signal every issuer adapter in this API already
reports.

## See also

- [How freshness works](/freshness) — `asOfDate`, `fetched_at`,
  `freshness_status`, `source_mode` explained together.
- [Response field reference](/fields) — every field, on every endpoint.
- [Error reference](/errors) — what a failed fetch looks like.
