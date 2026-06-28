function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, value);
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    error.payload = data;

    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rt:auth-expired'));
    }

    throw error;
  }

  return data;
}

export async function login(username, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return data.user;
}

export async function logout() {
  await request('/api/auth/logout', { method: 'POST' });
}

export async function getSession() {
  const data = await request('/api/auth/session');
  return data.user;
}

export async function getCatalogs() {
  return request('/api/catalogs');
}

export async function createReport(payload) {
  const data = await request('/api/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.report;
}

export async function getReports(filters) {
  const data = await request(`/api/reports${buildQuery(filters)}`);
  return data.reports;
}

export async function getReportAutocomplete(filters) {
  return request(`/api/reports/autocomplete${buildQuery(filters)}`);
}

export async function getReportById(id) {
  const data = await request(`/api/reports/${id}`);
  return data.report;
}

export async function getReportComparison(id) {
  return request(`/api/reports/${id}/comparison`);
}
