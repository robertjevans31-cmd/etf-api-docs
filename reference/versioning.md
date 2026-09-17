---
title: API Versioning Policy
description: What counts as a breaking change, and what's safe to ship within /v1.
---

# API versioning policy

Every real endpoint lives under **`/v1`** — `GET /v1/holdings/SPY`, `GET
/v1/holdings`, `GET /v1/holdings/:ticker/changes`, `GET
/v1/exposure/:symbol`. Document and integrate against these paths only.

## The unversioned alias is deprecated

The same routes are also reachable **unversioned** (`GET /holdings/SPY`,
no `/v1`) — the literal same route handlers serve both paths, so there's
no risk of the two drifting apart in behavior. This alias exists purely
because it costs nothing to keep working; it is **not a permanent
commitment**. New integrations should only ever call `/v1/` paths. Once
real external consumers exist, the unversioned alias will be announced
deprecated with a real removal date, not silently dropped.

## What counts as a breaking change (requires a new `/v2`)

- Removing or renaming a response field, or changing what an existing
  field's value means (e.g. `leverageMultiple` becoming signed).
- Changing a field's type/shape (a number becoming a string, an object
  becoming an array).
- Changing the HTTP status code returned for an existing, already-
  documented scenario (e.g. an unsupported ticker moving off `404`).
- Changing or removing an existing error `code` value's meaning (see the
  [Error reference](/errors)), or reusing a retired one for something
  else.
- Removing an endpoint or a URL parameter, or changing a path's shape.
- Narrowing previously-guaranteed behavior (e.g. a field that was always
  present becoming conditionally omitted).

## What does *not* count as breaking (safe to ship within `/v1`)

- Adding a new, optional response field.
- Adding a new endpoint, or a new optional query parameter.
- Adding a new error `code` value to the documented set for a case that
  previously had no specific code.
- Fixing a documented bug to match already-documented intended behavior —
  the documented contract didn't change, the implementation catching up
  to it isn't a version bump.
- Performance/internal-implementation changes with no observable response
  difference.

This is the exact policy the API itself follows internally — it also
lives as a code comment directly above the version constant in the API's
own source, so it's never out of sync with what's actually enforced.
