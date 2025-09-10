import { createClient } from '@supabase/supabase-js';

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase configuration');
  return createClient(url, key);
}

const deepParse = (value: any): any => {
  if (typeof value === 'string') {
    try {
      return deepParse(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepParse(v));
  }
  if (value && typeof value === 'object') {
    const result: any = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = deepParse(v);
    }
    return result;
  }
  return value;
};

const parseAnimation = (movie: any) => {
  const parsed = deepParse(movie.animation);
  return {
    ...movie,
    animation: typeof parsed === 'object' ? parsed : null,
  };
};

export async function getClip(id: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getAllMovies(range?: { from?: number; to?: number }) {
  const supabase = getClient();
  const { from = 0, to } = range || {};

  let query = supabase
    .from('movies')
    .select(
      `*,
      channels!movies_channel_id_fkey(
        id,
        name,
        user_id
      )`
    )
    .not('publish_datetime', 'is', null)
    .lte('publish_datetime', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (typeof to === 'number') {
    query = query.range(from, to);
  }

  const { data, error } = await query;

  if (error) {
    // Fallback to manual join
    let moviesQuery = supabase
      .from('movies')
      .select('*')
      .not('publish_datetime', 'is', null)
      .lte('publish_datetime', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (typeof to === 'number') {
      moviesQuery = moviesQuery.range(from, to);
    }

    const { data: moviesData, error: moviesError } = await moviesQuery;

    if (moviesError) throw moviesError;

    if (!moviesData || moviesData.length === 0) {
      return [];
    }

    const channelIds = [...new Set(moviesData.map((movie) => movie.channel_id))];

    const { data: channelsData, error: channelsError } = await supabase
      .from('channels')
      .select('id, name, user_id')
      .in('id', channelIds);

    if (channelsError) throw channelsError;

    const channelsMap = new Map(
      (channelsData || []).map((channel) => [channel.id, channel])
    );

    return moviesData.map((movie) =>
      parseAnimation({
        ...movie,
        channels: channelsMap.get(movie.channel_id) || null,
      })
    );
  }

  return (data || []).map(parseAnimation);
}

