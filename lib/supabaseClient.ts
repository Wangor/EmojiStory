const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb-access-token');
}

function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('sb-access-token', token);
  else localStorage.removeItem('sb-access-token');
}

async function authRequest(path: string, body: any) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Auth error');
  if (data.session?.access_token) setToken(data.session.access_token);
  if (data.access_token) setToken(data.access_token);
  return data;
}

export async function signUp(email: string, password: string) {
  return authRequest('signup', { email, password });
}

export async function signIn(email: string, password: string) {
  return authRequest('token?grant_type=password', { email, password });
}

export async function signOut() {
  setToken(null);
}

export async function getUser() {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export async function insertMovie(movie: { title: string; story: string; animation: any; }) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/movies`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: user.id,
      title: movie.title,
      story: movie.story,
      animation: movie.animation,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

export async function getMoviesByUser() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/movies?user_id=eq.${user.id}&select=*`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

