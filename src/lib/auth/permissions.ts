import type { RoleName } from '../../types/core';

// ---------------------------------------------------------------------------
// Permission matrix — Phase 3 (local mapping, ready for DB-driven Phase 4+)
//
// Hierarchy: owner > manager > creator/client > viewer
// ---------------------------------------------------------------------------

// Each permission key maps to the minimum roles that may perform the action.
const PERMISSION_ROLES: Record<string, RoleName[]> = {
  // --- Clients & Brands ---
  canManageClients:       ['owner', 'manager'],
  canViewClients:         ['owner', 'manager', 'viewer'],
  canManageBrands:        ['owner', 'manager'],
  canViewBrands:          ['owner', 'manager', 'client', 'viewer'],

  // --- Campaigns ---
  canCreateCampaigns:     ['owner', 'manager'],
  canEditCampaigns:       ['owner', 'manager'],
  canViewCampaigns:       ['owner', 'manager', 'client', 'viewer'],
  canDeleteCampaigns:     ['owner'],

  // --- Content ---
  canGenerateContent:     ['owner', 'manager'],
  canEditContent:         ['owner', 'manager'],
  canViewContent:         ['owner', 'manager', 'client', 'viewer'],

  // --- Approval workflow ---
  canRequestApproval:     ['owner', 'manager'],
  canApproveContent:      ['owner', 'manager'],
  canRejectContent:       ['owner', 'manager'],
  canViewApprovals:       ['owner', 'manager', 'client', 'viewer'],

  // --- Publish (hardest gate — real-world action) ---
  canPublishContent:      ['owner'],             // owner-only: real publish requires final approval
  canScheduleContent:     ['owner', 'manager'],

  // --- Assets ---
  canUploadAssets:        ['owner', 'manager'],
  canManageAssets:        ['owner', 'manager'],
  canViewAssets:          ['owner', 'manager', 'client', 'viewer'],

  // --- Reports ---
  canViewReports:         ['owner', 'manager', 'client', 'viewer'],
  canGenerateReports:     ['owner', 'manager'],
  canExportReports:       ['owner', 'manager'],

  // --- Export packs ---
  canExportPacks:         ['owner', 'manager'],
  canViewExportPacks:     ['owner', 'manager', 'client'],

  // --- Connectors & Automation ---
  canManageConnectors:    ['owner'],
  canViewConnectors:      ['owner', 'manager'],
  canViewAutomationLogs:  ['owner', 'manager'],
  canManageWebhooks:      ['owner'],

  // --- Users & Roles ---
  canManageUsers:         ['owner'],
  canAssignRoles:         ['owner'],
  canViewUsers:           ['owner', 'manager'],

  // --- System ---
  canManageSystemSettings: ['owner'],
  canViewAuditLogs:        ['owner'],
};

export type PermissionKey = keyof typeof PERMISSION_ROLES;

// Core permission check
export function hasPermission(role: RoleName | null | undefined, permission: PermissionKey): boolean {
  if (!role) return false;
  const allowed = PERMISSION_ROLES[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

// Convenience helpers — all accept role and return boolean
export const can = {
  manageClients:        (role: RoleName | null) => hasPermission(role, 'canManageClients'),
  viewClients:          (role: RoleName | null) => hasPermission(role, 'canViewClients'),
  manageBrands:         (role: RoleName | null) => hasPermission(role, 'canManageBrands'),
  viewBrands:           (role: RoleName | null) => hasPermission(role, 'canViewBrands'),
  createCampaigns:      (role: RoleName | null) => hasPermission(role, 'canCreateCampaigns'),
  editCampaigns:        (role: RoleName | null) => hasPermission(role, 'canEditCampaigns'),
  viewCampaigns:        (role: RoleName | null) => hasPermission(role, 'canViewCampaigns'),
  deleteCampaigns:      (role: RoleName | null) => hasPermission(role, 'canDeleteCampaigns'),
  generateContent:      (role: RoleName | null) => hasPermission(role, 'canGenerateContent'),
  editContent:          (role: RoleName | null) => hasPermission(role, 'canEditContent'),
  viewContent:          (role: RoleName | null) => hasPermission(role, 'canViewContent'),
  requestApproval:      (role: RoleName | null) => hasPermission(role, 'canRequestApproval'),
  approveContent:       (role: RoleName | null) => hasPermission(role, 'canApproveContent'),
  rejectContent:        (role: RoleName | null) => hasPermission(role, 'canRejectContent'),
  viewApprovals:        (role: RoleName | null) => hasPermission(role, 'canViewApprovals'),
  publishContent:       (role: RoleName | null) => hasPermission(role, 'canPublishContent'),
  scheduleContent:      (role: RoleName | null) => hasPermission(role, 'canScheduleContent'),
  uploadAssets:         (role: RoleName | null) => hasPermission(role, 'canUploadAssets'),
  manageAssets:         (role: RoleName | null) => hasPermission(role, 'canManageAssets'),
  viewAssets:           (role: RoleName | null) => hasPermission(role, 'canViewAssets'),
  viewReports:          (role: RoleName | null) => hasPermission(role, 'canViewReports'),
  generateReports:      (role: RoleName | null) => hasPermission(role, 'canGenerateReports'),
  exportReports:        (role: RoleName | null) => hasPermission(role, 'canExportReports'),
  exportPacks:          (role: RoleName | null) => hasPermission(role, 'canExportPacks'),
  viewExportPacks:      (role: RoleName | null) => hasPermission(role, 'canViewExportPacks'),
  manageConnectors:     (role: RoleName | null) => hasPermission(role, 'canManageConnectors'),
  viewConnectors:       (role: RoleName | null) => hasPermission(role, 'canViewConnectors'),
  viewAutomationLogs:   (role: RoleName | null) => hasPermission(role, 'canViewAutomationLogs'),
  manageWebhooks:       (role: RoleName | null) => hasPermission(role, 'canManageWebhooks'),
  manageUsers:          (role: RoleName | null) => hasPermission(role, 'canManageUsers'),
  assignRoles:          (role: RoleName | null) => hasPermission(role, 'canAssignRoles'),
  viewUsers:            (role: RoleName | null) => hasPermission(role, 'canViewUsers'),
  manageSystemSettings: (role: RoleName | null) => hasPermission(role, 'canManageSystemSettings'),
  viewAuditLogs:        (role: RoleName | null) => hasPermission(role, 'canViewAuditLogs'),
};

// Role display helpers
export const ROLE_LABELS: Record<RoleName, string> = {
  owner:   'Owner',
  manager: 'Manager',
  client:  'Client',
  viewer:  'Viewer',
};

export const ROLE_COLORS: Record<RoleName, string> = {
  owner:   '#fb923c',   // indigo
  manager: '#34d399',   // emerald
  client:  '#f59e0b',   // amber
  viewer:  '#94a3b8',   // slate
};

// Returns true if the role can access the "owner/internal" workspace sections
export function isInternalRole(role: RoleName | null | undefined): boolean {
  return role === 'owner' || role === 'manager';
}

// Returns true if the role is client-facing only
export function isClientRole(role: RoleName | null | undefined): boolean {
  return role === 'client' || role === 'viewer';
}
