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

      // Check for approval_status in valid_core_to_n8n_event.json if event_type triggers real-world actions
      if (['CAMPAIGN_PUBLISH_REQUESTED', 'ADS_SPEND_REQUESTED'].includes(parsed.event_type)) {
        if (!parsed.approval_status) {
          console.error(`[FAIL] valid_core_to_n8n_event.json must contain approval_status for ${parsed.event_type}`);
          failed = true;
        } else {
          console.log(`[PASS] valid_core_to_n8n_event.json contains approval_status '${parsed.approval_status}' for ${parsed.event_type}`);
        }
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

// Additional n8n router workflow validations
const routerPath = path.join(baseDir, '../n8n-workflows/core_event_router.workflow.json');
try {
  const routerContent = fs.readFileSync(routerPath, 'utf8');
  const routerJson = JSON.parse(routerContent);
  console.log(`[PASS] Router workflow parses as valid JSON`);

  // Find the Normalize node
  const normalizeNode = routerJson.nodes.find(n => n.name === 'Set: Normalize Core Event');
  if (!normalizeNode) {
    console.error(`[FAIL] Router workflow is missing node 'Set: Normalize Core Event'`);
    failed = true;
  } else {
    // Check normalize mappings
    const stringValues = normalizeNode.parameters.values.string || [];
    const otherValues = normalizeNode.parameters.values.other || [];
    const normalizedFields = [...stringValues, ...otherValues].map(v => v.name);

    const expectedNormalized = ['approval_status', 'safety', 'payload'];
    expectedNormalized.forEach(field => {
      if (!normalizedFields.includes(field)) {
        console.error(`[FAIL] Normalize node is missing mapping for: ${field}`);
        failed = true;
      } else {
        console.log(`[PASS] Normalize node maps top-level field: ${field}`);
      }
    });
  }

  // Check specific safety gates do not read $json.body.safety or $json.body.approval_status
  const safetyGates = routerJson.nodes.filter(n => n.name && n.name.startsWith('IF: Safety Gate -'));
  safetyGates.forEach(gate => {
    const gateStr = JSON.stringify(gate);
    if (gateStr.includes('$json.body.safety') || gateStr.includes('$json.body.approval_status')) {
      console.error(`[FAIL] Safety gate '${gate.name}' reads from $json.body.safety or $json.body.approval_status. It must read from top-level normalized fields.`);
      failed = true;
    } else {
      console.log(`[PASS] Safety gate '${gate.name}' correctly reads from top-level normalized fields`);
    }
  });

} catch (err) {
  console.error(`[FAIL] Error validating router workflow: ${err.message}`);
  failed = true;
}

// Additional module examples validation
const modulesExamplesDir = path.join(examplesDir, 'modules');
const moduleExamples = [
  'comfyui_run_request.json',
  'comfyui_sync_response.json',
  'comfyui_callback_completed.json',
  'comfyui_callback_failed.json',
  'publisher_rejected_by_safety.json',
  'meta_ads_rejected_by_safety.json'
];

moduleExamples.forEach(moduleExampleFile => {
  const filePath = path.join(modulesExamplesDir, moduleExampleFile);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check no "vicuon" or "Vị Cuốn" hardcoding is present
    if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
      console.error(`[FAIL] Example '${moduleExampleFile}' contains Vị Cuốn / vicuon brand hardcoding`);
      failed = true;
    } else {
      console.log(`[PASS] Example '${moduleExampleFile}' does not contain brand hardcoding`);
    }

    // Check no production-like URLs are present in modules examples
    if (content.includes('https://storage.thecoreagency.com') || content.includes('https://thecoreagency.com')) {
      console.error(`[FAIL] Example '${moduleExampleFile}' contains production-like URL targeting thecoreagency.com`);
      failed = true;
    } else {
      console.log(`[PASS] Example '${moduleExampleFile}' does not contain production-like URLs`);
    }

    const parsed = JSON.parse(content);
    console.log(`[PASS] Example parses as valid JSON: modules/${moduleExampleFile}`);

    // Rejected safety checks
    if (moduleExampleFile.endsWith('rejected_by_safety.json')) {
      if (parsed.status !== 'REJECTED_BY_SAFETY') {
        console.error(`[FAIL] '${moduleExampleFile}' must have status = 'REJECTED_BY_SAFETY'`);
        failed = true;
      }
    }

    // ComfyUI run request checks
    if (moduleExampleFile === 'comfyui_run_request.json') {
      const requiredRunRequestFields = ['safety', 'callback_url', 'correlation_id', 'job_id'];
      requiredRunRequestFields.forEach(f => {
        if (parsed[f] === undefined) {
          console.error(`[FAIL] comfyui_run_request.json is missing required field '${f}'`);
          failed = true;
        }
      });
    }

  } catch (err) {
    console.error(`[FAIL] Error parsing module example ${moduleExampleFile}: ${err.message}`);
    failed = true;
  }
});

// Validate modules package files
const comfyuiPackagePath = path.join(baseDir, '../modules/comfyui-pipeline/package.json');
try {
  const packageContent = fs.readFileSync(comfyuiPackagePath, 'utf8');
  JSON.parse(packageContent);
  console.log(`[PASS] comfyui-pipeline package.json parses as valid JSON`);
} catch (err) {
  console.error(`[FAIL] Error parsing comfyui-pipeline package.json: ${err.message}`);
  failed = true;
}

// Validate Phase N4 files
console.log('--- STARTING PHASE N4 VALIDATION CHECKS ---');
const n4MockEventPath = path.join(baseDir, 'examples/n8n/n4_mock_core_event.json');
try {
  const content = fs.readFileSync(n4MockEventPath, 'utf8');
  if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
    console.error(`[FAIL] n4_mock_core_event.json contains Vị Cuốn / vicuon brand hardcoding`);
    failed = true;
  }
  if (content.includes('https://storage.thecoreagency.com') || content.includes('https://thecoreagency.com')) {
    console.error(`[FAIL] n4_mock_core_event.json contains production-like URLs`);
    failed = true;
  }
  const parsed = JSON.parse(content);
  if (!parsed.event_type || !parsed.request_id || !parsed.brand_id) {
    console.error(`[FAIL] n4_mock_core_event.json is missing required fields`);
    failed = true;
  } else {
    console.log(`[PASS] n4_mock_core_event.json validated successfully`);
  }
} catch (err) {
  console.error(`[FAIL] Error parsing n4_mock_core_event.json: ${err.message}`);
  failed = true;
}

const n4CallbackPath = path.join(baseDir, 'examples/n8n/n4_expected_callback_preview.json');
try {
  const content = fs.readFileSync(n4CallbackPath, 'utf8');
  if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
    console.error(`[FAIL] n4_expected_callback_preview.json contains Vị Cuốn / vicuon brand hardcoding`);
    failed = true;
  }
  if (content.includes('https://storage.thecoreagency.com') || content.includes('https://thecoreagency.com')) {
    console.error(`[FAIL] n4_expected_callback_preview.json contains production-like URLs`);
    failed = true;
  }
  const parsed = JSON.parse(content);
  if (!parsed.request_id || !parsed.module_id || !parsed.status) {
    console.error(`[FAIL] n4_expected_callback_preview.json is missing required fields`);
    failed = true;
  } else {
    console.log(`[PASS] n4_expected_callback_preview.json validated successfully`);
  }
} catch (err) {
  console.error(`[FAIL] Error parsing n4_expected_callback_preview.json: ${err.message}`);
  failed = true;
}

const n4WorkflowPath = path.join(baseDir, '../n8n-workflows/n4_comfyui_stub_integration_test.workflow.json');
try {
  const content = fs.readFileSync(n4WorkflowPath, 'utf8');
  if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
    console.error(`[FAIL] n4_comfyui_stub_integration_test.workflow.json contains Vị Cuốn / vicuon brand hardcoding`);
    failed = true;
  }
  if (content.includes('https://storage.thecoreagency.com') || content.includes('https://thecoreagency.com')) {
    console.error(`[FAIL] n4_comfyui_stub_integration_test.workflow.json contains production-like URLs`);
    failed = true;
  }
  const parsed = JSON.parse(content);
  console.log(`[PASS] n4_comfyui_stub_integration_test.workflow.json parses as valid JSON`);
} catch (err) {
  console.error(`[FAIL] Error parsing n4_comfyui_stub_integration_test.workflow.json: ${err.message}`);
  failed = true;
}


// Validate Phase N5 files
console.log('--- STARTING PHASE N5 VALIDATION CHECKS ---');
const routerExamplesDir = path.join(baseDir, 'examples/n8n/router');
const routerOutputsDir = path.join(routerExamplesDir, 'expected_outputs');

const n5Events = [
  'creative_asset_requested.json',
  'content_pack_requested.json',
  'ads_pack_requested.json',
  'crm_followup_requested.json',
  'analytics_report_requested.json'
];

const n5Outputs = [
  'creative_asset_routing_output.json',
  'content_pack_routing_output.json',
  'ads_pack_routing_output.json',
  'crm_followup_routing_output.json',
  'analytics_report_routing_output.json'
];

const supportedEventTypes = [
  'creative_asset.requested',
  'content_pack.requested',
  'ads_pack.requested',
  'crm_followup.requested',
  'analytics_report.requested'
];

n5Events.forEach(file => {
  const filePath = path.join(routerExamplesDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check brand name blocking
    if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
      console.error(`[FAIL] ${file} contains Vị Cuốn / vicuon brand hardcoding`);
      failed = true;
    }
    
    // Check production URL blocking
    if (content.includes('thecoreagency.com')) {
      console.error(`[FAIL] ${file} contains production-like URL (thecoreagency.com)`);
      failed = true;
    }

    // Check suspicious keys/secrets
    if (/api_key|secret|token/i.test(content) && !content.includes('workflow_engine')) {
      console.error(`[FAIL] ${file} contains suspicious secret keywords`);
      failed = true;
    }

    const parsed = JSON.parse(content);
    console.log(`[PASS] Example parses as valid JSON: router/${file}`);

    // Required fields check
    const required = [
      'contract_version', 'event_type', 'request_id', 'brand_id',
      'campaign_id', 'requested_by', 'callback_url', 'payload', 'metadata'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] ${file} is missing required field '${f}'`);
        failed = true;
      }
    });

    // Check brand_id
    if (parsed.brand_id !== 'brand_demo_001') {
      console.error(`[FAIL] ${file} must have brand_id = 'brand_demo_001', found '${parsed.brand_id}'`);
      failed = true;
    }

    // Check event_type
    if (!supportedEventTypes.includes(parsed.event_type)) {
      console.error(`[FAIL] ${file} has unsupported event_type '${parsed.event_type}'`);
      failed = true;
    }

  } catch (err) {
    console.error(`[FAIL] Error parsing Phase N5 event example ${file}: ${err.message}`);
    failed = true;
  }
});

n5Outputs.forEach(file => {
  const filePath = path.join(routerOutputsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
      console.error(`[FAIL] ${file} contains Vị Cuốn / vicuon brand hardcoding`);
      failed = true;
    }
    
    if (content.includes('thecoreagency.com')) {
      console.error(`[FAIL] ${file} contains production-like URL (thecoreagency.com)`);
      failed = true;
    }

    const parsed = JSON.parse(content);
    console.log(`[PASS] Example parses as valid JSON: router/expected_outputs/${file}`);

    // Required fields check
    const required = [
      'request_id', 'event_type', 'module_id', 'route_status',
      'endpoint_type', 'callback_preview', 'source', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] ${file} is missing required field '${f}'`);
        failed = true;
      }
    });

    // Validate callback_preview structure
    if (parsed.callback_preview) {
      const cbRequired = [
        'request_id', 'event_type', 'module_id', 'status',
        'output', 'errors', 'source', 'generated_at', 'notes'
      ];
      cbRequired.forEach(cbf => {
        if (parsed.callback_preview[cbf] === undefined) {
          console.error(`[FAIL] ${file} callback_preview is missing field '${cbf}'`);
          failed = true;
        }
      });
    }

  } catch (err) {
    console.error(`[FAIL] Error parsing Phase N5 routing output example ${file}: ${err.message}`);
    failed = true;
  }
});

// Validate Phase N5 workflow JSON
const n5WorkflowPath = path.join(baseDir, '../n8n-workflows/n5_multi_module_event_router.workflow.json');
try {
  const content = fs.readFileSync(n5WorkflowPath, 'utf8');
  if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
    console.error(`[FAIL] n5_multi_module_event_router.workflow.json contains Vị Cuốn / vicuon brand hardcoding`);
    failed = true;
  }
  if (content.includes('thecoreagency.com')) {
    console.error(`[FAIL] n5_multi_module_event_router.workflow.json contains production-like URLs`);
    failed = true;
  }
  if (/api_key|secret|token/i.test(content) && !content.includes('workflow_engine')) {
    console.error(`[FAIL] n5_multi_module_event_router.workflow.json contains suspicious secret keywords`);
    failed = true;
  }
  JSON.parse(content);
  console.log(`[PASS] n5_multi_module_event_router.workflow.json parses as valid JSON`);
} catch (err) {
  console.error(`[FAIL] Error parsing n5_multi_module_event_router.workflow.json: ${err.message}`);
  failed = true;
}


if (failed) {
  console.error('--- CONTRACT VALIDATION CHECKS FAILED ---');
  process.exit(1);
} else {
  console.log('--- ALL CONTRACT VALIDATION CHECKS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

