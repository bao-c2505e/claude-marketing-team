# ComfyUI Pipeline API Specification

Version: 1.0.0

## Endpoints

### 1. GET /health
- **Method**: `GET`
- **Response (200 OK)**:
  ```json
  {
    "status": "OK",
    "module_name": "comfyui-pipeline",
    "version": "1.0.0",
    "timestamp": "2026-06-08T14:48:00Z"
  }
  ```

### 2. POST /run
- **Method**: `POST`
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body**: (Conforms to `n8n_to_module_request.schema.json`)
  ```json
  {
    "event_id": "9b7a421e-ea14-48f1-8cb5-7eb77c8e9b88",
    "event_type": "COMFYUI_GENERATION_REQUESTED",
    "correlation_id": "18f94e96-a83d-4c3e-8c34-77e8a9394fa9",
    "brand_id": "brand_demo_001",
    "campaign_id": "campaign_demo_001",
    "job_id": "job_demo_001",
    "module_name": "comfyui-pipeline",
    "callback_url": "http://localhost:5678/webhook/module-callback",
    "created_at": "2026-06-08T14:48:00Z",
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
- **Response (Success - 202 Accepted)**:
  ```json
  {
    "status": "QUEUED",
    "module_run_id": "run_comfyui_demo_001",
    "message": "Request validated and task queued successfully."
  }
  ```
- **Response (Error - Safety Rejection - 403 Forbidden)**:
  ```json
  {
    "status": "REJECTED_BY_SAFETY",
    "error": "Safety rejection: Task requires approval, but final approval was not granted."
  }
  ```
- **Response (Error - Invalid Contract - 400 Bad Request)**:
  ```json
  {
    "status": "INVALID_CONTRACT",
    "error": "Missing required field: brand_id"
  }
  ```

### 3. POST /simulate-callback
- **Method**: `POST`
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "job_id": "job_demo_001",
    "correlation_id": "18f94e96-a83d-4c3e-8c34-77e8a9394fa9",
    "simulate_status": "COMPLETED"
  }
  ```
- **Response (200 OK)**: (Conforms to `module_to_core_callback.schema.json`)
  ```json
  {
    "event_id": "f5e92cd3-5cb7-45bf-8547-a8b23c91d4e2",
    "correlation_id": "18f94e96-a83d-4c3e-8c34-77e8a9394fa9",
    "job_id": "job_demo_001",
    "module_name": "comfyui-pipeline",
    "status": "COMPLETED",
    "payload": {
      "module_run_id": "run_comfyui_abcd1234",
      "asset_url": "http://localhost:8188/assets/mock_generated_job_demo_001.png",
      "asset_type": "image/png",
      "generation_params": {
        "prompt": "A futuristic marketing banner for a smart AI assistant, dark glassmorphism style, neon accents",
        "sampler": "euler_ancestral",
        "steps": 25,
        "seed": 987654321
      },
      "file_placeholder": "storage/assets/placeholder_job_demo_001.png"
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

