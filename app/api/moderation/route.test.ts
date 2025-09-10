import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';

import { POST, _test } from './route';

test('POST inserts moderation report', async () => {
  let inserted: any = null;
  _test.getClient = () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: '00000000-0000-0000-0000-000000000000' } } }),
    },
    from: (table: string) => {
      assert.equal(table, 'moderation_reports');
      return {
        insert: async (row: any) => {
          inserted = row;
          return { error: null };
        },
      };
    },
  }) as any;

  const req = new Request('http://localhost/api/moderation', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      targetId: 'm1',
      targetType: 'movie',
      reason: 'spam',
      details: 'bad content',
    }),
  });

  const res = await POST(req as any);
  const json = await res.json();
  assert.equal(json.message, 'Report submitted');
  assert.deepEqual(inserted, {
    reporter_id: '00000000-0000-0000-0000-000000000000',
    target_id: 'm1',
    target_type: 'movie',
    reason: 'spam',
    details: 'bad content',
  });
});

test('POST rejects unknown targetType', async () => {
  _test.getClient = () => ({
    auth: { getUser: async () => ({ data: { user: { id: '1' } } }) },
  }) as any;

  const req = new Request('http://localhost/api/moderation', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      targetId: 'm1',
      targetType: 'user',
      reason: 'spam',
    }),
  });

  const res = await POST(req as any);
  assert.equal(res.status, 400);
});

