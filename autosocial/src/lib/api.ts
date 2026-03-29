import { supabase } from './supabase';

// Authenticated fetch — automatically adds the Supabase auth token
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// Convenience wrappers
export async function apiGet(url: string) {
  return apiFetch(url);
}

export async function apiPost(url: string, body: unknown) {
  return apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiPut(url: string, body: unknown) {
  return apiFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiDelete(url: string) {
  return apiFetch(url, { method: 'DELETE' });
}

// For FormData uploads (Brain/automate)
export async function apiUpload(url: string, formData: FormData) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  return fetch(url, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
