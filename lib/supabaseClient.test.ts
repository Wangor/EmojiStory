import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
import {
  followChannel,
  unfollowChannel,
  getFollowingMovies,
  getChannelFollowers,
} from './supabaseClient';

test('followChannel inserts follow record', async () => {
  const inserted: any[] = [];
  const mockClient = {
    from: (table: string) => {
      assert.equal(table, 'follows');
      return {
        insert: async (obj: any) => {
          inserted.push(obj);
          return { error: null };
        },
      };
    },
  } as any;
  const mockGetUser = async () => ({ id: 'u1' } as any);
  await followChannel('c1', { client: mockClient, getUserFn: mockGetUser });
  assert.deepEqual(inserted[0], { follower_id: 'u1', channel_id: 'c1' });
});

test('unfollowChannel deletes follow record', async () => {
  let matched: any = null;
  const mockClient = {
    from: (table: string) => {
      assert.equal(table, 'follows');
      return {
        delete: () => ({
          match: async (obj: any) => {
            matched = obj;
            return { error: null };
          },
        }),
      };
    },
  } as any;
  const mockGetUser = async () => ({ id: 'u1' } as any);
  await unfollowChannel('c1', { client: mockClient, getUserFn: mockGetUser });
  assert.deepEqual(matched, { follower_id: 'u1', channel_id: 'c1' });
});

test('getFollowingMovies returns movies from followed channels', async () => {
  const mockMovies = [{ id: 'm1', animation: null }, { id: 'm2', animation: null }];
  const mockClient = {
    from: (table: string) => {
      if (table === 'follows') {
        return {
          select: () => ({
            eq: async () => ({ data: [{ channel_id: 'c1' }], error: null }),
          }),
        };
      }
      if (table === 'movies') {
        return {
          select: () => ({
            in: (col: string, vals: any[]) => {
              assert.equal(col, 'channel_id');
              assert.deepEqual(vals, ['c1']);
              return {
                not: () => ({
                  lte: () => ({
                    order: async () => ({ data: mockMovies, error: null }),
                  }),
                }),
              };
            },
          }),
        };
      }
      throw new Error('unexpected table');
    },
  } as any;
  const mockGetUser = async () => ({ id: 'u1' } as any);
  const result = await getFollowingMovies({ client: mockClient, getUserFn: mockGetUser });
  assert.deepEqual(result, mockMovies);
});

test('getChannelFollowers returns follower profiles', async () => {
  const mockClient = {
    from: (table: string) => {
      if (table === 'follows') {
        return {
          select: () => ({
            eq: async (col: string, val: any) => {
              assert.equal(col, 'channel_id');
              assert.equal(val, 'c1');
              return {
                data: [
                  { follower_id: 'u1' },
                  { follower_id: 'u2' },
                ],
                error: null,
              };
            },
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async (col: string, ids: any[]) => {
              assert.equal(col, 'user_id');
              assert.deepEqual(ids, ['u1', 'u2']);
              return {
                data: [
                  { user_id: 'u1', display_name: 'A' },
                ],
                error: null,
              };
            },
          }),
        };
      }
      throw new Error('unexpected table');
    },
  } as any;
  const result = await getChannelFollowers('c1', { client: mockClient });
  assert.deepEqual(result, [
    { id: 'u1', display_name: 'A', avatar_url: undefined },
    { id: 'u2', display_name: undefined, avatar_url: undefined },
  ]);
});
