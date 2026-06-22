# Canva Connector Contract

> ⚠️ **STATUS — CONTRACT / DESIGN SPEC ONLY (sandbox / future-only).**
> This contract describes a *future* Canva module that is **NOT implemented and
> NOT live**. The current phase ships only the offline **Canva Sandbox Preview**
> (`src/lib/core/connectors/canvaSandboxConnector.ts`): **no real Canva API/SDK/
> OAuth/token/env, no real `design_id`/`design_url`, no export, no Canva design
> created, nothing published, real connector action = none.** The
> `design_id` / `design_url` / `export_urls` fields below are a future target;
> the sandbox emits clearly-fake `MOCK-CANVA-*` / `sandbox-canva-*` references
> instead, never a real Canva id or URL. Build a real connector only via
> `CLAUDE_MARKETING_TEAM/07_runbooks/connector_activation_safety_runbook.md`.

This document specifies the *future* integration contract, inputs, outputs, and safety policies for the Canva Connector Module.

## 1. Input Specification
Conforms to `n8n_to_module_request.schema.json`.

Key payload fields:
- `template_id`: String. Identifier of the base Canva template.
- `brand_assets`: Array of image URLs (e.g. logos, product shots) to inject.
- `text_mappings`: Object containing key-value pairs of text replacements.

## 2. Output Specification
Conforms to `module_to_core_callback.schema.json`.

Key payload fields:
- `design_id`: String. Canva design ID.
- `design_url`: String. Link to edit or view the design.
- `export_urls`: Array of image/PDF URLs generated from the design.

## 3. Safety Rules
- **Environment variables only**: Never store raw token in files.
- **Approval Check**: If `safety.requires_approval` is `true`, ensure that `safety.final_approval_granted` is `true` before initiating generation.
- **Allowed actions (future real V1, after Owner-gated activation)**: Create
  drafts in brand folder, export drafts (only after the related Core item is
  `approved` AND `ALLOW_CANVA_EXPORT_AFTER_APPROVAL=true`), return links.
  *None of these are available in the current sandbox phase.*
- **Forbidden actions**: Delete templates, public share / auto-publish, modify
  production brand assets, treat a Canva export as approval.
- **Current sandbox phase**: NONE of the above run — sandbox is preview/spec only
  (no real Canva call, no design created, nothing published).
