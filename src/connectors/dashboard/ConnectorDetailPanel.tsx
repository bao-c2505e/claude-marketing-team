import { useEffect, useRef, useState } from 'react';
import type { LocalConnectorRegistryItem, LocalConnectorType } from '../../types/core';
import type { HealthCheckEntry } from './connectorDashboard.types';
import { isLiveCheckSupported } from './connectorDashboard.types';
import { StatusBadge, ModeBadge } from './connectorBadges';
import { ConnectorHealthLog } from './ConnectorHealthLog';

interface Props {
  item: LocalConnectorRegistryItem | null;
  healthLog: HealthCheckEntry[];
  isChecking: boolean;
  onClose: () => void;
  onCheck: (id: string) => void;
}

export type PanelActionKind = 'recheck' | 'sandbox' | 'simulate';

export function getPanelActionKind(t: LocalConnectorType): PanelActionKind {
  if (t === 'meta_ads') return 'sandbox';
  if (isLiveCheckSupported(t)) return 'recheck';
  return 'simulate';
}

// Public, non-secret sandbox identifiers only — never tokens/secrets.
export const META_SANDBOX_INFO = {
  appId: '1352130343722707',
  adAccountId: 'act_1863911107274773',
  currency: 'VND',
  timezone: 'Asia/Ho_Chi_Minh',
} as const;

export function ConnectorDetailPanel({ item, healthLog, isChecking, onClose, onCheck }: Props) {
  const isOpen = item !== null;
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [showSandbox, setShowSandbox] = useState(false);

  // ESC to close (only while open)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Focus the close button when the panel opens; reset sandbox toggle.
  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
    } else {
      setShowSandbox(false);
    }
  }, [isOpen]);

  const actionKind = item ? getPanelActionKind(item.connector_type) : 'simulate';
  const actionLabel =
    actionKind === 'recheck'
      ? '⚡ Re-check Health'
      : actionKind === 'sandbox'
        ? '📋 View Sandbox Config'
        : '🔲 Simulate Check';

  const handleAction = () => {
    if (!item) return;
    if (actionKind === 'sandbox') {
      setShowSandbox(s => !s);
    } else {
      onCheck(item.id);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          data-testid="detail-panel-backdrop"
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
        />
      )}

      {/* Drawer */}
      <div
        data-testid="connector-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        aria-hidden={!isOpen}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100%',
          width: '100%',
          maxWidth: '28rem',
          background: 'var(--surface, #ffffff)',
          color: 'var(--text-primary)',
          zIndex: 50,
          boxShadow: '-8px 0 24px rgba(0,0,0,0.35)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {item && (
          <>
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* a. Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  <p id="panel-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '2px 0 8px' }}>
                    {item.connector_type}
                  </p>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusBadge status={item.status} />
                    <ModeBadge mode={item.mode} />
                  </div>
                </div>
                <button
                  ref={closeBtnRef}
                  aria-label="Close panel"
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ fontSize: '1rem', lineHeight: 1, padding: '4px 10px' }}
                >
                  ✕
                </button>
              </div>

              {/* b. ENV keys */}
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                  ENV keys required — values not stored here
                </p>
                <ul data-testid="env-keys-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {item.required_env_keys.map(key => (
                    <li key={key} style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      ⬜ {key}
                    </li>
                  ))}
                </ul>
              </div>

              {/* c. Safety note */}
              {item.safety_note && (
                <p
                  data-testid="safety-note-panel"
                  style={{
                    fontSize: '0.75rem',
                    margin: 0,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    fontFamily: 'monospace',
                  }}
                >
                  {item.safety_note}
                </p>
              )}

              {/* d. Mode display (read-only) */}
              <div data-testid="mode-display">
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                  Current mode — changes require Owner approval
                </p>
                <ModeBadge mode={item.mode} />
              </div>

              {/* e. Health log */}
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                  Health checks
                </p>
                {healthLog.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    No health checks recorded yet
                  </p>
                ) : (
                  <ConnectorHealthLog log={healthLog} />
                )}
              </div>

              {/* Sandbox config (public info only) */}
              {actionKind === 'sandbox' && showSandbox && (
                <div
                  data-testid="sandbox-config-block"
                  style={{
                    fontSize: '0.75rem',
                    padding: '10px',
                    borderRadius: 8,
                    background: 'var(--surface-2, rgba(255,255,255,0.04))',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>App ID: {META_SANDBOX_INFO.appId}</span>
                  <span>Ad account: {META_SANDBOX_INFO.adAccountId}</span>
                  <span>Currency: {META_SANDBOX_INFO.currency}</span>
                  <span>Timezone: {META_SANDBOX_INFO.timezone}</span>
                </div>
              )}
            </div>

            {/* f. Actions (sticky bottom) */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <button
                data-testid="panel-action-btn"
                onClick={handleAction}
                disabled={isChecking}
                className={actionKind === 'recheck' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ width: '100%', fontSize: '0.875rem' }}
              >
                {isChecking ? 'Checking…' : actionLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
