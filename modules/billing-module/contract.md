# Billing Module Contract

This document specifies the integration contract, inputs, outputs, and safety policies for the Billing Module.

## 1. Input Specification
Conforms to `n8n_to_module_request.schema.json`.

Key payload fields:
- `customer_email`: String.
- `amount`: Integer. Total amount in cents (e.g. 15000 = $150.00).
- `description`: String. Description of the services billed.

## 2. Output Specification
Conforms to `module_to_core_callback.schema.json`.

Key payload fields:
- `invoice_id`: String. External billing platform invoice identifier.
- `payment_link`: String. Web Link for customer checkout.
- `status`: String (`SUCCESS` or `FAILED`).

## 3. Safety Rules
- **No mutations on subscriptions**: Keep all billing operations safe.
- **Approval Check**: If `safety.requires_approval` is `true`, check that `safety.final_approval_granted` is `true` before issuing payment links or generating invoices.
- **Forbidden actions in V1**: Automatic subscription cancellations, triggering direct card debit without user confirmation.
