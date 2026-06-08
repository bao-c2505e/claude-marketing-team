# Inbox Assistant Contract

This document specifies the integration contract, inputs, outputs, and safety policies for the Inbox Assistant Module.

## 1. Input Specification
Conforms to `n8n_to_module_request.schema.json`.

Key payload fields:
- `message_id`: String. Unique incoming message ID.
- `sender_id`: String. Platform-specific customer identifier.
- `message_content`: String. Raw text content of the message.
- `platform`: String (`facebook`, `instagram`, `email`, etc.).

## 2. Output Specification
Conforms to `module_to_core_callback.schema.json`.

Key payload fields:
- `intent`: String. Identified user intent (e.g. `pricing_inquiry`, `complaint`, `greeting`).
- `sentiment`: String (`positive`, `negative`, `neutral`).
- `draft_reply`: String. Contextual reply drafted by AI.
- `status`: String (`SUCCESS` or `FAILED`).

## 3. Safety Rules
- **Drafts only**: The module must only generate draft replies.
- **No direct customer messaging**: If `safety.allow_customer_messaging` is `false` or `safety.final_approval_granted` is `false`, the module MUST NOT send any outgoing messages to customer facing APIs. It should only return the drafted reply payload back to the Core webhook.
- **Forbidden actions in V1**: Sending messages to external messaging APIs (Messenger Graph, SMTP) without final approval.
