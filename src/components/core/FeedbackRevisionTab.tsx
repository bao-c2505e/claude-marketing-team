import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Check,
  ChevronDown,
  AlertCircle,
  ClipboardCopy,
  Download,
  ShieldCheck,
  Trash2,
  FileText,
  Plus,
} from 'lucide-react';
import type { RoleName, Client, Brand, Campaign, ContentPlanItem } from '../../types/core';
import type { ApprovalDataStore } from '../../lib/core/coreData';
import { can } from '../../lib/auth/permissions';
import { MODULE_META, type ModuleKey } from '../../lib/core/approvalClassify';
import { collectHandoffCandidates } from '../../lib/core/handoffPack';
import {
  loadClientFeedback,
  saveClientFeedback,
  addFeedback,
  updateFeedback,
  setFeedbackStatus,
  deleteFeedback,
  listFeedback,
  filterFeedback,
  buildRevisionNote,
  FEEDBACK_SOURCES,
  FEEDBACK_TYPES,
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  FEEDBACK_VIEWS,
  FEEDBACK_SOURCE_LABEL,
  FEEDBACK_TYPE_LABEL,
  FEEDBACK_PRIORITY_LABEL,
  FEEDBACK_PRIORITY_COLOR,
  FEEDBACK_STATUS_LABEL,
  FEEDBACK_STATUS_COLOR,
  FEEDBACK_VIEW_LABEL,
  FEEDBACK_TYPE_TO_MODULE,
  REVISION_INTERNAL_SAFETY_NOTE,
  FEEDBACK_APPROVED_MEANS,
  FEEDBACK_HANDOFF_MEANS,
  FEEDBACK_CORE_DOES_NOT,
  type ClientFeedbackMap,
  type FeedbackView,
  type FeedbackSource,
  type FeedbackType,
  type FeedbackPriority,
  type FeedbackStatus,
  type RevisionNoteFormat,
} from '../../lib/core/clientFeedback';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  contentItems: ContentPlanItem[];
  approvalData: ApprovalDataStore;
  userRole: RoleName | null;
  actorLabel: string;
  isSupabaseConfigured: boolean;
}

// Reverse of FEEDBACK_TYPE_TO_MODULE — pre-fill type when linking an item.
const MODULE_TO_TYPE: Record<ModuleKey, FeedbackType> = {
  content: 'copy_edit',
  design:  'design_edit',
  video:   'video_edit',
  ads:     'ads_edit',
  report:  'report_edit',
  other:   'general',
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px',
};
const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
  borderRadius: '10px', padding: '16px',
};
const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 600, color, background: `${color}18`,
      borderRadius: '5px', padding: '2px 8px', border: `1px solid ${color}40`,
    }}>{label}</span>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <label style={LABEL_STYLE}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select className="form-control" value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', fontSize: '0.82rem', paddingRight: '28px' }}>
          {children}
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeedbackRevisionTab({
  clients, brands, campaigns, contentItems, approvalData,
  userRole, actorLabel, isSupabaseConfigured,
}: Props) {
  const [feedbackMap, setFeedbackMap] = useState<ClientFeedbackMap>({});
  useEffect(() => { setFeedbackMap(loadClientFeedback()); }, []);

  const persist = useCallback((next: ClientFeedbackMap) => {
    setFeedbackMap(next);
    saveClientFeedback(next);
  }, []);

  // ── New-feedback form state ───────────────────────────────────────────────
  const [note, setNote]           = useState('');
  const [source, setSource]       = useState<FeedbackSource>('manual_note');
  const [type, setType]           = useState<FeedbackType>('general');
  const [priority, setPriority]   = useState<FeedbackPriority>('normal');
  const [linkedItemId, setLinkedItemId] = useState('');
  const [handoffRef, setHandoffRef]     = useState('');

  // ── Filter + selection state ──────────────────────────────────────────────
  const [view, setView]               = useState<FeedbackView>('all');
  const [moduleFilter, setModuleFilter] = useState<ModuleKey | ''>('');
  const [selectedId, setSelectedId]   = useState<string | null>(null);

  // ── Revision-note preview state ───────────────────────────────────────────
  const [revisionFormat, setRevisionFormat] = useState<RevisionNoteFormat>('markdown');
  const [revisionPreview, setRevisionPreview] = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // ── Permissions ───────────────────────────────────────────────────────────
  const canView = userRole === 'owner' || userRole === 'manager';
  const canEdit = can.approveContent(userRole); // owner/manager

  // ── Approved items available to link (existing ids/metadata only) ──────────
  const approvedItems = useMemo(() => collectHandoffCandidates({
    clients, brands, campaigns, contentItems,
    approvalRequests: approvalData.approvalRequests,
    deliveryMap: {},
  }), [clients, brands, campaigns, contentItems, approvalData.approvalRequests]);

  const itemByApprovalId = useMemo(
    () => new Map(approvedItems.map(c => [c.approvalId, c])),
    [approvedItems],
  );

  // ── Derived feedback list ─────────────────────────────────────────────────
  const allList = useMemo(() => listFeedback(feedbackMap), [feedbackMap]);
  const filtered = useMemo(
    () => filterFeedback(allList, view, moduleFilter || null),
    [allList, view, moduleFilter],
  );
  const selected = selectedId ? feedbackMap[selectedId] : undefined;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLinkChange = (id: string) => {
    setLinkedItemId(id);
    const cand = id ? itemByApprovalId.get(id) : undefined;
    if (cand) {
      setType(MODULE_TO_TYPE[cand.module]);
    }
  };

  const handleAdd = () => {
    if (!canEdit || !note.trim()) return;
    const cand = linkedItemId ? itemByApprovalId.get(linkedItemId) : undefined;
    const next = addFeedback(feedbackMap, {
      note,
      source, type, priority,
      linkedItemId: linkedItemId || undefined,
      linkedItemTitle: cand?.title,
      module: cand?.module ?? FEEDBACK_TYPE_TO_MODULE[type],
      handoffRef: handoffRef || undefined,
    }, { updatedBy: actorLabel });
    persist(next);
    // reset
    setNote(''); setSource('manual_note'); setType('general'); setPriority('normal');
    setLinkedItemId(''); setHandoffRef('');
  };

  const handleStatus = (id: string, status: FeedbackStatus) => {
    if (!canEdit) return;
    persist(setFeedbackStatus(feedbackMap, id, status, { updatedBy: actorLabel }));
  };

  const handleRevisionField = (id: string, field: 'revisionInstructions' | 'ownerNote', value: string) => {
    if (!canEdit) return;
    persist(updateFeedback(feedbackMap, id, { [field]: value }, { updatedBy: actorLabel }));
  };

  const handleDelete = (id: string) => {
    if (!canEdit) return;
    persist(deleteFeedback(feedbackMap, id));
    if (selectedId === id) { setSelectedId(null); setRevisionPreview(null); }
  };

  const handleBuildRevision = () => {
    if (!selected) return;
    setRevisionPreview(buildRevisionNote(selected, revisionFormat));
  };

  const handleCopy = async () => {
    if (!revisionPreview) return;
    try {
      await navigator.clipboard.writeText(revisionPreview);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('revision-note-preview') as HTMLTextAreaElement | null;
      if (el) el.select();
    }
  };

  // Local browser download only — Blob + object URL. No network, no upload.
  const handleDownload = () => {
    if (!revisionPreview || !selected) return;
    const ext = revisionFormat === 'markdown' ? 'md' : 'txt';
    const mime = revisionFormat === 'markdown' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([revisionPreview], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revision-note-${selected.id}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true); setTimeout(() => setDownloaded(false), 2000);
  };

  if (!canView) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <AlertCircle size={32} style={{ marginBottom: '12px' }} />
        <p>The Feedback / Revision loop is an internal tool (Owner / Manager only).</p>
      </div>
    );
  }

  const openCount = allList.filter(r => r.status === 'open').length;
  const moduleOfSelected = selected ? (selected.module ?? FEEDBACK_TYPE_TO_MODULE[selected.type]) : 'other';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Safety Banner (G5) ── */}
      <div style={{ padding: '12px 16px', background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <ShieldCheck size={16} style={{ color: '#60a5fa', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: '#93c5fd' }}>
          <strong>Internal feedback &amp; revision loop.</strong>{' '}
          {FEEDBACK_APPROVED_MEANS} {FEEDBACK_HANDOFF_MEANS} {FEEDBACK_CORE_DOES_NOT} Recording feedback never changes an approval decision — approvals happen only in the Approval Queue.
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={20} style={{ color: '#60a5fa' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Feedback &amp; Revision</h2>
          <Badge label="Internal · manual only" color="#60a5fa" />
          {!isSupabaseConfigured && <Badge label="Local Data Only" color="#f59e0b" />}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {allList.length} feedback note{allList.length === 1 ? '' : 's'} · {openCount} open
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }} className="dash-cols">

        {/* ── Left: Record feedback (G1 + G2) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={CARD_STYLE}>
            <div style={SECTION_LABEL_STYLE}>Record client feedback</div>

            {!canEdit ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>View-only access — you can review feedback but not record it.</p>
            ) : (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <label style={LABEL_STYLE}>Feedback note</label>
                  <textarea
                    className="form-control"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="What did the client say? (recorded manually by Owner/staff)"
                    style={{ width: '100%', minHeight: '72px', fontSize: '0.82rem', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <SelectField label="Link to approved output (optional)" value={linkedItemId} onChange={handleLinkChange}>
                  <option value="">— Not linked —</option>
                  {approvedItems.map(c => (
                    <option key={c.approvalId} value={c.approvalId}>
                      [{c.moduleLabel}] {c.title}
                    </option>
                  ))}
                </SelectField>

                <div style={{ marginBottom: '10px' }}>
                  <label style={LABEL_STYLE}>Handoff pack reference (optional, text)</label>
                  <input className="form-control" value={handoffRef} onChange={e => setHandoffRef(e.target.value)}
                    placeholder="e.g. June Handoff Pack — Bản Khói" style={{ width: '100%', fontSize: '0.82rem' }} />
                </div>

                <SelectField label="Source" value={source} onChange={v => setSource(v as FeedbackSource)}>
                  {FEEDBACK_SOURCES.map(s => <option key={s} value={s}>{FEEDBACK_SOURCE_LABEL[s]}</option>)}
                </SelectField>

                <SelectField label="Feedback type" value={type} onChange={v => setType(v as FeedbackType)}>
                  {FEEDBACK_TYPES.map(t => <option key={t} value={t}>{FEEDBACK_TYPE_LABEL[t]}</option>)}
                </SelectField>

                <SelectField label="Priority" value={priority} onChange={v => setPriority(v as FeedbackPriority)}>
                  {FEEDBACK_PRIORITIES.map(p => <option key={p} value={p}>{FEEDBACK_PRIORITY_LABEL[p]}</option>)}
                </SelectField>

                <button
                  onClick={handleAdd}
                  disabled={!note.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%',
                    padding: '11px', borderRadius: '9px', fontSize: '0.88rem', fontWeight: 700, marginTop: '4px',
                    background: note.trim() ? 'rgba(96,165,250,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${note.trim() ? 'rgba(96,165,250,0.5)' : 'var(--border-color)'}`,
                    color: note.trim() ? '#60a5fa' : 'var(--text-muted)',
                    cursor: note.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                  }}
                >
                  <Plus size={16} /> Add feedback note
                </button>
              </>
            )}
          </div>

          {/* G5 reminders */}
          <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>Safety</div>
            <div>• {FEEDBACK_APPROVED_MEANS}</div>
            <div>• {FEEDBACK_HANDOFF_MEANS}</div>
            <div>• {FEEDBACK_CORE_DOES_NOT}</div>
            <div>• Feedback is input to human review — it never changes an approval decision automatically.</div>
          </div>
        </div>

        {/* ── Right: Filters + list + detail ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>

          {/* Filters (G4) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {FEEDBACK_VIEWS.map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '5px 11px', borderRadius: '7px', fontSize: '0.76rem', fontWeight: 600,
                  background: view === v ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${view === v ? 'rgba(96,165,250,0.5)' : 'var(--border-color)'}`,
                  color: view === v ? '#60a5fa' : 'var(--text-secondary)', cursor: 'pointer',
                }}>
                  {FEEDBACK_VIEW_LABEL[v]}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <select className="form-control" value={moduleFilter} onChange={e => setModuleFilter(e.target.value as ModuleKey | '')}
                style={{ fontSize: '0.78rem', paddingRight: '28px' }}>
                <option value="">All modules</option>
                {(['content', 'design', 'video', 'ads', 'report', 'other'] as ModuleKey[]).map(m => (
                  <option key={m} value={m}>{MODULE_META[m].label}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* List */}
          <div style={CARD_STYLE}>
            {filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                <FileText size={30} style={{ opacity: 0.4 }} />
                <p style={{ fontSize: '0.82rem', margin: 0 }}>
                  {allList.length === 0 ? 'No feedback recorded yet. Record client feedback on the left.' : 'No feedback matches this filter.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                {filtered.map(rec => {
                  const mod = rec.module ?? FEEDBACK_TYPE_TO_MODULE[rec.type];
                  const isSel = rec.id === selectedId;
                  return (
                    <div key={rec.id}
                      onClick={() => { setSelectedId(rec.id); setRevisionPreview(null); }}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                        background: isSel ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSel ? 'rgba(96,165,250,0.45)' : 'var(--border-color)'}`,
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>
                          {rec.note.length > 120 ? `${rec.note.slice(0, 120)}…` : rec.note}
                        </div>
                        <Badge label={FEEDBACK_STATUS_LABEL[rec.status]} color={FEEDBACK_STATUS_COLOR[rec.status]} />
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <Badge label={MODULE_META[mod].label} color={MODULE_META[mod].color} />
                        <Badge label={FEEDBACK_TYPE_LABEL[rec.type]} color="#94a3b8" />
                        <Badge label={FEEDBACK_PRIORITY_LABEL[rec.priority]} color={FEEDBACK_PRIORITY_COLOR[rec.priority]} />
                        <Badge label={FEEDBACK_SOURCE_LABEL[rec.source]} color="#94a3b8" />
                        {rec.linkedItemTitle && <Badge label={`↪ ${rec.linkedItemTitle.length > 28 ? rec.linkedItemTitle.slice(0, 28) + '…' : rec.linkedItemTitle}`} color="#34d399" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail / revision note builder (G3) */}
          {selected && (
            <div style={CARD_STYLE}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Badge label={MODULE_META[moduleOfSelected].label} color={MODULE_META[moduleOfSelected].color} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selected.linkedItemTitle || 'Untitled output'}</span>
                </div>
                {canEdit && (
                  <button onClick={() => handleDelete(selected.id)} style={{ ...miniBtn, color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>

              {/* Status controls */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ ...SECTION_LABEL_STYLE, marginBottom: '6px' }}>Status</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {FEEDBACK_STATUSES.map(s => {
                    const active = selected.status === s;
                    return (
                      <button key={s} onClick={() => handleStatus(selected.id, s)} disabled={!canEdit} style={{
                        padding: '5px 11px', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 600,
                        background: active ? `${FEEDBACK_STATUS_COLOR[s]}22` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${active ? `${FEEDBACK_STATUS_COLOR[s]}66` : 'var(--border-color)'}`,
                        color: active ? FEEDBACK_STATUS_COLOR[s] : 'var(--text-secondary)',
                        cursor: canEdit ? 'pointer' : 'default',
                      }}>
                        {FEEDBACK_STATUS_LABEL[s]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Client feedback (read) */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ ...SECTION_LABEL_STYLE, marginBottom: '4px' }}>Client feedback</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                  {selected.note}
                </div>
              </div>

              {/* Internal revision instructions (edit) */}
              <div style={{ marginBottom: '12px' }}>
                <label style={LABEL_STYLE}>Internal revision instructions</label>
                <textarea
                  className="form-control"
                  defaultValue={selected.revisionInstructions ?? ''}
                  key={`ri-${selected.id}`}
                  disabled={!canEdit}
                  onBlur={e => handleRevisionField(selected.id, 'revisionInstructions', e.target.value)}
                  placeholder="Internal instructions for the team to revise this item…"
                  style={{ width: '100%', minHeight: '60px', fontSize: '0.82rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Owner note (edit) */}
              <div style={{ marginBottom: '12px' }}>
                <label style={LABEL_STYLE}>Owner note</label>
                <textarea
                  className="form-control"
                  defaultValue={selected.ownerNote ?? ''}
                  key={`on-${selected.id}`}
                  disabled={!canEdit}
                  onBlur={e => handleRevisionField(selected.id, 'ownerNote', e.target.value)}
                  placeholder="Optional internal owner note…"
                  style={{ width: '100%', minHeight: '48px', fontSize: '0.82rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
                {canEdit && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Changes save when you click outside the box.</p>}
              </div>

              {/* Build revision note */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={handleBuildRevision} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600,
                  background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.45)', color: '#60a5fa', cursor: 'pointer',
                }}>
                  <FileText size={14} /> Build revision note
                </button>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['markdown', 'plain_text'] as RevisionNoteFormat[]).map(f => (
                    <button key={f} onClick={() => setRevisionFormat(f)} style={{
                      ...miniBtn,
                      background: revisionFormat === f ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${revisionFormat === f ? 'rgba(96,165,250,0.45)' : 'var(--border-color)'}`,
                      color: revisionFormat === f ? '#60a5fa' : 'var(--text-secondary)',
                    }}>
                      {f === 'markdown' ? 'Markdown' : 'Plain text'}
                    </button>
                  ))}
                </div>
              </div>

              {revisionPreview && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={handleDownload} style={{ ...miniBtn, display: 'flex', alignItems: 'center', gap: '5px', color: downloaded ? '#60a5fa' : 'var(--text-secondary)' }}>
                      {downloaded ? <Check size={12} /> : <Download size={12} />} {downloaded ? 'Saved' : `.${revisionFormat === 'markdown' ? 'md' : 'txt'}`}
                    </button>
                    <button onClick={handleCopy} style={{ ...miniBtn, display: 'flex', alignItems: 'center', gap: '5px', color: copied ? '#34d399' : '#60a5fa', borderColor: copied ? 'rgba(52,211,153,0.45)' : 'rgba(96,165,250,0.45)' }}>
                      {copied ? <Check size={12} /> : <ClipboardCopy size={12} />} {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <textarea
                    id="revision-note-preview"
                    readOnly
                    value={revisionPreview}
                    style={{
                      width: '100%', minHeight: '300px', background: 'rgba(0,0,0,0.35)',
                      border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px',
                      fontFamily: 'monospace', fontSize: '0.77rem', lineHeight: '1.6', color: '#e2e8f0',
                      resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                    {REVISION_INTERNAL_SAFETY_NOTE} This phase does not call AI or n8n to regenerate content.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  padding: '5px 11px', borderRadius: '7px', fontSize: '0.74rem', fontWeight: 600,
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)', cursor: 'pointer',
};
