// Helper function to check valid UUID
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Validate incoming ComfyUI execution request
 * @param {object} reqBody 
 * @returns {object} { valid: boolean, status: string, error: string }
 */
export function validateRequest(reqBody) {
  if (!reqBody || typeof reqBody !== 'object') {
    return { valid: false, status: 'INVALID_CONTRACT', error: 'Request body must be a JSON object' };
  }

  const requiredFields = ['correlation_id', 'brand_id', 'campaign_id', 'callback_url', 'payload', 'safety'];
  for (const field of requiredFields) {
    if (reqBody[field] === undefined) {
      return { valid: false, status: 'INVALID_CONTRACT', error: `Missing required field: ${field}` };
    }
  }

  // event_id or job_id check
  if (!reqBody.event_id && !reqBody.job_id) {
    return { valid: false, status: 'INVALID_CONTRACT', error: 'Must specify event_id or job_id' };
  }

  // Format checks
  if (reqBody.event_id && !isUUID(reqBody.event_id)) {
    return { valid: false, status: 'INVALID_CONTRACT', error: 'event_id must be a valid UUID' };
  }
  if (!isUUID(reqBody.correlation_id)) {
    return { valid: false, status: 'INVALID_CONTRACT', error: 'correlation_id must be a valid UUID' };
  }

  // Safety object structure checks
  const safety = reqBody.safety;
  if (typeof safety !== 'object') {
    return { valid: false, status: 'INVALID_CONTRACT', error: 'safety parameter must be an object' };
  }

  const requiredSafetyFlags = [
    'requires_approval',
    'final_approval_granted',
    'allow_real_world_action',
    'allow_auto_publish',
    'allow_ads_spend',
    'allow_customer_messaging'
  ];
  for (const flag of requiredSafetyFlags) {
    if (typeof safety[flag] !== 'boolean') {
      return { valid: false, status: 'INVALID_CONTRACT', error: `safety.${flag} flag must be a boolean` };
    }
  }

  // Logic checks for safety approval gate
  if (safety.requires_approval === true) {
    const approvalGranted = reqBody.approval_status === 'APPROVED' || safety.final_approval_granted === true;
    if (!approvalGranted) {
      return { 
        valid: false, 
        status: 'REJECTED_BY_SAFETY', 
        error: 'Safety rejection: Task requires approval, but final approval was not granted.' 
      };
    }
  }

  return { valid: true, status: 'QUEUED', error: null };
}
