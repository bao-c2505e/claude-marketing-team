import { describe, expect, it } from 'vitest';
import {
  setDeliveryStatus,
  setDeliveryLink,
  setDeliveryNote,
  clearDelivery,
  getDeliveryStatus,
  getDeliveryRecord,
  isSafeHttpLink,
  DEFAULT_MANUAL_DELIVERY_STATUS,
  MANUAL_DELIVERY_LABEL,
  MANUAL_DELIVERY_STATUSES,
  type ManualDeliveryMap,
} from './manualDelivery';

const NOW = '2026-06-18T10:00:00.000Z';

describe('getDeliveryStatus', () => {
  it('defaults to not_delivered when there is no record', () => {
    expect(getDeliveryStatus({}, 'req-1')).toBe('not_delivered');
    expect(DEFAULT_MANUAL_DELIVERY_STATUS).toBe('not_delivered');
  });
});

describe('setDeliveryStatus', () => {
  it('creates a record with the given status and timestamp, without mutating input', () => {
    const map: ManualDeliveryMap = {};
    const next = setDeliveryStatus(map, 'req-1', 'delivered_to_client', 'owner', NOW);
    expect(map).toEqual({}); // input untouched
    expect(getDeliveryStatus(next, 'req-1')).toBe('delivered_to_client');
    expect(next['req-1'].updatedAt).toBe(NOW);
    expect(next['req-1'].updatedBy).toBe('owner');
  });

  it('updates status while preserving existing link/note', () => {
    let map: ManualDeliveryMap = {};
    map = setDeliveryLink(map, 'req-1', 'https://example.com/post', 'owner', NOW);
    map = setDeliveryNote(map, 'req-1', 'Sent to client over Zalo', 'owner', NOW);
    map = setDeliveryStatus(map, 'req-1', 'manually_posted', 'owner', NOW);
    const rec = getDeliveryRecord(map, 'req-1')!;
    expect(rec.status).toBe('manually_posted');
    expect(rec.link).toBe('https://example.com/post');
    expect(rec.note).toBe('Sent to client over Zalo');
  });
});

describe('setDeliveryLink / setDeliveryNote', () => {
  it('trims values and drops empties', () => {
    let map: ManualDeliveryMap = setDeliveryLink({}, 'req-1', '  https://x.test  ', 'owner', NOW);
    expect(map['req-1'].link).toBe('https://x.test');
    map = setDeliveryNote(map, 'req-1', '   ', 'owner', NOW);
    expect(map['req-1'].note).toBeUndefined();
    map = setDeliveryLink(map, 'req-1', '   ', 'owner', NOW);
    expect(map['req-1'].link).toBeUndefined();
  });

  it('keeps a default status when only a link/note is added first', () => {
    const map = setDeliveryNote({}, 'req-1', 'note first', 'owner', NOW);
    expect(map['req-1'].status).toBe('not_delivered');
  });
});

describe('clearDelivery', () => {
  it('removes the record and does not mutate input', () => {
    const map = setDeliveryStatus({}, 'req-1', 'archived', 'owner', NOW);
    const cleared = clearDelivery(map, 'req-1');
    expect(getDeliveryRecord(cleared, 'req-1')).toBeUndefined();
    expect(getDeliveryStatus(cleared, 'req-1')).toBe('not_delivered');
    expect(getDeliveryRecord(map, 'req-1')).toBeDefined(); // input untouched
  });

  it('is a no-op when nothing is stored', () => {
    const map: ManualDeliveryMap = {};
    expect(clearDelivery(map, 'missing')).toBe(map);
  });
});

describe('isSafeHttpLink', () => {
  it('accepts http and https URLs only', () => {
    expect(isSafeHttpLink('https://facebook.com/post/123')).toBe(true);
    expect(isSafeHttpLink('http://example.com')).toBe(true);
  });

  it('rejects unsafe or non-URL strings', () => {
    expect(isSafeHttpLink('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpLink('data:text/html,evil')).toBe(false);
    expect(isSafeHttpLink('not a url')).toBe(false);
    expect(isSafeHttpLink('')).toBe(false);
    expect(isSafeHttpLink(undefined)).toBe(false);
  });
});

describe('labels', () => {
  it('has a human label for every status', () => {
    for (const s of MANUAL_DELIVERY_STATUSES) {
      expect(MANUAL_DELIVERY_LABEL[s]).toBeTruthy();
    }
  });
});
