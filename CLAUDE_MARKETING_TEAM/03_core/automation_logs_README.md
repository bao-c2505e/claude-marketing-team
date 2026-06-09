# Automation Logs — Phase 14 Foundation

## Overview

Phase 14 thêm **Automation Logs** tab vào The Core Agency workspace. Module này ghi nhận, hiển thị, lọc và quản lý log automation nội bộ ở chế độ local/mock. Không kết nối API thật, không gọi webhook thật, không retry thật.

---

## Files

| File | Vai trò |
|---|---|
| `src/types/core.ts` | Types Phase 14: `AutomationLogType`, `AutomationLogSource`, `AutomationLogSeverity`, `AutomationLogStatus`, `LocalAutomationLog` |
| `src/lib/core/automationLogs.ts` | Store, seed data (9 logs), display maps, CRUD helpers, stats |
| `src/components/core/AutomationLogsTab.tsx` | UI component: list, filter, stats, expand, actions |

---

## Types (core.ts)

```typescript
export type AutomationLogType =
  | 'workflow' | 'connector' | 'module' | 'webhook'
  | 'approval' | 'export' | 'report' | 'safety' | 'error' | 'system';

export type AutomationLogSource =
  | 'core' | 'n8n' | 'module' | 'connector'
  | 'webhook' | 'user_action' | 'system';

export type AutomationLogSeverity = 'info' | 'warning' | 'error' | 'success';

export type AutomationLogStatus =
  | 'recorded' | 'reviewed' | 'ignored' | 'resolved' | 'failed';

export interface LocalAutomationLog {
  id: string;
  log_type: AutomationLogType;
  source: AutomationLogSource;
  severity: AutomationLogSeverity;
  status: AutomationLogStatus;
  title: string;
  message: string;
  payload_preview: string | null;
  related_connector_id: string | null;
  related_module_id: string | null;
  related_event_id: string | null;
  related_client_id: string | null;
  related_brand_id: string | null;
  related_campaign_id: string | null;
  related_content_item_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  resolved_at: string | null;
}
```

---

## Seed Logs (9 logs)

| # | Type | Severity | Title |
|---|---|---|---|
| log-001 | system | info | Phase 14 Initialized |
| log-002 | module | success | Content Generation Mock Completed |
| log-003 | approval | info | Approval Submitted (3 items) |
| log-004 | connector | info | Connector Health Check (reviewed) |
| log-005 | report | info | Analytics Report Generated |
| log-006 | export | success | Export Pack Generated (resolved) |
| log-007 | error | error | ComfyUI Connector Not Configured |
| log-008 | safety | warning | Publish Action Blocked |
| log-009 | webhook | info | Webhook Ping Received |

---

## Features

### Stats Row
- Total Logs
- Warnings
- Errors
- Unresolved (recorded + failed)
- Success

### Filters
- Search text (title / message / payload)
- Log Type
- Source
- Severity
- Status

### Log List
- Expand/collapse detail per row
- Severity icon + color badge
- Type + Source chips
- Status badge
- Timestamp

### Expanded Detail
- Full message
- Payload preview (JSON pretty-print)
- Related references (connector / module / event / client / brand / campaign)
- Timestamps: created / reviewed / resolved
- Actions (owner / manager only): Mark Reviewed, Mark Resolved, Ignore

### Create Mock Log
- 5 templates: Connector Health Check / Content Generation / Safety Gate Warning / Approval Submitted / System Error
- Owner / manager only
- No real action, no real API call

---

## Permission Integration

| Permission | Roles | Description |
|---|---|---|
| `canViewAutomationLogs` | owner, manager | See the Automation Logs tab |
| `canManageConnectors` | owner | Can create mock logs + manage status |
| client, viewer | — | Automation Logs tab hidden entirely |

Sidebar button is conditionally rendered:
```tsx
{(user?.role === 'owner' || user?.role === 'manager') && (
  <button onClick={() => setActiveTab('automation-logs')}>
    <Activity /> Automation Logs
    {/* error badge if unresolved errors */}
  </button>
)}
```

Component permission gate:
```tsx
const canView = can.viewAutomationLogs(userRole);
if (!canView) return <PermissionDenied />;
```

---

## Storage

- **Key:** `core_agency_automation_logs_v1`
- **Max:** 200 logs (trimmed on save)
- **Mode:** localStorage only (Phase 14)
- **Supabase:** Phase 15+

---

## Safety Guards

- No real workflow execution
- No real webhook sent or retried
- No external API calls
- No auto-post
- No real ads
- No customer messaging
- No secrets in source
- Safety banner always visible in UI
- Safety disclaimer in footer
- Logs hidden from client/viewer roles

---

## Next Phase

**Phase 15 — Real Supabase Auth + Database Wiring Plan**

When Supabase is wired, `loadAutomationLogData()` / `saveAutomationLogData()` will be replaced with Supabase client calls. The `LocalAutomationLog` type maps directly to the `automation_logs` table in the Phase 2 database schema.
