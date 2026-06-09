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

if (failed) {
  console.error('--- CONTRACT VALIDATION CHECKS FAILED ---');
  process.exit(1);
} else {
  console.log('--- ALL CONTRACT VALIDATION CHECKS PASSED SUCCESSFULLY ---');
  process.exit(0);
}



