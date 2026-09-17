---
title: GET /v1/holdings/:ticker/changes
description: Compare a fund's two most recent captured snapshots and see exactly what changed.
---

# `GET /v1/holdings/:ticker/changes`

Compares the two most recent available snapshots for a ticker — this route
**never triggers a live fetch itself**, it purely reads what's already been
captured by earlier `/v1/holdings/:ticker` requests (a snapshot is written
at most once per ticker per calendar day, on a successful live fetch).

## Request

::: code-group

```bash [curl]
curl "https://etf-api-production-c321.up.railway.app/v1/holdings/SPY/changes" \
  -H "X-Api-Key: etf_YOUR_API_KEY_HERE"
```

```js [JavaScript]
const res = await fetch(
  "https://etf-api-production-c321.up.railway.app/v1/holdings/SPY/changes",
  { headers: { "X-Api-Key": "etf_YOUR_API_KEY_HERE" } }
);
const changes = await res.json();
if (changes.comparisonAvailable) {
  console.log(`${changes.topMovers.length} notable moves since ${changes.previousSnapshotDate}`);
}
```

```python [Python]
import requests

res = requests.get(
    "https://etf-api-production-c321.up.railway.app/v1/holdings/SPY/changes",
    headers={"X-Api-Key": "etf_YOUR_API_KEY_HERE"},
)
changes = res.json()
if changes["comparisonAvailable"]:
    print(f"{len(changes['topMovers'])} notable moves since {changes['previousSnapshotDate']}")
```

:::

## Example: an equity fund's day-over-day change (SPY)

```json
{
  "ticker": "SPY",
  "comparisonAvailable": true,
  "previousSnapshotDate": "2026-09-15",
  "currentSnapshotDate": "2026-09-16",
  "source": "State Street Global Advisors (SSGA)",
  "asOfDate": "2026-09-15",
  "fetched_at": "2026-09-16T14:03:11.482Z",
  "freshness_status": "fresh",
  "source_mode": "primary",
  "previousAsOfDate": "2026-09-14",
  "currentAsOfDate": "2026-09-15",
  "positionsAdded": [{ "ticker": "NEWCO", "name": "NEW COMPANY INC", "type": "EQUITY", "weightPct": 0.12, "sharesHeld": 5000 }],
  "positionsRemoved": [{ "ticker": "OLDCO", "name": "OLD COMPANY INC", "type": "EQUITY", "weightPct": 0.09, "sharesHeld": 3000 }],
  "weightChanges": [{ "ticker": "NVDA", "name": "NVIDIA CORP", "type": "EQUITY", "previousWeightPct": 8.08, "currentWeightPct": 8.31, "deltaWeightPct": 0.23 }],
  "shareChanges": [{ "ticker": "AAPL", "name": "APPLE INC", "type": "EQUITY", "previousSharesHeld": 178979155, "currentSharesHeld": 179100000, "deltaSharesHeld": 120845 }],
  "derivativePositionChanges": { "added": [], "removed": [], "weightChanges": [], "shareChanges": [] },
  "cashCollateralChanges": { "added": [], "removed": [], "weightChanges": [], "shareChanges": [] },
  "topMovers": [{ "ticker": "NVDA", "name": "NVIDIA CORP", "type": "EQUITY", "changeType": "weight_change", "deltaWeightPct": 0.23 }]
}
```

For a leveraged or covered-call fund, the same shape applies, but
`derivativePositionChanges` (for `SWAP`/`FUTURE`/`OPTION` positions) is
where the meaningful movement usually shows up instead of
`weightChanges` — a leveraged fund's swap notional swinging several points
in a day is a bigger real move than almost any single-stock reweight, and
is called out in its own bucket for exactly that reason.

## Field reference

| Field | Meaning |
|---|---|
| `positionsAdded` / `positionsRemoved` | Holdings present in only one of the two snapshots. |
| `weightChanges` / `shareChanges` | Holdings present in both, where `weightPct` or `sharesHeld` differs, with the specific delta. |
| `derivativePositionChanges` | The same four categories, pre-filtered to `SWAP`/`FUTURE`/`OPTION` positions. |
| `cashCollateralChanges` | The same four categories, pre-filtered to `CASH` positions. |
| `topMovers` | Every change ranked by absolute weight delta, capped at 10. |
| `previousAsOfDate` / `currentAsOfDate` | Each snapshot's own issuer-reported `asOfDate` — distinct from `previousSnapshotDate`/`currentSnapshotDate`, which is when *this API* captured it. |
| `source` / `asOfDate` / `fetched_at` / `freshness_status` / `source_mode` | The same provenance fields every endpoint carries, describing the *current* side of the comparison. `source_mode` is always `"primary"` here, since a snapshot is only ever recorded on a successful live fetch. |

Holdings are matched across snapshots by `ticker` where one exists,
falling back to `name` for holdings that don't carry one (several issuers'
swap/cash lines have a `null` ticker).

## Not enough history yet

A ticker's first-ever check (or a ticker with no snapshots at all) returns
`200` with `comparisonAvailable: false` and a `reason` — an expected,
common state for a newly-added ticker, not an error:

```json
{
  "ticker": "NEWTICK",
  "comparisonAvailable": false,
  "reason": "Only one snapshot exists for NEWTICK (2026-09-16); at least two are needed to compare.",
  "availableSnapshotDates": ["2026-09-16"]
}
```

Only a comparison of the two most recent snapshots is supported today —
there's no `?from=`/`?to=` date-range parameter yet.
