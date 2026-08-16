export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function requestJson(path, options = {}, timeoutMs = 8000) {
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    throw new Error('Live marketplace service is not connected yet. Use Preview Mode or configure VITE_API_URL.');
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
    const raw = await response.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_error) {
      data = { msg: raw || 'Unexpected server response.' };
    }

    return { response, data };
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The marketplace service is taking too long to respond.');
    throw new Error('The marketplace service is unavailable right now.');
  } finally {
    window.clearTimeout(timeout);
  }
}
