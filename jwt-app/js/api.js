// Ajuste se a API rodar em outra URL
const API_URL = 'http://localhost:3000/v1';

function saveSession({ accessToken, refreshToken, user }) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  ['accessToken', 'refreshToken', 'user'].forEach((k) => localStorage.removeItem(k));
}

// Uma unica chamada de refresh por vez: as demais requisicoes que deram 401
// aguardam essa mesma Promise (fila) e depois repetem a chamada original.
let refreshPromise = null;
function refreshTokens() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('Sem refresh token');
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error('Sessão expirada');
      saveSession(await res.json());
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function api(path, { method = 'GET', body } = {}, retried = false) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('accessToken');
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_URL + path, { method, headers, body: body ? JSON.stringify(body) : undefined });

  // 401 => tenta renovar o token uma vez e repete a requisicao original
  if (res.status === 401 && !retried && !path.startsWith('/auth/')) {
    try {
      await refreshTokens();
    } catch {
      clearSession();
      window.dispatchEvent(new Event('session-expired'));
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    return api(path, { method, body }, true);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
  return data;
}
