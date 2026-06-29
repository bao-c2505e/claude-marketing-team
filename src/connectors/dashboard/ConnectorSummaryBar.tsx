import type { ConnectorSummary } from './connectorDashboard.types';

interface SummaryCardProps {
  label: string;
  value: number;
  color: 'neutral' | 'green' | 'red' | 'gray';
}

const COLOR_STYLE: Record<SummaryCardProps['color'], string> = {
  neutral: 'var(--text-primary)',
  green: 'var(--success)',
  red: 'var(--error)',
  gray: 'var(--text-muted)',
};

function SummaryCard({ label, value, color }: SummaryCardProps) {
  return (
    <div className="kpi-card" style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: COLOR_STYLE[color], margin: 0 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
        {label}
      </p>
    </div>
  );
}

interface Props {
  summary: ConnectorSummary;
}

export function ConnectorSummaryBar({ summary }: Props) {
  return (
    <div data-testid="connector-summary-bar" className="kpi-grid">
      <SummaryCard label="Total" value={summary.total} color="neutral" />
      <SummaryCard label="Connected" value={summary.connected} color="green" />
      <SummaryCard label="Error" value={summary.error} color="red" />
      <SummaryCard label="Not Configured" value={summary.not_configured} color="gray" />
    </div>
  );
}
