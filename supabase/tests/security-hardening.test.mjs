import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFile(join(root, relative), 'utf8');

test('forward migration makes Storage private and organization-prefixed', async () => {
  const sql = await read('migrations/20260820110000_production_hardening.sql');
  assert.match(sql, /UPDATE storage\.buckets[\s\S]*SET public = false/);
  assert.match(sql, /storage_object_org_id/);
  assert.match(sql, /Org members can read private campaign-assets/);
  assert.match(sql, /WITH CHECK \(bucket_id = 'campaign-assets'[\s\S]*is_org_member/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.is_org_member\(UUID\)/);
});

test('forward migration binds tenant children and owner role changes', async () => {
  const sql = await read('migrations/20260820110000_production_hardening.sql');
  assert.match(sql, /campaign_content organization does not match campaign/);
  assert.match(sql, /campaign_assets organization does not match campaign/);
  assert.match(sql, /brand_kit_id must belong to the campaign organization/);
  assert.match(sql, /the organization must retain an owner/);
  assert.match(sql, /self-promotion to owner is not allowed/);
  assert.match(sql, /claim_ai_generation/);
  assert.match(sql, /UNIQUE \(organization_id, idempotency_key\)/);
});

test('Edge Functions share auth, schema validation and sanitized errors', async () => {
  for (const name of ['critique-copy', 'generate-campaign-strategy', 'generate-copy', 'generate-image', 'generate-presentation', 'health']) {
    const source = await read(`functions/${name}/index.ts`);
    assert.match(source, /authenticate/);
    assert.match(source, /assertOrganizationAccess/);
    assert.match(source, /parseBody/);
    assert.match(source, /errorResponse/);
    assert.doesNotMatch(source, /JSON\.stringify\(\{ error: err\.message \}\)/);
  }
});

test('health reports safe server capability only', async () => {
  const source = await read('functions/health/index.ts');
  assert.match(source, /paidGenerationEnabled/);
  assert.match(source, /configured\('GEMINI_API_KEY'\)/);
  assert.doesNotMatch(source, /JSON\.stringify\(.*API_KEY/);
  assert.doesNotMatch(source, /provider.*error body/i);
});

test('image generation does not return provider URLs or use retired contracts', async () => {
  const source = await read('functions/generate-image/index.ts');
  const image = await read('functions/_shared/image.ts');
  assert.match(image, /https:\/\/api\.bfl\.ai\/v1/);
  assert.match(image, /polling_url/);
  assert.match(image, /persistGeneratedImage/);
  assert.doesNotMatch(source, /api\.bfl\.ml/);
  assert.doesNotMatch(source, /sdxl-turbo/);
  assert.doesNotMatch(source, /imagen-3\.0/);
  assert.doesNotMatch(source, /url:\s*imageUrl/);
});

test('Gemini request uses structured output and supported thinking levels', async () => {
  const source = await read('functions/_shared/gemini.ts');
  assert.match(source, /responseJsonSchema/);
  assert.match(source, /thinkingConfig/);
  assert.doesNotMatch(source, /temperature/);
  assert.doesNotMatch(source, /top_p|top_k/);
});

test('review feedback migration validates keys against published snapshot', async () => {
  const sql = await read('migrations/20260821120000_feedback_snapshot_validation.sql');
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.submit_public_review_feedback/);
  assert.match(sql, /published_snapshot/);
  assert.match(sql, /campaign_overall/);
  assert.match(sql, /graphicMaterials/);
  assert.match(sql, /copyChannels/);
  assert.match(sql, /Variants are not supported for presentation material/);
  assert.match(sql, /Specified variant does not exist for this material/);
  assert.match(sql, /Material key does not exist in the published review package/);
});

test('forward migration 20260821130000 drops legacy review RPC overload and hardens feedback integrity', async () => {
  const sql = await read('migrations/20260821130000_remove_legacy_review_rpc.sql');
  // 1. Confirms legacy (TEXT, TEXT) overload is explicitly revoked and dropped
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.get_public_review_snapshot\(TEXT, TEXT\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /DROP FUNCTION IF EXISTS public\.get_public_review_snapshot\(TEXT, TEXT\);/);

  // 2. Confirms graphic preferred status requires valid variant key
  assert.match(sql, /Preferred status for graphic materials requires a valid variant key/);

  // 3. Confirms reviewer name normalization
  assert.match(sql, /NULLIF\(TRIM\(p_reviewer_name\), ''\), 'Reviewer'/);

  // 4. Confirms grants and role restrictions on single raw-token review snapshot RPC
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.get_public_review_snapshot\(TEXT\) FROM PUBLIC;/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.get_public_review_snapshot\(TEXT\) TO anon, authenticated, service_role;/);

  // 5. Confirms hardening migration 20260821110000 contains the current raw token sha256 server-side hash
  const hardeningSql = await read('migrations/20260821110000_review_portal_hardening.sql');
  assert.match(hardeningSql, /CREATE OR REPLACE FUNCTION public\.get_public_review_snapshot\(\s*p_raw_token TEXT\s*\)/);
  assert.match(hardeningSql, /encode\(digest\(TRIM\(p_raw_token\), 'sha256'\), 'hex'\)/);
});

