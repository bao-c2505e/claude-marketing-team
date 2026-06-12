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


// Validate Phase N6 files
console.log('--- STARTING PHASE N6 VALIDATION CHECKS ---');
const n6Modules = [
  'content-pack-generator',
  'ads-pack-generator',
  'crm-followup-generator',
  'analytics-report-generator'
];

const modulesDir = path.join(baseDir, '../modules');

n6Modules.forEach(moduleName => {
  const modulePath = path.join(modulesDir, moduleName);
  
  // 1. Check file layout
  const requiredFiles = ['package.json', 'server.js', 'README.md'];
  requiredFiles.forEach(f => {
    const filePath = path.join(modulePath, f);
    if (!fs.existsSync(filePath)) {
      console.error(`[FAIL] Module '${moduleName}' is missing required file '${f}'`);
      failed = true;
    } else {
      console.log(`[PASS] Module '${moduleName}' contains '${f}'`);
    }
  });

  const exampleFiles = ['request.json', 'response.json', 'callback_preview.json'];
  exampleFiles.forEach(f => {
    const filePath = path.join(modulePath, 'examples', f);
    if (!fs.existsSync(filePath)) {
      console.error(`[FAIL] Module '${moduleName}' is missing required example file 'examples/${f}'`);
      failed = true;
    } else {
      // 2. Parse JSON and check safety
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check brand name blocking
        if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
          console.error(`[FAIL] Module '${moduleName}' example '${f}' contains Vị Cuốn / vicuon brand hardcoding`);
          failed = true;
        }

        // Check production URL blocking
        if (content.includes('thecoreagency.com')) {
          console.error(`[FAIL] Module '${moduleName}' example '${f}' contains production-like URL targeting thecoreagency.com`);
          failed = true;
        }

        // Check secrets keyword blocking
        if (/api_key|secret|token/i.test(content)) {
          console.error(`[FAIL] Module '${moduleName}' example '${f}' contains suspicious secret keywords`);
          failed = true;
        }

        JSON.parse(content);
        console.log(`[PASS] Module '${moduleName}' example '${f}' parses as valid JSON`);
      } catch (err) {
        console.error(`[FAIL] Error validating Module '${moduleName}' example '${f}': ${err.message}`);
        failed = true;
      }
    }
  });
});

// Check registry
const registryPath = path.join(baseDir, 'module_registry.md');
if (!fs.existsSync(registryPath)) {
  console.error(`[FAIL] module_registry.md is missing`);
  failed = true;
} else {
  try {
    const registryContent = fs.readFileSync(registryPath, 'utf8');
    if (registryContent.toLowerCase().includes('vicuon') || registryContent.includes('Vị Cuốn')) {
      console.error(`[FAIL] module_registry.md contains Vị Cuốn / vicuon brand hardcoding`);
      failed = true;
    }
    if (registryContent.includes('thecoreagency.com')) {
      console.error(`[FAIL] module_registry.md contains production-like URL targeting thecoreagency.com`);
      failed = true;
    }
    console.log(`[PASS] module_registry.md safety checks passed`);
  } catch (err) {
    console.error(`[FAIL] Error reading module_registry.md: ${err.message}`);
    failed = true;
  }
}


// Validate Phase N7 files
console.log('--- STARTING PHASE N7 VALIDATION CHECKS ---');
const n7EventsDir = path.join(baseDir, 'examples/n8n/n7');
const n7OutputsDir = path.join(n7EventsDir, 'expected_outputs');

const n7Events = [
  'creative_asset_test_event.json',
  'content_pack_test_event.json',
  'ads_pack_test_event.json',
  'crm_followup_test_event.json',
  'analytics_report_test_event.json'
];

const n7Outputs = [
  'creative_asset_expected_output.json',
  'content_pack_expected_output.json',
  'ads_pack_expected_output.json',
  'crm_followup_expected_output.json',
  'analytics_report_expected_output.json'
];

n7Events.forEach(file => {
  const filePath = path.join(n7EventsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check brand name blocking
    if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
      console.error(`[FAIL] N7 event ${file} contains Vị Cuốn / vicuon brand hardcoding`);
      failed = true;
    }
    
    // Check production URL blocking
    if (content.includes('thecoreagency.com')) {
      console.error(`[FAIL] N7 event ${file} contains production-like URL (thecoreagency.com)`);
      failed = true;
    }

    // Check suspicious secrets
    if (/api_key|secret|token/i.test(content) && !content.includes('workflow_engine')) {
      console.error(`[FAIL] N7 event ${file} contains suspicious secret keywords`);
      failed = true;
    }

    const parsed = JSON.parse(content);
    console.log(`[PASS] N7 event parses as valid JSON: n7/${file}`);

    // Required fields check
    const required = [
      'contract_version', 'event_type', 'request_id', 'brand_id',
      'campaign_id', 'requested_by', 'callback_url', 'payload', 'metadata'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N7 event ${file} is missing required field '${f}'`);
        failed = true;
      }
    });

    // Check brand_id
    if (parsed.brand_id !== 'brand_demo_001') {
      console.error(`[FAIL] N7 event ${file} must have brand_id = 'brand_demo_001', found '${parsed.brand_id}'`);
      failed = true;
    }

    // Check event_type
    if (!supportedEventTypes.includes(parsed.event_type)) {
      console.error(`[FAIL] N7 event ${file} has unsupported event_type '${parsed.event_type}'`);
      failed = true;
    }

  } catch (err) {
    console.error(`[FAIL] Error parsing Phase N7 event example ${file}: ${err.message}`);
    failed = true;
  }
});

n7Outputs.forEach(file => {
  const filePath = path.join(n7OutputsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
      console.error(`[FAIL] N7 expected output ${file} contains Vị Cuốn / vicuon brand hardcoding`);
      failed = true;
    }
    
    if (content.includes('thecoreagency.com')) {
      console.error(`[FAIL] N7 expected output ${file} contains production-like URL (thecoreagency.com)`);
      failed = true;
    }

    const parsed = JSON.parse(content);
    console.log(`[PASS] N7 expected output parses as valid JSON: n7/expected_outputs/${file}`);

    // Required fields check
    const required = [
      'request_id', 'event_type', 'module_id', 'route_status',
      'module_response', 'callback_preview', 'source', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N7 expected output ${file} is missing required field '${f}'`);
        failed = true;
      }
    });

  } catch (err) {
    console.error(`[FAIL] Error parsing Phase N7 expected output example ${file}: ${err.message}`);
    failed = true;
  }
});

// Validate Phase N7 workflow JSON
const n7WorkflowPath = path.join(baseDir, '../n8n-workflows/n7_full_multi_module_stub_integration.workflow.json');
try {
  const content = fs.readFileSync(n7WorkflowPath, 'utf8');
  if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
    console.error(`[FAIL] n7_full_multi_module_stub_integration.workflow.json contains Vị Cuốn / vicuon brand hardcoding`);
    failed = true;
  }
  if (content.includes('thecoreagency.com')) {
    console.error(`[FAIL] n7_full_multi_module_stub_integration.workflow.json contains production-like URLs`);
    failed = true;
  }
  if (/api_key|secret|token/i.test(content) && !content.includes('workflow_engine')) {
    console.error(`[FAIL] n7_full_multi_module_stub_integration.workflow.json contains suspicious secret keywords`);
    failed = true;
  }
  
  // Check local endpoint map
  const expectedEndpoints = [
    'localhost:8188/run',
    'localhost:8191/run',
    'localhost:8192/run',
    'localhost:8193/run',
    'localhost:8194/run'
  ];
  expectedEndpoints.forEach(ep => {
    if (!content.includes(ep)) {
      console.error(`[FAIL] n7_full_multi_module_stub_integration.workflow.json is missing local endpoint: ${ep}`);
      failed = true;
    } else {
      console.log(`[PASS] n7 workflow contains local endpoint: ${ep}`);
    }
  });

  JSON.parse(content);
  console.log(`[PASS] n7_full_multi_module_stub_integration.workflow.json parses as valid JSON`);
} catch (err) {
  console.error(`[FAIL] Error parsing n7_full_multi_module_stub_integration.workflow.json: ${err.message}`);
  failed = true;
}

// Validate Phase N8 files
console.log('--- STARTING PHASE N8 VALIDATION CHECKS ---');
const n8Dir = path.join(baseDir, 'examples/n8n/n8');
const n8ApprovalDecisionsDir = path.join(n8Dir, 'approval_decisions');
const n8ExpectedOutputsDir = path.join(n8Dir, 'expected_outputs');

const n8CallbackFiles = [
  'unified_callback_approved.json',
  'unified_callback_needs_revision.json',
  'unified_callback_pending_approval.json',
  'unified_callback_rejected.json'
];

const n8DecisionFiles = [
  'approval_decision_approved.json',
  'approval_decision_rejected.json',
  'approval_decision_needs_revision.json',
  'approval_decision_pending.json'
];

const n8ExpectedOutputFiles = [
  'approved_expected_output.json',
  'rejected_expected_output.json',
  'needs_revision_expected_output.json',
  'pending_expected_output.json'
];

// 1. Validate callback files
n8CallbackFiles.forEach(file => {
  const filePath = path.join(n8Dir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Safety checks
    if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
      console.error(`[FAIL] N8 callback ${file} contains Vị Cuốn / vicuon brand hardcoding`);
      failed = true;
    }
    if (content.includes('thecoreagency.com')) {
      console.error(`[FAIL] N8 callback ${file} contains production-like URL (thecoreagency.com)`);
      failed = true;
    }
    if (/api_key|secret|token/i.test(content) && !content.includes('workflow_engine')) {
      console.error(`[FAIL] N8 callback ${file} contains suspicious secret keywords`);
      failed = true;
    }

    const parsed = JSON.parse(content);
    console.log(`[PASS] N8 callback parses as valid JSON: n8/${file}`);

    // Required fields check
    const required = [
      'contract_version', 'request_id', 'event_type', 'brand_id', 'campaign_id',
      'module_id', 'module_status', 'approval_status', 'output', 'errors',
      'metadata', 'source', 'generated_at', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N8 callback ${file} is missing required field '${f}'`);
        failed = true;
      }
    });

    if (parsed.brand_id !== 'brand_demo_001') {
      console.error(`[FAIL] N8 callback ${file} must have brand_id = 'brand_demo_001', found '${parsed.brand_id}'`);
      failed = true;
    }

    const allowedApprovalStatuses = ['pending_approval', 'approved', 'rejected', 'needs_revision'];
    if (!allowedApprovalStatuses.includes(parsed.approval_status)) {
      console.error(`[FAIL] N8 callback ${file} has invalid approval_status '${parsed.approval_status}'`);
      failed = true;
    }

    const allowedModuleStatuses = ['mock_completed', 'completed', 'failed', 'skipped'];
    if (!allowedModuleStatuses.includes(parsed.module_status)) {
      console.error(`[FAIL] N8 callback ${file} has invalid module_status '${parsed.module_status}'`);
      failed = true;
    }

  } catch (err) {
    console.error(`[FAIL] Error parsing Phase N8 callback example ${file}: ${err.message}`);
    failed = true;
  }
});

// 2. Validate decision files
n8DecisionFiles.forEach(file => {
  const filePath = path.join(n8ApprovalDecisionsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
      console.error(`[FAIL] N8 decision ${file} contains Vị Cuốn / vicuon brand hardcoding`);
      failed = true;
    }
    if (content.includes('thecoreagency.com')) {
      console.error(`[FAIL] N8 decision ${file} contains production-like URL (thecoreagency.com)`);
      failed = true;
    }
    if (/api_key|secret|token/i.test(content) && !content.includes('no_secrets')) {
      console.error(`[FAIL] N8 decision ${file} contains suspicious secret keywords`);
      failed = true;
    }

    const parsed = JSON.parse(content);
    console.log(`[PASS] N8 decision parses as valid JSON: n8/approval_decisions/${file}`);

    const required = [
      'approval_id', 'request_id', 'decision', 'reviewer', 'reviewed_at',
      'reason', 'revision_notes', 'safety_flags', 'next_action'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N8 decision ${file} is missing required field '${f}'`);
        failed = true;
      }
    });

    const allowedDecisions = ['approved', 'rejected', 'needs_revision', 'pending'];
    if (!allowedDecisions.includes(parsed.decision)) {
      console.error(`[FAIL] N8 decision ${file} has invalid decision value '${parsed.decision}'`);
      failed = true;
    }

  } catch (err) {
    console.error(`[FAIL] Error parsing Phase N8 decision example ${file}: ${err.message}`);
    failed = true;
  }
});

// 3. Validate expected output files
n8ExpectedOutputFiles.forEach(file => {
  const filePath = path.join(n8ExpectedOutputsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
      console.error(`[FAIL] N8 expected output ${file} contains Vị Cuốn / vicuon brand hardcoding`);
      failed = true;
    }
    if (content.includes('thecoreagency.com')) {
      console.error(`[FAIL] N8 expected output ${file} contains production-like URL (thecoreagency.com)`);
      failed = true;
    }
    if (/api_key|secret|token/i.test(content) && !content.includes('no_secrets')) {
      console.error(`[FAIL] N8 expected output ${file} contains suspicious secret keywords`);
      failed = true;
    }

    const parsed = JSON.parse(content);
    console.log(`[PASS] N8 expected output parses as valid JSON: n8/expected_outputs/${file}`);

    const required = [
      'request_id', 'event_type', 'module_id', 'approval_status', 'final_status',
      'callback_preview', 'next_action', 'source', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N8 expected output ${file} is missing required field '${f}'`);
        failed = true;
      }
    });

    if (parsed.source !== 'n8n_n8_approval_gate_mock') {
      console.error(`[FAIL] N8 expected output ${file} must have source = 'n8n_n8_approval_gate_mock', found '${parsed.source}'`);
      failed = true;
    }

    const allowedApprovalStatuses = ['pending_approval', 'approved', 'rejected', 'needs_revision'];
    if (!allowedApprovalStatuses.includes(parsed.approval_status)) {
      console.error(`[FAIL] N8 expected output ${file} has invalid approval_status '${parsed.approval_status}'`);
      failed = true;
    }

    const allowedFinalStatuses = ['ready_for_mock_callback_preview', 'ready_for_mock_callback', 'stopped_rejected', 'revision_required', 'waiting_for_owner_approval'];
    if (!allowedFinalStatuses.includes(parsed.final_status)) {
      console.error(`[FAIL] N8 expected output ${file} has invalid final_status '${parsed.final_status}'`);
      failed = true;
    }

    // Verify final status mapping matches decision/approval status
    if (parsed.approval_status === 'approved') {
      if (parsed.final_status !== 'ready_for_mock_callback_preview' && parsed.final_status !== 'ready_for_mock_callback') {
        console.error(`[FAIL] Expected output for 'approved' has invalid final_status '${parsed.final_status}'`);
        failed = true;
      }
    } else if (parsed.approval_status === 'rejected') {
      if (parsed.final_status !== 'stopped_rejected') {
        console.error(`[FAIL] Expected output for 'rejected' has invalid final_status '${parsed.final_status}'`);
        failed = true;
      }
    } else if (parsed.approval_status === 'needs_revision') {
      if (parsed.final_status !== 'revision_required') {
        console.error(`[FAIL] Expected output for 'needs_revision' has invalid final_status '${parsed.final_status}'`);
        failed = true;
      }
    } else if (parsed.approval_status === 'pending_approval') {
      if (parsed.final_status !== 'waiting_for_owner_approval') {
        console.error(`[FAIL] Expected output for 'pending_approval' has invalid final_status '${parsed.final_status}'`);
        failed = true;
      }
    }

  } catch (err) {
    console.error(`[FAIL] Error parsing Phase N8 expected output example ${file}: ${err.message}`);
    failed = true;
  }
});

// 4. Validate Phase N8 workflow JSON
const n8WorkflowPath = path.join(baseDir, '../n8n-workflows/n8_unified_callback_approval_gate.workflow.json');
try {
  const content = fs.readFileSync(n8WorkflowPath, 'utf8');
  if (content.toLowerCase().includes('vicuon') || content.includes('Vị Cuốn')) {
    console.error(`[FAIL] n8_unified_callback_approval_gate.workflow.json contains Vị Cuốn / vicuon brand hardcoding`);
    failed = true;
  }
  if (content.includes('thecoreagency.com')) {
    console.error(`[FAIL] n8_unified_callback_approval_gate.workflow.json contains production-like URLs`);
    failed = true;
  }
  
  // Verify no HTTP request nodes or credential references
  if (content.includes('"type": "n8n-nodes-base.httpRequest"') && content.includes('"url"')) {
    console.error(`[FAIL] n8_unified_callback_approval_gate.workflow.json contains an HTTP request node making calls`);
    failed = true;
  }
  if (/credentials/i.test(content) && !content.includes('workflow_engine')) {
    console.error(`[FAIL] n8_unified_callback_approval_gate.workflow.json contains credentials reference`);
    failed = true;
  }

  const parsed = JSON.parse(content);
  // Verify that the workflow includes/represents the 4 approval branches in some form
  const nodesText = JSON.stringify(parsed.nodes);
  const containsApprovedBranch = nodesText.includes('"approved"');
  const containsRejectedBranch = nodesText.includes('"rejected"');
  const containsRevisionBranch = nodesText.includes('"needs_revision"');
  const containsPendingBranch = nodesText.includes('"pending"') || nodesText.includes('"pending_approval"');
  
  if (!containsApprovedBranch || !containsRejectedBranch || !containsRevisionBranch || !containsPendingBranch) {
    console.error(`[FAIL] n8_unified_callback_approval_gate.workflow.json is missing one of the 4 approval branches in routing logic`);
    failed = true;
  } else {
    console.log(`[PASS] n8 workflow represents the 4 approval branches (approved, rejected, needs_revision, pending)`);
  }

  // 1. Verify required final output fields directly inside workflow nodes
  const requiredOutputFields = [
    'request_id',
    'event_type',
    'module_id',
    'approval_status',
    'final_status',
    'callback_preview',
    'next_action',
    'source',
    'notes'
  ];
  requiredOutputFields.forEach(field => {
    if (!nodesText.includes(`"${field}"`)) {
      console.error(`[FAIL] n8_unified_callback_approval_gate.workflow.json does not contain required output field '${field}' inside nodes`);
      failed = true;
    } else {
      console.log(`[PASS] n8 workflow contains required output field '${field}' inside nodes`);
    }
  });

  // 2. Verify all approval statuses inside workflow nodes
  const requiredApprovalStatuses = [
    'approved',
    'rejected',
    'needs_revision',
    'pending_approval'
  ];
  requiredApprovalStatuses.forEach(status => {
    if (!nodesText.includes(`"${status}"`)) {
      console.error(`[FAIL] n8_unified_callback_approval_gate.workflow.json does not contain approval status '${status}' inside nodes`);
      failed = true;
    } else {
      console.log(`[PASS] n8 workflow contains approval status '${status}' inside nodes`);
    }
  });

  // 3. Verify approval-to-final-status mapping directly inside the workflow node JS Code
  let approvedMapped = false;
  let rejectedMapped = false;
  let revisionMapped = false;
  let pendingMapped = false;

  parsed.nodes.forEach(node => {
    if (node.parameters && node.parameters.jsCode) {
      const code = node.parameters.jsCode;
      if (code.includes('"approved"') && (code.includes('"ready_for_mock_callback_preview"') || code.includes('"ready_for_mock_callback"'))) {
        approvedMapped = true;
      }
      if (code.includes('"rejected"') && code.includes('"stopped_rejected"')) {
        rejectedMapped = true;
      }
      if (code.includes('"needs_revision"') && code.includes('"revision_required"')) {
        revisionMapped = true;
      }
      if (code.includes('"pending_approval"') && code.includes('"waiting_for_owner_approval"')) {
        pendingMapped = true;
      }
    }
  });

  if (!approvedMapped) {
    console.error(`[FAIL] n8n workflow does not contain mapping: approved -> ready_for_mock_callback_preview in node JS code`);
    failed = true;
  } else {
    console.log(`[PASS] n8n workflow contains mapping: approved -> ready_for_mock_callback_preview in node JS code`);
  }
  if (!rejectedMapped) {
    console.error(`[FAIL] n8n workflow does not contain mapping: rejected -> stopped_rejected in node JS code`);
    failed = true;
  } else {
    console.log(`[PASS] n8n workflow contains mapping: rejected -> stopped_rejected in node JS code`);
  }
  if (!revisionMapped) {
    console.error(`[FAIL] n8n workflow does not contain mapping: needs_revision -> revision_required in node JS code`);
    failed = true;
  } else {
    console.log(`[PASS] n8n workflow contains mapping: needs_revision -> revision_required in node JS code`);
  }
  if (!pendingMapped) {
    console.error(`[FAIL] n8n workflow does not contain mapping: pending_approval -> waiting_for_owner_approval in node JS code`);
    failed = true;
  } else {
    console.log(`[PASS] n8n workflow contains mapping: pending_approval -> waiting_for_owner_approval in node JS code`);
  }

  // Verify brand_demo_001 is used where brand_id exists in the workflow
  if (nodesText.includes('"brand_id"') && !nodesText.includes('brand_demo_001')) {
    console.error(`[FAIL] n8_unified_callback_approval_gate.workflow.json defines brand_id but brand_demo_001 is missing`);
    failed = true;
  } else {
    console.log(`[PASS] n8 workflow specifies brand_demo_001 where brand_id exists`);
  }

  console.log(`[PASS] n8_unified_callback_approval_gate.workflow.json parses as valid JSON and matches safety rules`);

} catch (err) {
  console.error(`[FAIL] Error parsing n8_unified_callback_approval_gate.workflow.json: ${err.message}`);
  failed = true;
}

// Validate Phase N9 files
console.log('--- STARTING PHASE N9 VALIDATION CHECKS ---');
const n9Dir = path.join(baseDir, 'examples/n8n/n9');
const n9RetryPoliciesDir = path.join(n9Dir, 'retry_policies');
const n9LogEntriesDir = path.join(n9Dir, 'log_entries');
const n9DeadLettersDir = path.join(n9Dir, 'dead_letters');
const n9ExpectedOutputsDir = path.join(n9Dir, 'expected_outputs');

const n9ErrorFiles = [
  'error_http_error.json',
  'error_timeout.json',
  'error_validation_error.json',
  'error_unsupported_event_type.json',
  'error_schema_mismatch.json'
];

const n9PolicyFiles = [
  'default_retry_policy.json',
  'no_retry_policy.json'
];

const n9LogFiles = [
  'execution_log_success.json',
  'execution_log_retry_scheduled.json',
  'execution_log_dead_lettered.json'
];

const n9DeadLetterFiles = [
  'dead_letter_timeout_exhausted.json',
  'dead_letter_schema_mismatch.json'
];

const n9ExpectedOutputFiles = [
  'retry_scheduled_expected_output.json',
  'dead_letter_expected_output.json',
  'validation_error_expected_output.json',
  'unsupported_event_expected_output.json'
];

const allowedErrorTypes = [
  'http_error',
  'timeout',
  'validation_error',
  'unsupported_event_type',
  'module_unavailable',
  'schema_mismatch',
  'unknown_error'
];

const allowedRetryDecisions = [
  'retry_scheduled',
  'no_retry',
  'exhausted_to_dead_letter',
  'manual_review_required'
];

// E. Secrets / forbidden text scanning
const n9WorkflowPath = path.join(baseDir, '../n8n-workflows/n9_error_retry_logging.workflow.json');
const n9FilesToScan = [
  path.join(baseDir, 'error_handling_retry_logging_contract.md'),
  path.join(baseDir, '../docs/pc2/phase_n9_error_retry_logging.md'),
  n9WorkflowPath
];
n9ErrorFiles.forEach(f => n9FilesToScan.push(path.join(n9Dir, f)));
n9PolicyFiles.forEach(f => n9FilesToScan.push(path.join(n9RetryPoliciesDir, f)));
n9LogFiles.forEach(f => n9FilesToScan.push(path.join(n9LogEntriesDir, f)));
n9DeadLetterFiles.forEach(f => n9FilesToScan.push(path.join(n9DeadLettersDir, f)));
n9ExpectedOutputFiles.forEach(f => n9FilesToScan.push(path.join(n9ExpectedOutputsDir, f)));

n9FilesToScan.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lowerContent = content.toLowerCase();
    const baseName = path.basename(filePath);
    
    // Brand checks
    if (lowerContent.includes('vicuon') || content.includes('Vị Cuốn')) {
      console.error(`[FAIL] File '${baseName}' contains forbidden brand Vị Cuốn / vicuon`);
      failed = true;
    }
    // Production domain checks
    if (lowerContent.includes('thecoreagency.com')) {
      console.error(`[FAIL] File '${baseName}' contains production domain target thecoreagency.com`);
      failed = true;
    }
    // Api key checks
    if (lowerContent.includes('api_key')) {
      console.error(`[FAIL] File '${baseName}' contains forbidden term 'api_key'`);
      failed = true;
    }
    // Secret checks (only for json/workflow to avoid markdown rule discussions)
    if ((filePath.endsWith('.json') || filePath.endsWith('.workflow.json')) && lowerContent.includes('secret')) {
      console.error(`[FAIL] JSON/Workflow File '${baseName}' contains forbidden term 'secret'`);
      failed = true;
    }
    // Suspicious token check (allow mock_token or safe tokens)
    if (lowerContent.includes('token') && (filePath.endsWith('.json') || filePath.endsWith('.workflow.json'))) {
      if (!lowerContent.includes('mock_token') && !lowerContent.includes('workflow_engine')) {
        console.error(`[FAIL] JSON/Workflow File '${baseName}' contains suspicious token term`);
        failed = true;
      }
    }
  }
});

// A. Validate error examples
n9ErrorFiles.forEach(file => {
  const filePath = path.join(n9Dir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] N9 error file parses as JSON: n9/${file}`);

    // Required fields check
    const required = [
      'contract_version', 'request_id', 'event_type', 'brand_id', 'campaign_id',
      'module_id', 'error_type', 'error_code', 'error_message', 'retryable',
      'attempt', 'max_attempts', 'next_action', 'timestamp', 'source', 'metadata'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N9 error ${file} is missing field '${f}'`);
        failed = true;
      }
    });

    if (parsed.brand_id && parsed.brand_id !== 'brand_demo_001') {
      console.error(`[FAIL] N9 error ${file} brand_id must be 'brand_demo_001', found '${parsed.brand_id}'`);
      failed = true;
    }

    if (!allowedErrorTypes.includes(parsed.error_type)) {
      console.error(`[FAIL] N9 error ${file} has unsupported error_type '${parsed.error_type}'`);
      failed = true;
    }
    
    // Source check: should be mock/local only, not production
    if (parsed.source.includes('production') || parsed.source.includes('prod')) {
      console.error(`[FAIL] N9 error ${file} source is production-like: '${parsed.source}'`);
      failed = true;
    }
  } catch (err) {
    console.error(`[FAIL] Error validating N9 error file ${file}: ${err.message}`);
    failed = true;
  }
});

// A. Validate policies
n9PolicyFiles.forEach(file => {
  const filePath = path.join(n9RetryPoliciesDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] N9 retry policy parses as JSON: n9/retry_policies/${file}`);

    const required = [
      'retry_policy_id', 'max_attempts', 'backoff_strategy', 'retryable_error_types',
      'non_retryable_error_types', 'on_exhausted', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N9 retry policy ${file} is missing field '${f}'`);
        failed = true;
      }
    });
  } catch (err) {
    console.error(`[FAIL] Error validating N9 retry policy ${file}: ${err.message}`);
    failed = true;
  }
});

// A. Validate logs
n9LogFiles.forEach(file => {
  const filePath = path.join(n9LogEntriesDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] N9 log parses as JSON: n9/log_entries/${file}`);

    const required = [
      'log_id', 'request_id', 'event_type', 'module_id', 'phase', 'status',
      'message', 'attempt', 'timestamp', 'source', 'metadata'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N9 execution log ${file} is missing field '${f}'`);
        failed = true;
      }
    });
    
    if (parsed.source.includes('production') || parsed.source.includes('prod')) {
      console.error(`[FAIL] N9 execution log ${file} source is production-like: '${parsed.source}'`);
      failed = true;
    }
  } catch (err) {
    console.error(`[FAIL] Error validating N9 execution log ${file}: ${err.message}`);
    failed = true;
  }
});

// A. Validate dead letter files
n9DeadLetterFiles.forEach(file => {
  const filePath = path.join(n9DeadLettersDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] N9 dead letter parses as JSON: n9/dead_letters/${file}`);

    const required = [
      'dead_letter_id', 'request_id', 'event_type', 'module_id', 'error',
      'attempts', 'final_status', 'source', 'created_at', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N9 dead letter ${file} is missing field '${f}'`);
        failed = true;
      }
    });

    if (parsed.error) {
      const errorRequired = [
        'contract_version', 'request_id', 'event_type', 'brand_id', 'campaign_id',
        'module_id', 'error_type', 'error_code', 'error_message', 'retryable',
        'attempt', 'max_attempts', 'next_action', 'timestamp', 'source', 'metadata'
      ];
      errorRequired.forEach(ef => {
        if (parsed.error[ef] === undefined) {
          console.error(`[FAIL] N9 dead letter ${file} error object is missing field '${ef}'`);
          failed = true;
        }
      });
      if (parsed.error.brand_id && parsed.error.brand_id !== 'brand_demo_001') {
        console.error(`[FAIL] N9 dead letter ${file} error brand_id must be 'brand_demo_001'`);
        failed = true;
      }
    }
    
    if (parsed.source.includes('production') || parsed.source.includes('prod')) {
      console.error(`[FAIL] N9 dead letter ${file} source is production-like: '${parsed.source}'`);
      failed = true;
    }
  } catch (err) {
    console.error(`[FAIL] Error validating N9 dead letter ${file}: ${err.message}`);
    failed = true;
  }
});

// A. Validate expected output files
n9ExpectedOutputFiles.forEach(file => {
  const filePath = path.join(n9ExpectedOutputsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] N9 expected output parses as JSON: n9/expected_outputs/${file}`);

    const required = [
      'request_id', 'event_type', 'module_id', 'error_type', 'retry_decision',
      'attempt', 'max_attempts', 'execution_log', 'dead_letter_preview',
      'error_callback_preview', 'source', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N9 expected output ${file} is missing field '${f}'`);
        failed = true;
      }
    });

    if (!allowedRetryDecisions.includes(parsed.retry_decision)) {
      console.error(`[FAIL] N9 expected output ${file} has unsupported retry_decision '${parsed.retry_decision}'`);
      failed = true;
    }

    if (parsed.source !== 'n8n_n9_error_retry_logging_mock') {
      console.error(`[FAIL] N9 expected output ${file} source must be 'n8n_n9_error_retry_logging_mock'`);
      failed = true;
    }
    
    // For dead_letter expected output, verify dead_letter_preview.error exists and contains normalized error fields.
    if (parsed.retry_decision === 'exhausted_to_dead_letter' || parsed.retry_decision === 'manual_review_required') {
      if (!parsed.dead_letter_preview || !parsed.dead_letter_preview.error) {
        console.error(`[FAIL] N9 expected output ${file} has retry_decision '${parsed.retry_decision}' but is missing dead_letter_preview.error object`);
        failed = true;
      } else {
        const errorRequired = [
          'contract_version', 'request_id', 'event_type', 'brand_id', 'campaign_id',
          'module_id', 'error_type', 'error_code', 'error_message', 'retryable',
          'attempt', 'max_attempts', 'next_action', 'timestamp', 'source', 'metadata'
        ];
        errorRequired.forEach(ef => {
          if (parsed.dead_letter_preview.error[ef] === undefined) {
            console.error(`[FAIL] N9 expected output ${file} dead_letter_preview.error is missing field '${ef}'`);
            failed = true;
          }
        });
      }
    }
  } catch (err) {
    console.error(`[FAIL] Error validating N9 expected output ${file}: ${err.message}`);
    failed = true;
  }
});

// B, C, D. Validate Workflow
try {
  const content = fs.readFileSync(n9WorkflowPath, 'utf8');
  if (content.includes('"type": "n8n-nodes-base.httpRequest"') && content.includes('"url"')) {
    console.error(`[FAIL] n9_error_retry_logging.workflow.json contains an HTTP request node making calls`);
    failed = true;
  }
  if (/credentials/i.test(content) && !content.includes('workflow_engine')) {
    console.error(`[FAIL] n9_error_retry_logging.workflow.json contains credentials reference`);
    failed = true;
  }

  const parsed = JSON.parse(content);
  console.log(`[PASS] n9_error_retry_logging.workflow.json parses as JSON`);

  const nodesText = JSON.stringify(parsed.nodes);

  // Check required output fields are referenced inside the nodes
  const requiredOutputFields = [
    'request_id', 'event_type', 'module_id', 'error_type', 'retry_decision',
    'attempt', 'max_attempts', 'execution_log', 'dead_letter_preview',
    'error_callback_preview', 'source', 'notes'
  ];
  requiredOutputFields.forEach(field => {
    if (!nodesText.includes(`"${field}"`)) {
      console.error(`[FAIL] n9_error_retry_logging.workflow.json does not contain required output field '${field}' inside nodes`);
      failed = true;
    }
  });

  // B. Workflow retry decisions
  const expectedRetryDecisions = [
    'retry_scheduled',
    'no_retry',
    'exhausted_to_dead_letter',
    'manual_review_required'
  ];
  expectedRetryDecisions.forEach(decision => {
    if (!content.includes(decision)) {
      console.error(`[FAIL] n9_error_retry_logging.workflow.json does not contain retry_decision '${decision}'`);
      failed = true;
    } else {
      console.log(`[PASS] n9 workflow handles retry_decision: ${decision}`);
    }
  });

  // C. Validate workflow error types
  const expectedWorkflowErrorTypes = [
    'unknown_error',
    'unsupported_event_type',
    'validation_error'
  ];
  expectedWorkflowErrorTypes.forEach(errType => {
    if (!content.includes(errType)) {
      console.error(`[FAIL] n9_error_retry_logging.workflow.json does not contain error_type '${errType}'`);
      failed = true;
    } else {
      console.log(`[PASS] n9 workflow handles error_type: ${errType}`);
    }
  });

  // D. Verify that the workflow includes/represents the source identifier
  if (!nodesText.includes('n8n_n9_error_retry_logging_mock')) {
    console.error(`[FAIL] n9_error_retry_logging.workflow.json is missing source identifier 'n8n_n9_error_retry_logging_mock'`);
    failed = true;
  } else {
    console.log(`[PASS] n9 workflow contains source identifier`);
  }

} catch (err) {
  console.error(`[FAIL] Error parsing n9_error_retry_logging.workflow.json: ${err.message}`);
  failed = true;
}

// Validate Phase N10 files
console.log('--- STARTING PHASE N10 VALIDATION CHECKS ---');
const n10Dir = path.join(baseDir, 'examples/n8n/n10');
const n10DashboardDir = path.join(n10Dir, 'dashboard');
const n10ExpectedOutputsDir = path.join(n10Dir, 'expected_outputs');

const n10ModuleHealthFiles = [
  'module_health_creative_asset_comfyui.json',
  'module_health_content_pack_generator.json',
  'module_health_ads_pack_generator.json',
  'module_health_crm_followup_generator.json',
  'module_health_analytics_report_generator.json'
];

const n10AggregateFiles = [
  'health_aggregate_all_healthy.json',
  'health_aggregate_partial_ready.json',
  'health_aggregate_blocked.json'
];

const n10DashboardFiles = [
  'dashboard_all_healthy.json',
  'dashboard_partial_ready.json',
  'dashboard_blocked.json'
];

const n10ExpectedOutputFiles = [
  'health_check_all_healthy_expected_output.json',
  'health_check_partial_ready_expected_output.json',
  'health_check_blocked_expected_output.json'
];

const allowedHealthStatuses = ['healthy', 'degraded', 'unavailable', 'unknown'];
const allowedReadinessStatuses = ['ready_for_mock_run', 'partially_ready', 'blocked'];

// Secrets & Forbidden Text Scan for N10 Files
const n10WorkflowPath = path.join(baseDir, '../n8n-workflows/n10_module_health_check.workflow.json');
const n10FilesToScan = [
  path.join(baseDir, 'module_health_check_contract.md'),
  path.join(baseDir, '../docs/pc2/phase_n10_module_health_check.md'),
  n10WorkflowPath
];
n10ModuleHealthFiles.forEach(f => n10FilesToScan.push(path.join(n10Dir, f)));
n10AggregateFiles.forEach(f => n10FilesToScan.push(path.join(n10Dir, f)));
n10DashboardFiles.forEach(f => n10FilesToScan.push(path.join(n10DashboardDir, f)));
n10ExpectedOutputFiles.forEach(f => n10FilesToScan.push(path.join(n10ExpectedOutputsDir, f)));

n10FilesToScan.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lowerContent = content.toLowerCase();
    const baseName = path.basename(filePath);
    
    // Brand checks
    if (lowerContent.includes('vicuon') || content.includes('Vị Cuốn')) {
      console.error(`[FAIL] N10 File '${baseName}' contains forbidden brand Vị Cuốn / vicuon`);
      failed = true;
    }
    // Production domain checks
    if (lowerContent.includes('thecoreagency.com')) {
      console.error(`[FAIL] N10 File '${baseName}' contains production domain target thecoreagency.com`);
      failed = true;
    }
    // Api key checks
    if (lowerContent.includes('api_key')) {
      console.error(`[FAIL] N10 File '${baseName}' contains forbidden term 'api_key'`);
      failed = true;
    }
    // Secret checks
    if ((filePath.endsWith('.json') || filePath.endsWith('.workflow.json')) && lowerContent.includes('secret')) {
      console.error(`[FAIL] N10 JSON/Workflow File '${baseName}' contains forbidden term 'secret'`);
      failed = true;
    }
    // Suspicious token check
    if (lowerContent.includes('token') && (filePath.endsWith('.json') || filePath.endsWith('.workflow.json'))) {
      if (!lowerContent.includes('mock_token') && !lowerContent.includes('workflow_engine')) {
        console.error(`[FAIL] N10 JSON/Workflow File '${baseName}' contains suspicious token term`);
        failed = true;
      }
    }
  }
});

// A. Validate Individual Module Health JSON
const n10ExpectedEndpoints = {
  'creative_asset_comfyui': 'http://localhost:8188/health',
  'content_pack_generator': 'http://localhost:8191/health',
  'ads_pack_generator': 'http://localhost:8192/health',
  'crm_followup_generator': 'http://localhost:8193/health',
  'analytics_report_generator': 'http://localhost:8194/health'
};

const validatedN10ModuleIds = new Set();
const validatedN10Endpoints = new Set();

n10ModuleHealthFiles.forEach(file => {
  const filePath = path.join(n10Dir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] N10 health file parses as JSON: n10/${file}`);

    const required = [
      'contract_version', 'module_id', 'module_name', 'status', 'mode',
      'version', 'uptime_mock', 'local_base_url', 'endpoints',
      'last_checked_at', 'source', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N10 health file ${file} is missing field '${f}'`);
        failed = true;
      }
    });

    if (!allowedHealthStatuses.includes(parsed.status)) {
      console.error(`[FAIL] N10 health file ${file} has invalid status '${parsed.status}'`);
      failed = true;
    }

    // A. Allowed modes check
    const allowedModes = ['mock', 'local_stub', 'real_disabled'];
    if (!allowedModes.includes(parsed.mode)) {
      console.error(`[FAIL] N10 health file ${file} has invalid mode '${parsed.mode}'`);
      failed = true;
    }

    if (parsed.local_base_url.includes('thecoreagency.com')) {
      console.error(`[FAIL] N10 health file ${file} local_base_url points to production: ${parsed.local_base_url}`);
      failed = true;
    }

    // B. Exact module/endpoint mappings
    const expectedEp = n10ExpectedEndpoints[parsed.module_id];
    if (!expectedEp) {
      console.error(`[FAIL] N10 health file ${file} contains unexpected module_id '${parsed.module_id}'`);
      failed = true;
    } else {
      const derivedEp = parsed.local_base_url + '/health';
      if (derivedEp !== expectedEp) {
        console.error(`[FAIL] N10 health file ${file} module '${parsed.module_id}' has incorrect endpoint: expected '${expectedEp}', found '${derivedEp}'`);
        failed = true;
      }
    }

    if (parsed.module_id) {
      if (validatedN10ModuleIds.has(parsed.module_id)) {
        console.error(`[FAIL] Duplicate module_id '${parsed.module_id}' found in health files`);
        failed = true;
      }
      validatedN10ModuleIds.add(parsed.module_id);
    }
    if (parsed.local_base_url) {
      const derivedEp = parsed.local_base_url + '/health';
      if (validatedN10Endpoints.has(derivedEp)) {
        console.error(`[FAIL] Duplicate health endpoint '${derivedEp}' found in health files`);
        failed = true;
      }
      validatedN10Endpoints.add(derivedEp);
    }

  } catch (err) {
    console.error(`[FAIL] Error validating N10 health file ${file}: ${err.message}`);
    failed = true;
  }
});

// Check that all 5 required modules/endpoints are present in health examples
Object.keys(n10ExpectedEndpoints).forEach(mId => {
  if (!validatedN10ModuleIds.has(mId)) {
    console.error(`[FAIL] Missing required N10 module: ${mId}`);
    failed = true;
  }
  const ep = n10ExpectedEndpoints[mId];
  if (!validatedN10Endpoints.has(ep)) {
    console.error(`[FAIL] Missing required N10 health endpoint: ${ep}`);
    failed = true;
  }
});

// B. Validate Aggregates
n10AggregateFiles.forEach(file => {
  const filePath = path.join(n10Dir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] N10 aggregate parses as JSON: n10/${file}`);

    const required = [
      'contract_version', 'overall_status', 'checked_at', 'modules',
      'healthy_count', 'degraded_count', 'unavailable_count', 'unknown_count',
      'readiness_status', 'blocking_modules', 'source', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N10 aggregate file ${file} is missing field '${f}'`);
        failed = true;
      }
    });

    if (!allowedReadinessStatuses.includes(parsed.readiness_status)) {
      console.error(`[FAIL] N10 aggregate file ${file} has invalid readiness_status '${parsed.readiness_status}'`);
      failed = true;
    }

    // B. Validate exact module/endpoint mapping in aggregate modules list
    if (parsed.modules) {
      if (!Array.isArray(parsed.modules)) {
        console.error(`[FAIL] N10 aggregate file ${file} modules is not an array`);
        failed = true;
      } else {
        const seenModules = new Set();
        parsed.modules.forEach(m => {
          if (!m.module_id || !n10ExpectedEndpoints[m.module_id]) {
            console.error(`[FAIL] N10 aggregate file ${file} has unexpected module_id: '${m.module_id}'`);
            failed = true;
          } else {
            seenModules.add(m.module_id);
            const expectedEp = n10ExpectedEndpoints[m.module_id];
            const derivedEp = m.local_base_url + '/health';
            if (derivedEp !== expectedEp) {
              console.error(`[FAIL] N10 aggregate file ${file} module '${m.module_id}' has incorrect endpoint: expected '${expectedEp}', found '${derivedEp}'`);
              failed = true;
            }
            // A. Allowed modes check in aggregate
            const allowedModes = ['mock', 'local_stub', 'real_disabled'];
            if (m.mode && !allowedModes.includes(m.mode)) {
              console.error(`[FAIL] N10 aggregate file ${file} module '${m.module_id}' has invalid mode '${m.mode}'`);
              failed = true;
            }
          }
        });
        Object.keys(n10ExpectedEndpoints).forEach(mId => {
          if (!seenModules.has(mId)) {
            console.error(`[FAIL] N10 aggregate file ${file} is missing module: ${mId}`);
            failed = true;
          }
        });
      }
    }

    // C. Aggregate count consistency
    if (parsed.healthy_count + parsed.degraded_count + parsed.unavailable_count + parsed.unknown_count !== parsed.modules.length) {
      console.error(`[FAIL] N10 aggregate ${file} count mismatch: healthy_count + degraded_count + unavailable_count + unknown_count !== modules.length`);
      failed = true;
    }
    if (!Array.isArray(parsed.blocking_modules)) {
      console.error(`[FAIL] N10 aggregate ${file} blocking_modules is not an array`);
      failed = true;
    }
    if (parsed.readiness_status === 'ready_for_mock_run') {
      if (parsed.unavailable_count !== 0 || parsed.blocking_modules.length !== 0) {
        console.error(`[FAIL] N10 aggregate ${file} is ready_for_mock_run but has unavailable modules or blocking modules`);
        failed = true;
      }
    } else if (parsed.readiness_status === 'blocked') {
      if (parsed.blocking_modules.length === 0) {
        console.error(`[FAIL] N10 aggregate ${file} is blocked but blocking_modules is empty`);
        failed = true;
      }
    } else if (parsed.readiness_status === 'partially_ready') {
      if (parsed.degraded_count === 0 && parsed.unavailable_count === 0) {
        console.error(`[FAIL] N10 aggregate ${file} is partially_ready but has no degraded or unavailable modules`);
        failed = true;
      }
    }

  } catch (err) {
    console.error(`[FAIL] Error validating N10 aggregate file ${file}: ${err.message}`);
    failed = true;
  }
});

// C. Validate Dashboards
n10DashboardFiles.forEach(file => {
  const filePath = path.join(n10DashboardDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] N10 dashboard parses as JSON: n10/dashboard/${file}`);

    const required = [
      'dashboard_id', 'generated_at', 'overall_status', 'cards',
      'module_table', 'warnings', 'next_actions', 'source', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N10 dashboard file ${file} is missing field '${f}'`);
        failed = true;
      }
    });
  } catch (err) {
    console.error(`[FAIL] Error validating N10 dashboard file ${file}: ${err.message}`);
    failed = true;
  }
});

// D. Validate Expected Outputs
n10ExpectedOutputFiles.forEach(file => {
  const filePath = path.join(n10ExpectedOutputsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    console.log(`[PASS] N10 expected output parses as JSON: n10/expected_outputs/${file}`);

    const required = [
      'contract_version', 'overall_status', 'readiness_status', 'modules',
      'blocking_modules', 'dashboard_data', 'source', 'notes'
    ];
    required.forEach(f => {
      if (parsed[f] === undefined) {
        console.error(`[FAIL] N10 expected output file ${file} is missing field '${f}'`);
        failed = true;
      }
    });

    if (parsed.source !== 'n8n_n10_module_health_check_mock') {
      console.error(`[FAIL] N10 expected output file ${file} source must be 'n8n_n10_module_health_check_mock', found '${parsed.source}'`);
      failed = true;
    }

    // B. Validate exact module/endpoint mapping in expected outputs
    if (parsed.modules) {
      if (!Array.isArray(parsed.modules)) {
        console.error(`[FAIL] N10 expected output file ${file} modules is not an array`);
        failed = true;
      } else {
        const seenModules = new Set();
        parsed.modules.forEach(m => {
          if (!m.module_id || !n10ExpectedEndpoints[m.module_id]) {
            console.error(`[FAIL] N10 expected output file ${file} has unexpected module_id: '${m.module_id}'`);
            failed = true;
          } else {
            seenModules.add(m.module_id);
            const expectedEp = n10ExpectedEndpoints[m.module_id];
            if (m.endpoint !== expectedEp) {
              console.error(`[FAIL] N10 expected output file ${file} module '${m.module_id}' has incorrect endpoint: expected '${expectedEp}', found '${m.endpoint}'`);
              failed = true;
            }
          }
        });
        Object.keys(n10ExpectedEndpoints).forEach(mId => {
          if (!seenModules.has(mId)) {
            console.error(`[FAIL] N10 expected output file ${file} is missing module: ${mId}`);
            failed = true;
          }
        });
      }
    }

    if (parsed.dashboard_data && parsed.dashboard_data.module_table) {
      const table = parsed.dashboard_data.module_table;
      if (!Array.isArray(table)) {
        console.error(`[FAIL] N10 expected output file ${file} dashboard_data.module_table is not an array`);
        failed = true;
      } else {
        const seenModules = new Set();
        table.forEach(m => {
          if (!m.module_id || !n10ExpectedEndpoints[m.module_id]) {
            console.error(`[FAIL] N10 expected output file ${file} dashboard_data.module_table has unexpected module_id: '${m.module_id}'`);
            failed = true;
          } else {
            seenModules.add(m.module_id);
            const expectedEp = n10ExpectedEndpoints[m.module_id];
            if (m.endpoint !== expectedEp) {
              console.error(`[FAIL] N10 expected output file ${file} dashboard_data.module_table module '${m.module_id}' has incorrect endpoint: expected '${expectedEp}', found '${m.endpoint}'`);
              failed = true;
            }
          }
        });
        Object.keys(n10ExpectedEndpoints).forEach(mId => {
          if (!seenModules.has(mId)) {
            console.error(`[FAIL] N10 expected output file ${file} dashboard_data.module_table is missing module: ${mId}`);
            failed = true;
          }
        });
      }
    }

  } catch (err) {
    console.error(`[FAIL] Error validating N10 expected output file ${file}: ${err.message}`);
    failed = true;
  }
});

// E. Validate Workflow
try {
  const content = fs.readFileSync(n10WorkflowPath, 'utf8');
  if (content.includes('"type": "n8n-nodes-base.httpRequest"') && !content.includes('"url"')) {
    console.warn(`[WARN] n10 workflow contains HTTP node but no URL parameter`);
  }
  if (/credentials/i.test(content) && !content.includes('workflow_engine')) {
    console.error(`[FAIL] n10_module_health_check.workflow.json contains credentials reference`);
    failed = true;
  }

  const parsed = JSON.parse(content);
  console.log(`[PASS] n10_module_health_check.workflow.json parses as JSON`);

  // Verify all 5 localhost endpoints are present in the workflow
  const expectedEndpoints = [
    'http://localhost:8188/health',
    'http://localhost:8191/health',
    'http://localhost:8192/health',
    'http://localhost:8193/health',
    'http://localhost:8194/health'
  ];
  expectedEndpoints.forEach(ep => {
    if (!content.includes(ep)) {
      console.error(`[FAIL] n10 workflow is missing localhost endpoint: ${ep}`);
      failed = true;
    } else {
      console.log(`[PASS] n10 workflow contains health endpoint: ${ep}`);
    }
  });

  const nodesText = JSON.stringify(parsed.nodes);

  // Verify workflow contains required output fields
  const requiredOutputFields = [
    'contract_version', 'overall_status', 'readiness_status',
    'modules', 'blocking_modules', 'dashboard_data', 'source', 'notes'
  ];
  requiredOutputFields.forEach(field => {
    if (!nodesText.includes(`"${field}"`)) {
      console.error(`[FAIL] n10 workflow does not contain required output field '${field}' inside nodes`);
      failed = true;
    }
  });

  // Verify source identifier exists in nodes
  if (!nodesText.includes('n8n_n10_module_health_check_mock')) {
    console.error(`[FAIL] n10 workflow is missing source identifier 'n8n_n10_module_health_check_mock'`);
    failed = true;
  } else {
    console.log(`[PASS] n10 workflow contains source identifier`);
  }

  // D. Workflow synchronization checks
  const syncNodeNames = ["Merge Health Results", "Wait for Health Results", "Synchronize Health Checks", "Join Health Results"];
  const syncNodes = parsed.nodes.filter(n => syncNodeNames.includes(n.name));
  if (syncNodes.length === 0) {
    console.error(`[FAIL] n10 workflow is missing a synchronization node (e.g., "Merge Health Results")`);
    failed = true;
  } else {
    console.log(`[PASS] n10 workflow contains synchronization node: ${syncNodes.map(n => n.name).join(', ')}`);
  }

  const httpNodeNames = [
    "HTTP: ComfyUI Health",
    "HTTP: Content Health",
    "HTTP: Ads Health",
    "HTTP: CRM Health",
    "HTTP: Analytics Health"
  ];
  const downstreamAggNodes = [
    "Code: Normalize Health Results",
    "Code: Build Aggregate Readiness Report",
    "Code: Build Dashboard Data"
  ];

  httpNodeNames.forEach(httpNode => {
    const conn = parsed.connections[httpNode];
    if (conn && conn.main) {
      conn.main.forEach(port => {
        port.forEach(target => {
          if (downstreamAggNodes.includes(target.node)) {
            console.error(`[FAIL] HTTP node '${httpNode}' connects directly to downstream aggregation node '${target.node}' without synchronization`);
            failed = true;
          }
        });
      });
    }
  });

  httpNodeNames.forEach(httpNode => {
    const conn = parsed.connections[httpNode];
    let connectsToSync = false;
    if (conn && conn.main) {
      conn.main.forEach(port => {
        port.forEach(target => {
          if (syncNodeNames.includes(target.node)) {
            connectsToSync = true;
          }
        });
      });
    }
    if (!connectsToSync) {
      console.error(`[FAIL] HTTP node '${httpNode}' does not connect to a synchronization node`);
      failed = true;
    } else {
      console.log(`[PASS] HTTP node '${httpNode}' connects to synchronization node`);
    }
  });

  syncNodes.forEach(syncNode => {
    const conn = parsed.connections[syncNode.name];
    let connectsToNormalize = false;
    if (conn && conn.main) {
      conn.main.forEach(port => {
        port.forEach(target => {
          if (target.node === "Code: Normalize Health Results") {
            connectsToNormalize = true;
          }
        });
      });
    }
    if (!connectsToNormalize) {
      console.error(`[FAIL] Synchronization node '${syncNode.name}' does not connect to 'Code: Normalize Health Results'`);
      failed = true;
    } else {
      console.log(`[PASS] Synchronization node '${syncNode.name}' connects to 'Code: Normalize Health Results'`);
    }
  });

} catch (err) {
  console.error(`[FAIL] Error parsing n10 workflow: ${err.message}`);
  failed = true;
}

if (failed) {
  console.error('--- CONTRACT VALIDATION CHECKS FAILED ---');
  process.exit(1);
} else {
  console.log('--- ALL CONTRACT VALIDATION CHECKS PASSED SUCCESSFULLY ---');
  process.exit(0);
}




