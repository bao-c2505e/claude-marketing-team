import { describe, expect, it } from 'vitest';
import {
  addFeedback,
  updateFeedback,
  setFeedbackStatus,
  deleteFeedback,
  listFeedback,
  feedbackMatches,
  filterFeedback,
  buildRevisionNote,
  toPlainText,
  FEEDBACK_TYPE_TO_MODULE,
  REVISION_INTERNAL_SAFETY_NOTE,
  DEFAULT_FEEDBACK_STATUS,
  type ClientFeedbackMap,
  type ClientFeedbackRecord,
} from './clientFeedback';

const NOW = '2026-06-18T10:00:00.000Z';

// ---------------------------------------------------------------------------
// addFeedback
// ---------------------------------------------------------------------------

describe('addFeedback', () => {
  it('creates a record with defaults and does not mutate the input map', () => {
    const map: ClientFeedbackMap = {};
    const next = addFeedback(map, { note: 'Client wants warmer tone' }, { id: 'fb-1', now: NOW, updatedBy: 'owner' });
    expect(map).toEqual({}); // input untouched
    const rec = next['fb-1'];
    expect(rec.note).toBe('Client wants warmer tone');
    expect(rec.source).toBe('manual_note');
    expect(rec.type).toBe('general');
    expect(rec.priority).toBe('normal');
    expect(rec.status).toBe(DEFAULT_FEEDBACK_STATUS);
    expect(rec.createdAt).toBe(NOW);
    expect(rec.updatedBy).toBe('owner');
  });

  it('stores classification, link and revision fields; trims and drops empties', () => {
    const next = addFeedback({}, {
      note: '  fix headline  ',
      source: 'call',
      type: 'copy_edit',
      priority: 'high',
      linkedItemId: 'appr-1',
      linkedItemTitle: 'Content Day 1',
      module: 'content',
      handoffRef: 'June Handoff',
      revisionInstructions: 'Shorten the hook',
      ownerNote: '',
    }, { id: 'fb-2', now: NOW });
    const rec = next['fb-2'];
    expect(rec.note).toBe('fix headline');
    expect(rec.linkedItemId).toBe('appr-1');
    expect(rec.module).toBe('content');
    expect(rec.revisionInstructions).toBe('Shorten the hook');
    expect('ownerNote' in rec).toBe(false); // empty dropped
  });
});

// ---------------------------------------------------------------------------
// updateFeedback / setFeedbackStatus — never touches approval, only the record
// ---------------------------------------------------------------------------

describe('updateFeedback', () => {
  it('patches fields and bumps updatedAt without mutating input', () => {
    const map = addFeedback({}, { note: 'a' }, { id: 'fb-1', now: NOW });
    const next = updateFeedback(map, 'fb-1', { status: 'in_review', revisionInstructions: 'tighten CTA' }, { now: '2026-06-18T11:00:00.000Z', updatedBy: 'manager' });
    expect(map['fb-1'].status).toBe('open'); // input untouched
    expect(next['fb-1'].status).toBe('in_review');
    expect(next['fb-1'].revisionInstructions).toBe('tighten CTA');
    expect(next['fb-1'].updatedAt).toBe('2026-06-18T11:00:00.000Z');
    expect(next['fb-1'].createdAt).toBe(NOW); // preserved
  });

  it('returns the same map when the id is unknown', () => {
    const map = addFeedback({}, { note: 'a' }, { id: 'fb-1', now: NOW });
    expect(updateFeedback(map, 'nope', { status: 'resolved' })).toBe(map);
  });

  it('setFeedbackStatus moves status only', () => {
    const map = addFeedback({}, { note: 'a' }, { id: 'fb-1', now: NOW });
    const next = setFeedbackStatus(map, 'fb-1', 'resolved', { now: NOW });
    expect(next['fb-1'].status).toBe('resolved');
  });
});

describe('deleteFeedback', () => {
  it('removes a record and leaves others; no-op for unknown id', () => {
    let map = addFeedback({}, { note: 'a' }, { id: 'fb-1', now: NOW });
    map = addFeedback(map, { note: 'b' }, { id: 'fb-2', now: NOW });
    const next = deleteFeedback(map, 'fb-1');
    expect('fb-1' in next).toBe(false);
    expect('fb-2' in next).toBe(true);
    expect(deleteFeedback(map, 'zzz')).toBe(map);
  });
});

// ---------------------------------------------------------------------------
// filters
// ---------------------------------------------------------------------------

describe('feedbackMatches / filterFeedback', () => {
  let map: ClientFeedbackMap = {};
  map = addFeedback(map, { note: 'open content', type: 'copy_edit', status: 'open', priority: 'high' }, { id: 'fb-open', now: '2026-06-18T09:00:00.000Z' });
  map = addFeedback(map, { note: 'resolved design', type: 'design_edit', status: 'resolved', priority: 'low' }, { id: 'fb-res', now: '2026-06-18T09:30:00.000Z' });
  map = addFeedback(map, { note: 'review ads', type: 'ads_edit', status: 'in_review', priority: 'normal' }, { id: 'fb-rev', now: '2026-06-18T10:00:00.000Z' });
  const list = listFeedback(map);

  it('lists newest-first', () => {
    expect(list.map(r => r.id)).toEqual(['fb-rev', 'fb-res', 'fb-open']);
  });

  it('all view returns everything', () => {
    expect(filterFeedback(list, 'all').length).toBe(3);
  });

  it('status views filter by status', () => {
    expect(filterFeedback(list, 'open').map(r => r.id)).toEqual(['fb-open']);
    expect(filterFeedback(list, 'resolved').map(r => r.id)).toEqual(['fb-res']);
    expect(filterFeedback(list, 'in_review').map(r => r.id)).toEqual(['fb-rev']);
  });

  it('high_priority view filters by priority', () => {
    expect(filterFeedback(list, 'high_priority').map(r => r.id)).toEqual(['fb-open']);
  });

  it('module filter narrows by type→module mapping', () => {
    expect(filterFeedback(list, 'all', 'design').map(r => r.id)).toEqual(['fb-res']);
    expect(feedbackMatches(list[0], 'all', 'ads')).toBe(true); // fb-rev is ads_edit
  });
});

// ---------------------------------------------------------------------------
// buildRevisionNote — safety regression
// ---------------------------------------------------------------------------

describe('buildRevisionNote', () => {
  const rec: ClientFeedbackRecord = {
    id: 'fb-1',
    note: 'Client wants the price removed and a warmer hook.',
    source: 'meeting',
    type: 'copy_edit',
    priority: 'high',
    status: 'open',
    linkedItemId: 'appr-1',
    linkedItemTitle: 'Content Day 1 — Bản Khói',
    module: 'content',
    handoffRef: 'June Handoff Pack',
    revisionInstructions: 'Remove price line; rewrite hook to be warmer.',
    ownerNote: 'Confirm with kitchen before re-shoot.',
    createdAt: NOW,
    updatedAt: NOW,
  };

  it('includes the original item, feedback, instructions, owner note and the internal safety note', () => {
    const note = buildRevisionNote(rec, 'markdown');
    expect(note).toContain('Content Day 1 — Bản Khói');
    expect(note).toContain('Client wants the price removed');
    expect(note).toContain('Remove price line');
    expect(note).toContain('Confirm with kitchen');
    expect(note).toContain(REVISION_INTERNAL_SAFETY_NOTE);
  });

  it('never implies sending / publishing / launching / spend / AI regeneration (safety regression)', () => {
    const note = buildRevisionNote(rec, 'markdown');
    const forbidden = [
      /\bsent to (the )?client\b/i,
      /\bpublished\b/i,
      /\bscheduled the\b/i,
      /\blaunched the ad/i,
      /\bspent\s+\$/i,
      /\bregenerat/i,
      /\bcalled (n8n|openai)/i,
      /pulled (live )?analytics/i,
    ];
    for (const re of forbidden) expect(note).not.toMatch(re);
  });

  it('handles missing optional fields with safe placeholders', () => {
    const bare: ClientFeedbackRecord = {
      id: 'fb-2', note: '', source: 'manual_note', type: 'general', priority: 'normal', status: 'open',
      createdAt: NOW, updatedAt: NOW,
    };
    const note = buildRevisionNote(bare);
    expect(note).toContain('Untitled output');
    expect(note).toContain('No feedback note recorded');
    expect(note).toContain('No revision instructions yet');
    expect(note).toContain(REVISION_INTERNAL_SAFETY_NOTE);
  });

  it('plain_text format strips markdown', () => {
    const note = buildRevisionNote(rec, 'plain_text');
    expect(note).not.toMatch(/^#\s/m);
    expect(note).not.toContain('**');
  });
});

describe('FEEDBACK_TYPE_TO_MODULE', () => {
  it('maps every feedback type to a module', () => {
    expect(FEEDBACK_TYPE_TO_MODULE.copy_edit).toBe('content');
    expect(FEEDBACK_TYPE_TO_MODULE.report_edit).toBe('report');
    expect(FEEDBACK_TYPE_TO_MODULE.general).toBe('other');
  });
});

describe('toPlainText', () => {
  it('strips headings/bold/list/quote markers', () => {
    expect(toPlainText('# T\n- **b** x\n> q')).toContain('• b x');
    expect(toPlainText('# T')).not.toContain('#');
  });
});
