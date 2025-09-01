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

export async function insertMovie(movie: { title: string; story: string; animation: any; }) {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('movies')
    .insert({
      user_id: user.id,
      title: movie.title,
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
    .eq('user_id', user.id);
  if (error) throw error;
  return data;
}
