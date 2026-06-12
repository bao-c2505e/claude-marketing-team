# The Core Agency - Communication Contracts

This directory contains the JSON Schema definitions (`draft-07`) defining the standard protocols for communication between Core, n8n, and external modules.

## Schema List

1. **[Core to n8n Event](./core_to_n8n_event.schema.json)**: Trigger events from Core.
2. **[n8n to Module Request](./n8n_to_module_request.schema.json)**: Standard request schema sent by n8n to invoke specific modules.
3. **[Module to Core Callback](./module_to_core_callback.schema.json)**: Asynchronous status/result payload callback to Core.
4. **[Approval Event](./approval_event.schema.json)**: Core event indicating approval state changes from the UI.

## Validation Guide

All schemas should validate payload structures using a standard JSON Schema library (e.g. `ajv` in Node, `jsonschema` in Python).

### Example JSON validation command (Python):
```bash
python -c "import jsonschema, json; jsonschema.validate(instance=json.load(open('example.json')), schema=json.load(open('contracts/core_to_n8n_event.schema.json')))"
```

## Safety Design
Every schema contains a mandatory `safety` object:
```json
"safety": {
  "requires_approval": true,
  "final_approval_granted": false,
  "allow_real_world_action": false,
  "allow_auto_publish": false,
  "allow_ads_spend": false,
  "allow_customer_messaging": false
}
```
Modules and n8n workflows MUST verify this object before running any external APIs that execute real-world operations.
