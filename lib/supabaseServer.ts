import { createClient } from '@supabase/supabase-js';

export async function getClip(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase configuration');

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
