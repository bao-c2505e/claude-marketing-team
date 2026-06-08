# ComfyUI Pipeline API Specification

Version: 1.0.0

## Endpoints

### 1. Trigger Asset Generation
- **Endpoint**: `/api/v1/comfyui-pipeline/generate`
- **Method**: `POST`
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body**: (Conforms to `n8n_to_module_request.schema.json`)
  ```json
  {
    "correlation_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "job_id": "job_123456",
    "module_name": "comfyui-pipeline",
    "callback_url": "http://localhost:5678/webhook/module-callback",
    "payload": {
      "prompt": "A futuristic marketing banner for a smart AI assistant, dark glassmorphism style, neon accents",
      "negative_prompt": "blurry, low quality, bad hands, deformed",
      "workflow": "marketing_banner_v1",
      "steps": 25
    },
    "safety": {
      "requires_approval": true,
      "final_approval_granted": true,
      "allow_real_world_action": true,
      "allow_auto_publish": false,
      "allow_ads_spend": false,
      "allow_customer_messaging": false
    }
  }
  ```
- **Response (Success - Processing Started)**:
  - **Status Code**: `202 Accepted`
  - **Body**:
    ```json
    {
      "status": "processing",
      "job_id": "job_123456",
      "message": "ComfyUI generation started. Results will be posted to the callback URL."
    }
    ```
- **Response (Error - Safety Rejection)**:
  - **Status Code**: `403 Forbidden`
  - **Body**:
    ```json
    {
      "status": "rejected",
      "job_id": "job_123456",
      "error": "Safety block: requires_approval is true but final_approval_granted is false."
    }
    ```

### 2. Check Job Status (Polling fallback)
- **Endpoint**: `/api/v1/comfyui-pipeline/jobs/:id`
- **Method**: `GET`
- **Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "job_id": "job_123456",
      "status": "COMPLETED",
      "asset_url": "https://storage.thecoreagency.com/assets/job_123456.png"
    }
    ```
