"use client";

import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function insertMovie(movie: { title: string; description: string; story: string; animation: any; }) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('movies')
    .insert({
      user_id: user.id,
      title: movie.title,
      description: movie.description,
      story: movie.story,
      animation: movie.animation,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMoviesByUser() {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllMovies() {
  const { data, error } = await supabase
    .from('movies')
    .select(`
      *,
      channels!movies_user_id_fkey(
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    // If the foreign key approach doesn't work, fall back to manual join
    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });

    if (moviesError) throw moviesError;

    if (!moviesData || moviesData.length === 0) {
      return [];
    }

    // Get unique user IDs from movies
    const userIds = [...new Set(moviesData.map(movie => movie.user_id))];

    // Fetch channels for these users
    const { data: channelsData, error: channelsError } = await supabase
      .from('channels')
      .select('user_id, name')
      .in('user_id', userIds);

    if (channelsError) throw channelsError;

    // Create a map of user_id to channel for quick lookup
    const channelsMap = new Map(
      (channelsData || []).map(channel => [channel.user_id, channel])
    );

    // Combine movies with their corresponding channels
    return moviesData.map(movie => ({
      ...movie,
      channels: channelsMap.get(movie.user_id) || null
    }));
  }

  return data;
}

export async function getChannel() {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertChannel(params: { name: string; description: string; picture?: File }) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  let picture_url: string | undefined;
  if (params.picture) {
    const fileExt = params.picture.name.split('.').pop();
    const filePath = `${user.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('channel-pictures')
      .upload(filePath, params.picture, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('channel-pictures').getPublicUrl(filePath);
    picture_url = data.publicUrl;
  }
  const { data, error } = await supabase
    .from('channels')
    .upsert({
      user_id: user.id,
      name: params.name,
      description: params.description,
      picture_url,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}


export async function getChannelWithMovies(name: string) {
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('*')
    .ilike('name', name)
    .maybeSingle();
  if (channelError) throw channelError;
  if (!channel) return { channel: null, movies: [] };
  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('*')
    .eq('user_id', channel.user_id)
    .order('created_at', { ascending: false });
  if (moviesError) throw moviesError;
  return { channel, movies };
}
