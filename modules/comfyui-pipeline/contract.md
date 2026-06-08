# ComfyUI Pipeline Contract

This document specifies the integration contract, inputs, outputs, and safety policies for the ComfyUI Pipeline Module.

## 1. API Endpoints
- **GET /health**: Returns the running status of the stub.
- **POST /run**: Processes request body (conforming to `n8n_to_module_request.schema.json`).
- **POST /simulate-callback**: Simulates async webhook responses.

## 2. Input Specification
The input must match `n8n_to_module_request.schema.json`.

Key payload fields:
- `prompt`: String. Text description of the image to generate.
- `negative_prompt`: String. Things to avoid.
- `workflow`: String. Identifies the specific ComfyUI workflow template.
- `steps`: Integer. Denoising steps.

Safety structure:
- `approval_status`: Must be `'APPROVED'` or `safety.final_approval_granted` must be `true` if approval is required.

## 3. Output Specification
The callback output must match `module_to_core_callback.schema.json`.

Key payload fields:
- `asset_url`: String. URL reference to the generated asset.
- `file_placeholder`: String. Local mock storage file reference.
- `generation_params`: Object containing `seed`, `sampler`, `steps`.
- `status`: String (`COMPLETED` or `FAILED`).

## 4. Safety Rules
- **No Approval, No Action**: If `safety.requires_approval` is `true`, execution will be rejected with `status = REJECTED_BY_SAFETY` unless `approval_status = APPROVED` or `final_approval_granted = true`.
- **Stateless Operation**: Serve Core. Do not save permanent business records locally.
- **Environment Variables**:
  - `PORT`: Server listening port (default `8188`).

