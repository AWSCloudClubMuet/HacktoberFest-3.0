/* Thin fetch wrapper. Sends the current role in the X-Role header. */
(function () {
  'use strict';
  let role = 'admin';
  try { role = localStorage.getItem('role') === 'volunteer' ? 'volunteer' : 'admin'; } catch (_) { /* ignore */ }

  class ApiError extends Error {
    constructor(status, message, details) {
      super(message);
      this.status = status;
      this.details = details || null;
    }
  }

  async function request(method, url, body) {
    const opts = { method, headers: { 'X-Role': role } };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    let res;
    try { res = await fetch(url, opts); }
    catch (_) { throw new ApiError(0, 'Cannot reach the server. Is "npm start" running?'); }
    let data = null;
    try { data = await res.json(); } catch (_) { /* empty body */ }
    if (!res.ok) throw new ApiError(res.status, (data && data.error) || `Request failed (${res.status})`, data && data.details);
    return data;
  }

  window.Api = {
    ApiError,
    getRole: () => role,
    setRole(r) {
      role = r === 'volunteer' ? 'volunteer' : 'admin';
      try { localStorage.setItem('role', role); } catch (_) { /* ignore */ }
    },
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, body),
    put: (url, body) => request('PUT', url, body),
    patch: (url, body) => request('PATCH', url, body),
    del: (url) => request('DELETE', url),
  };
})();