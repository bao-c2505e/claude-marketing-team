// gdriveReadEdgeFunction.source.test.ts — T4-17
// Source-scan guards for the gdrive-read Edge Function (Deno — no Deno test
// framework exists in this repo, so the read-only surface is proven the same
// way the dashboard is: by scanning the source).

import { describe, it, expect } from 'vitest';
import EDGE_FN from '../../../../../../supabase/functions/gdrive-read/index.ts?raw';

describe('gdrive-read Edge Function — read-only allowlist (T4-17)', () => {
  it("allows exactly 'health' and 'list_files'", () => {
    expect(EDGE_FN).toMatch(/ALLOWED_ACTIONS = \['health', 'list_files'\] as const/);
  });

  it('unsupported actions are refused with 403', () => {
    expect(EDGE_FN).toMatch(/not allowed/);
    expect(EDGE_FN).toMatch(/status: 403/);
  });

  it('health action still responds ok', () => {
    expect(EDGE_FN).toMatch(/action === 'health'/);
    expect(EDGE_FN).toMatch(/gdrive-read Edge Function healthy/);
  });

  it('requests ONLY the drive.readonly scope — no write-capable scope', () => {
    expect(EDGE_FN).toMatch(/auth\/drive\.readonly/);
    expect(EDGE_FN).not.toMatch(/auth\/drive['"]/);
    expect(EDGE_FN).not.toMatch(/auth\/drive\.file|auth\/drive\.appdata|auth\/drive\.scripts|auth\/drive\.metadata['"]/);
  });

  it('the Drive data call is GET-only; the single POST is the OAuth token handshake', () => {
    expect(EDGE_FN).toMatch(/method: 'GET'/);
    const posts = EDGE_FN.match(/method: 'POST'/g) ?? [];
    expect(posts).toHaveLength(1);
    expect(EDGE_FN).toMatch(/OAuth2 token handshake/);
    expect(EDGE_FN).not.toMatch(/method: '(PATCH|PUT|DELETE)'/);
  });

  it('never touches content, download, export, sharing, or mutation endpoints', () => {
    expect(EDGE_FN).not.toMatch(/alt=media|webContentLink|webViewLink|uploadType|\/upload|\/permissions|\/copy|\/trash|\/export|\/revisions/i);
  });

  it('responds with the whitelisted metadata fields only, hard-capped', () => {
    expect(EDGE_FN).toMatch(/files\(id,name,mimeType,modifiedTime,size\)/);
    expect(EDGE_FN).toMatch(/MAX_FILES = 20/);
    expect(EDGE_FN).toMatch(/sanitizeDriveFile/);
    // Raw upstream payloads are never spread into a response.
    expect(EDGE_FN).not.toMatch(/\.\.\.json|\.\.\.data|\.\.\.resp/);
  });

  it('credentials stay in the vault and are never echoed', () => {
    expect(EDGE_FN).toMatch(/Deno\.env\.get\('GDRIVE_SERVICE_ACCOUNT_JSON'\)/);
    // No embedded key material of any kind.
    expect(EDGE_FN).not.toMatch(/MII[A-Za-z0-9+/]{10}/);
    expect(EDGE_FN).not.toMatch(/"private_key"\s*:\s*"/);
    // Upstream error bodies are reduced to status codes.
    expect(EDGE_FN).toMatch(/status \$\{resp\.status\}/);
  });

  it('hard-false safety flags are present and never true', () => {
    expect(EDGE_FN).toMatch(/allow_write:\s*false/);
    expect(EDGE_FN).toMatch(/allow_publish:\s*false/);
    expect(EDGE_FN).toMatch(/allow_spend:\s*false/);
    expect(EDGE_FN).not.toMatch(/allow_(write|publish|spend):\s*true/);
  });
});
