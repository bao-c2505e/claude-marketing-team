import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- STARTING CONTRACT VALIDATION CHECK (ESM) ---');

const baseDir = path.resolve(__dirname, '..');
const examplesDir = path.join(baseDir, 'examples');

const schemas = [
  'core_to_n8n_event.schema.json',
  'n8n_to_module_request.schema.json',
  'module_to_core_callback.schema.json',
  'approval_event.schema.json'
];

const examples = [
  'valid_core_to_n8n_event.json',
  'invalid_core_to_n8n_event.json',
  'rejected_by_safety_callback.json',
  'valid_module_callback.json'
];

let failed = false;

// Helper function to validate UUID format
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper function to validate Date-Time format
function isISOString(str) {
  return !isNaN(Date.parse(str));
}

// Validate schemas syntax
schemas.forEach(schemaFile => {
  const filePath = path.join(baseDir, schemaFile);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] Schema parses as valid JSON: ${schemaFile}`);

    // Basic schema structure checks
    if (!parsed.$schema) {
      console.warn(`[WARN] Schema is missing '$schema' field: ${schemaFile}`);
    }
    if (parsed.type !== 'object') {
      console.error(`[FAIL] Schema type must be 'object': ${schemaFile}`);
      failed = true;
    }
    if (!parsed.properties || typeof parsed.properties !== 'object') {
      console.error(`[FAIL] Schema must contain a 'properties' object: ${schemaFile}`);
      failed = true;
    }
  } catch (err) {
    console.error(`[FAIL] Error parsing schema ${schemaFile}: ${err.message}`);
    failed = true;
  }
});

// Validate examples syntax and basic logical rules
examples.forEach(exampleFile => {
  const filePath = path.join(examplesDir, exampleFile);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] Example parses as valid JSON: ${exampleFile}`);

    if (exampleFile === 'valid_core_to_n8n_event.json') {
      // Must contain all required fields
      const requiredFields = [
        'event_id', 'event_type', 'correlation_id', 'brand_id', 'campaign_id',
        'job_id', 'created_at', 'payload', 'safety'
      ];
      requiredFields.forEach(f => {
        if (parsed[f] === undefined) {
          console.error(`[FAIL] Valid core event example is missing required field '${f}'`);
          failed = true;
        }
      });

      // Type and format checks
      if (!isUUID(parsed.event_id)) {
        console.error(`[FAIL] event_id in valid core event must be a valid UUID`);
        failed = true;
      }
      if (!isUUID(parsed.correlation_id)) {
        console.error(`[FAIL] correlation_id in valid core event must be a valid UUID`);
        failed = true;
      }
      if (!isISOString(parsed.created_at)) {
        console.error(`[FAIL] created_at in valid core event must be a valid ISO Date-Time string`);
        failed = true;
      }
      if (typeof parsed.safety !== 'object') {
        console.error(`[FAIL] safety must be an object`);
        failed = true;
      } else {
        const safetyFields = [
          'requires_approval', 'final_approval_granted', 'allow_real_world_action',
          'allow_auto_publish', 'allow_ads_spend', 'allow_customer_messaging'
        ];
        safetyFields.forEach(sf => {
          if (typeof parsed.safety[sf] !== 'boolean') {
            console.error(`[FAIL] safety.${sf} must be a boolean`);
            failed = true;
          }
        });
      }
    }

    if (exampleFile === 'invalid_core_to_n8n_event.json') {
      // Must fail validation logic (e.g. missing event_id or invalid UUID correlation_id)
      const hasMissingField = parsed.event_id === undefined || parsed.safety === undefined;
      const hasInvalidUUID = parsed.correlation_id && !isUUID(parsed.correlation_id);
      if (hasMissingField || hasInvalidUUID) {
        console.log(`[PASS] Invalid core event successfully identified as invalid (triggers INVALID_CONTRACT)`);
      } else {
        console.error(`[FAIL] Example 'invalid_core_to_n8n_event.json' did not fail validation checks`);
        failed = true;
      }
    }

    if (exampleFile === 'rejected_by_safety_callback.json') {
      if (parsed.status !== 'REJECTED_BY_SAFETY') {
        console.error(`[FAIL] rejected_by_safety_callback.json must have status = 'REJECTED_BY_SAFETY'`);
        failed = true;
      }
      if (!parsed.payload || typeof parsed.payload !== 'object' || !parsed.payload.reason) {
        console.error(`[FAIL] rejected_by_safety_callback.json must contain a payload object with a reason`);
        failed = true;
      }
    }

    if (exampleFile === 'valid_module_callback.json') {
      const callbackFields = ['event_id', 'correlation_id', 'job_id', 'module_name', 'status', 'payload', 'safety'];
      callbackFields.forEach(cf => {
        if (parsed[cf] === undefined) {
          console.error(`[FAIL] valid_module_callback.json is missing required field '${cf}'`);
          failed = true;
        }
      });
    }

  } catch (err) {
    console.error(`[FAIL] Error parsing example ${exampleFile}: ${err.message}`);
    failed = true;
  }
});

if (failed) {
  console.error('--- CONTRACT VALIDATION CHECKS FAILED ---');
  process.exit(1);
} else {
  console.log('--- ALL CONTRACT VALIDATION CHECKS PASSED SUCCESSFULLY ---');
  process.exit(0);
}
