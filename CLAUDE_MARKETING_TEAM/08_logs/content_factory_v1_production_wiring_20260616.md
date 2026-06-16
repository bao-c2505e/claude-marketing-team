# Content Factory V1 Production n8n Wiring PASS - 2026-06-16

## Status

PASS. Content Factory V1 production wiring has been verified from production Core to n8n Production Webhook and back to Core.

## Production Wiring

- Domain verified live: `https://coreagency.digital` and `https://www.coreagency.digital`.
- n8n workflow name: `Content Factory V1 - Content Pack`.
- Vercel env name: `VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL`.
- The real webhook URL must remain only in Vercel/n8n configuration and must not be documented or committed.

## Verification Record

- Local fallback works when `VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL` is missing.
- Local Core -> n8n Test URL passed.
- Production Core -> n8n Production URL passed.
- n8n production executions succeeded.
- Core creates pending approval items after the n8n response.
- Generated items remain approval-first: contract `pending_approval` maps to Core `needs_review`.
- Approving content in Core does not publish, schedule, or launch content.

## Safety Guarantees

- No auto-post.
- No auto-ads.
- No live social connector.
- No live Meta/TikTok/Zalo/Canva connector activation.
- No API keys in frontend code or frontend env.
- No workflow URL, token, API key, or credential committed.
- AI provider credentials should be configured only inside n8n Credentials in a later Owner-approved phase.
- Publishing and ads remain blocked for later Owner-approved phases.

## Scope

Docs/runbook/log only. No product code, workflow JSON, connector activation, secret, or frontend env value was changed.
