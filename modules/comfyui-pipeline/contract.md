# ComfyUI Pipeline Contract

This document specifies the integration contract, inputs, outputs, and safety policies for the ComfyUI Pipeline Module.

## 1. Input Specification
The input must match `n8n_to_module_request.schema.json`.

Key payload fields:
- `prompt`: String. Text description of the image to generate.
- `negative_prompt`: String. Things to avoid.
- `workflow`: String. Identifies the specific ComfyUI workspace JSON workflow to run.
- `steps`: Integer. Denoising steps.

Safety structure:
- `safety.final_approval_granted`: Must be `true` for production generation.

## 2. Output Specification
The callback output must match `module_to_core_callback.schema.json`.

Key payload fields:
- `asset_url`: String. URL to the generated image/video placeholder.
- `generation_params`: Object containing `seed`, `sampler_name`, `steps`, `cfg`.
- `status`: String (`SUCCESS` or `FAILED`).

## 3. Safety Rules
- **No Approval, No Action**: If `safety.final_approval_granted != true`, the pipeline MUST instantly reject the execution and respond with status `REJECTED_BY_SAFETY`.
- **Stateless Operation**: Serve Core. Do not save permanent business records; clean up temp local images after uploading.
- **Environment Variables**:
  - `COMFYUI_API_URL`: HTTP address of the ComfyUI server api (e.g. `http://localhost:8188`).
  - `STORAGE_PROVIDER`: Place where to store assets (e.g. `local`, `s3`, `supabase`).
