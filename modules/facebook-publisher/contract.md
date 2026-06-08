# Facebook Publisher Contract

This document specifies the integration contract, inputs, outputs, and safety policies for the Facebook Publisher Module.

## 1. Input Specification
Conforms to `n8n_to_module_request.schema.json`.

Key payload fields:
- `message`: String. Post text content.
- `media_urls`: Array of image/video URLs to attach.
- `schedule_timestamp`: Integer. Unix epoch timestamp for scheduled post (optional).

## 2. Output Specification
Conforms to `module_to_core_callback.schema.json`.

Key payload fields:
- `fb_post_id`: String. Identifier of the published post on Facebook.
- `permalink_url`: String. Direct link to the post.
- `status`: String (`SUCCESS` or `FAILED`).

## 3. Safety Rules
- **No Auto Publish without Approval**: If `safety.allow_auto_publish` is `false` or `safety.final_approval_granted` is `false`, the module must reject the action and callback with status `REJECTED_BY_SAFETY`.
- **Allowed actions in V1**: Create drafts, schedule posts, publish to target test page.
- **Forbidden actions in V1**: Modify existing posts, delete posts, moderate user comments.
