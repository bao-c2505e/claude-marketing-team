import crypto from 'crypto';

/**
 * Generate a mock module_to_core_callback payload
 * @param {object} reqBody 
 * @param {string} status 
 * @returns {object} callback payload
 */
export function generateMockCallback(reqBody, status = 'COMPLETED') {
  const job_id = reqBody.job_id || 'job_demo_001';
  const correlation_id = reqBody.correlation_id || crypto.randomUUID();

  return {
    "event_id": crypto.randomUUID(),
    "correlation_id": correlation_id,
    "job_id": job_id,
    "module_name": "comfyui-pipeline",
    "status": status,
    "payload": {
      "module_run_id": `run_comfyui_${crypto.randomBytes(4).toString('hex')}`,
      "asset_url": `https://storage.thecoreagency.com/assets/mock_generated_${job_id}.png`,
      "asset_type": "image/png",
      "generation_params": {
        "prompt": reqBody.payload?.prompt || "A generic workspace template",
        "sampler": "euler_ancestral",
        "steps": reqBody.payload?.steps || 20,
        "seed": Math.floor(Math.random() * 1000000000)
      },
      "file_placeholder": `storage/assets/placeholder_${job_id}.png`
    },
    "safety": reqBody.safety || {
      "requires_approval": true,
      "final_approval_granted": true,
      "allow_real_world_action": true,
      "allow_auto_publish": false,
      "allow_ads_spend": false,
      "allow_customer_messaging": false
    }
  };
}
