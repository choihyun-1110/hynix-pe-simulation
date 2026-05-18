# Public Deployment Guide

Upkinsey serves the static prototype and API from the same Python process. Never put `UPSTAGE_API_KEY` in browser code; keep it as a server-side environment variable only.

## Production safety defaults

A public Upkinsey deployment can spend real Upstage quota. For any internet-facing deployment, enable authentication and keep destructive APIs disabled unless you are operating a private/admin instance.

Recommended public settings:

```text
UPKINSEY_REQUIRE_BASIC_AUTH=1
UPKINSEY_BASIC_AUTH_USER=<operator username>
UPKINSEY_BASIC_AUTH_PASSWORD=<strong password>
UPKINSEY_ALLOW_DESTRUCTIVE_API=0
UPKINSEY_MAX_ACTIVE_JOBS=2
UPKINSEY_RATE_LIMIT_PER_MINUTE=30
UPKINSEY_MAX_PARALLEL_REQUESTS=2
UPKINSEY_MAX_DOCUMENT_BYTES=8000000
```

If `UPKINSEY_REQUIRE_BASIC_AUTH=1` but the username/password are missing, the API returns `auth_not_configured` instead of silently opening paid endpoints.

## Required environment variables

```text
UPSTAGE_API_KEY=<real key>
UPSTAGE_MODEL=solar-pro3
UPSTAGE_BASE_URL=https://api.upstage.ai/v1/solar/chat/completions
UPKINSEY_HOST=0.0.0.0
PORT=<platform assigned port>
```

## Recommended operational variables

```text
UPKINSEY_REQUIRE_BASIC_AUTH=1
UPKINSEY_BASIC_AUTH_USER=<operator username>
UPKINSEY_BASIC_AUTH_PASSWORD=<strong password>
UPKINSEY_ALLOW_DESTRUCTIVE_API=0
UPKINSEY_MAX_ACTIVE_JOBS=2
UPKINSEY_RATE_LIMIT_PER_MINUTE=30
UPKINSEY_MAX_PARALLEL_REQUESTS=2
UPKINSEY_MAX_BODY_BYTES=1000000
UPKINSEY_MAX_DOCUMENT_BYTES=8000000
UPKINSEY_JOB_TTL_SECONDS=3600
UPSTAGE_MAX_RETRIES=8
UPSTAGE_RETRY_BACKOFF_SECONDS=1.5
UPSTAGE_MAX_RETRY_DELAY_SECONDS=60
UPSTAGE_MIN_REQUEST_INTERVAL_SECONDS=1.1
```

## Optional Document Parse tuning

```text
UPSTAGE_DOCUMENT_PARSE_URL=https://api.upstage.ai/v1/document-ai/document-parse
UPSTAGE_DOCUMENT_PARSE_MODEL=document-parse
UPSTAGE_DOCUMENT_PARSE_OUTPUT_FORMATS=text,html
UPSTAGE_DOCUMENT_PARSE_FILE_FIELD=document
UPSTAGE_DOCUMENT_PARSE_TIMEOUT=120
```

## Render deployment

1. Push this branch to GitHub.
2. In Render, choose `New > Blueprint` or `New > Web Service`.
3. Use Docker environment.
4. Set secrets/env vars:
   - `UPSTAGE_API_KEY`
   - `UPKINSEY_BASIC_AUTH_USER`
   - `UPKINSEY_BASIC_AUTH_PASSWORD`
5. Deploy and open the Render HTTPS URL.

`render.yaml` includes safe public defaults and marks secrets as manual/sync-disabled.

## Railway/Fly.io/other Docker platforms

Build and run the Dockerfile, passing the required and recommended environment variables above.

```bash
docker build -t upkinsey .
docker run --rm -p 5173:5173 \
  -e UPSTAGE_API_KEY="$UPSTAGE_API_KEY" \
  -e UPKINSEY_REQUIRE_BASIC_AUTH=1 \
  -e UPKINSEY_BASIC_AUTH_USER="$UPKINSEY_BASIC_AUTH_USER" \
  -e UPKINSEY_BASIC_AUTH_PASSWORD="$UPKINSEY_BASIC_AUTH_PASSWORD" \
  upkinsey
```

Local URL:

```text
http://localhost:5173
```

## Persistence warning

By default, saved runs and persona cache are local files under:

```text
data/simulation_runs/
data/personas/
```

On Render/Railway-style ephemeral filesystems, these files can disappear on restart/redeploy. For durable production use, attach a persistent disk, mount `data/`, or replace the local JSON run store with an external database/object store.

## Destructive API policy

`DELETE /api/runs` and `DELETE /api/runs/{id}` are disabled unless:

```text
UPKINSEY_ALLOW_DESTRUCTIVE_API=1
```

Keep this off for public demos. Use it only in a private/admin deployment.
