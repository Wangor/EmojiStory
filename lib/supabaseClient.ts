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

export async function getProfile() {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileById(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(params: { display_name?: string; avatar_url?: string; metadata?: any }) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        display_name: params.display_name,
        avatar_url: params.avatar_url,
        metadata: params.metadata,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserChannels(userId?: string) {
  let targetId = userId;
  if (!targetId) {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');
    targetId = user.id;
  }
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('user_id', targetId);
  if (error) throw error;
  return data;
}

export async function insertMovie(movie: { channel_id: string; title: string; description: string; story: string; animation: any; }) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('movies')
    .insert({
      user_id: user.id,
      channel_id: movie.channel_id,
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

export async function updateMovie(movie: { id: string; channel_id?: string; title?: string; description?: string; story?: string; animation?: any; }) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('movies')
    .update({
      channel_id: movie.channel_id,
      title: movie.title,
      description: movie.description,
      story: movie.story,
      animation: movie.animation,
    })
    .eq('id', movie.id)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMoviesByUser(userId?: string) {
  let targetId = userId;
  if (!targetId) {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');
    targetId = user.id;
  }
  const { data, error } = await supabase
    .from('movies')
    .select(`*, channels!inner(name, id, user_id)`)
    .eq('channels.user_id', targetId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMovieById(id: string, opts: { allowReleased?: boolean } = {}) {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  const released = data.publish_datetime && new Date(data.publish_datetime) <= new Date();
  if (released && !opts.allowReleased) {
    throw new Error('Released movies cannot be edited');
  }
  return data;
}

export async function publishMovie(id: string, channelId: string, publishDateTime: string) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('movies')
    .update({ publish_datetime: publishDateTime })
    .eq('id', id)
    .eq('channel_id', channelId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAllMovies() {
  const { data, error } = await supabase
    .from('movies')
    .select(`
      *,
      channels!movies_channel_id_fkey(
        id,
        name,
        user_id
      )
    `)
    .not('publish_datetime', 'is', null)
    .lte('publish_datetime', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    // If the foreign key approach doesn't work, fall back to manual join
    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('*')
      .not('publish_datetime', 'is', null)
      .lte('publish_datetime', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (moviesError) throw moviesError;

    if (!moviesData || moviesData.length === 0) {
      return [];
    }

    // Get unique channel IDs from movies
    const channelIds = [...new Set(moviesData.map(movie => movie.channel_id))];

    // Fetch channels for these ids
    const { data: channelsData, error: channelsError } = await supabase
      .from('channels')
      .select('id, name, user_id')
      .in('id', channelIds);

    if (channelsError) throw channelsError;

    // Create a map of channel_id to channel for quick lookup
    const channelsMap = new Map(
      (channelsData || []).map(channel => [channel.id, channel])
    );

    // Combine movies with their corresponding channels
    return moviesData.map(movie => ({
      ...movie,
      channels: channelsMap.get(movie.channel_id) || null
    }));
  }

  return data;
}

export async function searchMovies(query: string) {
  const { data, error } = await supabase
    .from('movies')
    .select(`
      *,
      channels!movies_channel_id_fkey(
        id,
        name,
        user_id
      )
    `)
    .or(`title.ilike.%${query}%,story.ilike.%${query}%`)
    .not('publish_datetime', 'is', null)
    .lte('publish_datetime', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('*')
      .or(`title.ilike.%${query}%,story.ilike.%${query}%`)
      .not('publish_datetime', 'is', null)
      .lte('publish_datetime', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (moviesError) throw moviesError;

    if (!moviesData || moviesData.length === 0) {
      return [];
    }

    const channelIds = [...new Set(moviesData.map(movie => movie.channel_id))];

    const { data: channelsData, error: channelsError } = await supabase
      .from('channels')
      .select('id, name, user_id')
      .in('id', channelIds);

    if (channelsError) throw channelsError;

    const channelsMap = new Map(
      (channelsData || []).map(channel => [channel.id, channel])
    );

    return moviesData.map(movie => ({
      ...movie,
      channels: channelsMap.get(movie.channel_id) || null,
    }));
  }

  return data;
}

export async function likeMovie(movieId: string) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existing, error: selectError } = await supabase
    .from('likes')
    .select('*')
    .eq('movie_id', movieId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (selectError) throw selectError;

  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('movie_id', movieId)
      .eq('user_id', user.id);
    if (error) throw error;
    return { liked: false };
  }

  const { error } = await supabase
    .from('likes')
    .insert({ movie_id: movieId, user_id: user.id });
  if (error) throw error;
  return { liked: true };
}

export async function getMovieLikes(movieId: string) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('likes')
    .select('user_id')
    .eq('movie_id', movieId);
  if (error) throw error;
  const count = data.length;
  const liked = !!user && data.some((l) => l.user_id === user.id);
  return { count, liked };
}

export async function postComment(movieId: string, content: string) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('comments')
    .insert({ movie_id: movieId, user_id: user.id, content })
    .select()
    .single();
  if (error) throw error;
  const { data: channel } = await supabase
    .from('channels')
    .select('name')
    .eq('user_id', user.id)
    .maybeSingle();
  return { ...data, username: channel?.name };
}

export async function getComments(movieId: string) {
  const { data: comments, error } = await supabase
    .from('comments')
    .select('*')
    .eq('movie_id', movieId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!comments || comments.length === 0) return [];
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: channels, error: channelError } = await supabase
    .from('channels')
    .select('user_id, name')
    .in('user_id', userIds);
  if (channelError) throw channelError;
  const map = new Map((channels ?? []).map((ch) => [ch.user_id, ch.name]));
  return comments.map((c) => ({ ...c, username: map.get(c.user_id) }));
}

export async function deleteComment(commentId: string) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
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
    .eq('channel_id', channel.id)
    .not('publish_datetime', 'is', null)
    .lte('publish_datetime', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (moviesError) throw moviesError;
  return { channel, movies: (movies || []).map((m) => ({ ...m, channels: channel })) };
}
