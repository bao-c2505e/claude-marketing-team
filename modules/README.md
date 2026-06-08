# Specialist Modules Registry

This directory contains the specialized services (Specialist Modules) servicing The Core Agency ecosystem.

## Module Registry & Status

| Module Name | Folder | Phase Status | Description |
| :--- | :--- | :--- | :--- |
| **ComfyUI Pipeline** | [comfyui-pipeline](file:///c:/Users/DELL/claude-marketing-team/modules/comfyui-pipeline/) | **Local Stub (N3)** | Background pipeline to generate image/video assets. |
| **Canva Connector** | [canva-connector](file:///c:/Users/DELL/claude-marketing-team/modules/canva-connector/) | **Contract Only** | Integrates Canva API to generate and modify branding templates. |
| **Meta Ads Connector** | [meta-ads-connector](file:///c:/Users/DELL/claude-marketing-team/modules/meta-ads-connector/) | **Contract Only** | Automates Meta Graph API campaigns, budget, and targeting. |
| **Facebook Publisher** | [facebook-publisher](file:///c:/Users/DELL/claude-marketing-team/modules/facebook-publisher/) | **Contract Only** | Publishes posts, stories, and media to target fan pages. |
| **Analytics Engine** | [analytics-engine](file:///c:/Users/DELL/claude-marketing-team/modules/analytics-engine/) | **Contract Only** | Reads metrics and compiles analytical KPI reports. |
| **Inbox Assistant** | [inbox-assistant](file:///c:/Users/DELL/claude-marketing-team/modules/inbox-assistant/) | **Contract Only** | Classifies incoming customer queries and drafts AI replies. |
| **Billing Module** | [billing-module](file:///c:/Users/DELL/claude-marketing-team/modules/billing-module/) | **Contract Only** | Generates billing links and synchronizes invoice data. |

---

## General Safety Policies

Every specialist module must strictly enforce these safety rules:
1. **Double Validation**: Check the incoming safety flags (`safety.final_approval_granted`) a second time at the module level.
2. **Stateless Behavior**: Serve the Core database. Never store localized business states or bypass human approval gates.
3. **Sandbox Default**: All external writing integrations (publishing, advertising spend, billing checkout) must default to mock clients or test sandboxes in non-production environments.
