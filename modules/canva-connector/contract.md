# Canva Connector Contract

This document specifies the integration contract, inputs, outputs, and safety policies for the Canva Connector Module.

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
- **Allowed actions in V1**: Create drafts in brand folder, export drafts, return links.
- **Forbidden actions in V1**: Delete templates, public share, modify production brand assets.
