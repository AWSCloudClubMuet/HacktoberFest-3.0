const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, tokenHash } = require('./security');
const { createApp } = require('./server');

test('API login issues a bearer session, protects routes, and enforces role gates', async () => {
  const password = 'Correct-Horse-Battery-2026';
  const user = {
    id: 7,
    username: 'field.user',
    name: 'Field User',
    role: 'field_volunteer',
    active: true,
    created_at: new Date().toISOString(),
    password_hash: await hashPassword(password),
  };
  let activeTokenHash = null;
  const pool = {
    async query(sql, values = []) {
      if (sql.includes('password_hash FROM users')) {
        return { rows: values[0] === user.username ? [user] : [], rowCount: values[0] === user.username ? 1 : 0 };
      }
      if (sql.includes('INSERT INTO auth_sessions')) {
        activeTokenHash = values[1];
        return { rows: [], rowCount: 1 };
      }
      if (sql.includes('FROM auth_sessions s JOIN users u')) {
        const authorized = values[0] === activeTokenHash;
        return {
          rows: authorized ? [{
            id: user.id, username: user.username, name: user.name, role: user.role,
            active: true, session_id: 1,
          }] : [],
          rowCount: authorized ? 1 : 0,
        };
      }
      if (sql.includes('DELETE FROM auth_sessions')) {
        activeTokenHash = null;
        return { rows: [], rowCount: 1 };
      }
      if (sql.includes('count(*)::integer AS total')) return { rows: [{ total: 0 }], rowCount: 1 };
      if (sql.includes('ORDER BY i.id')) return { rows: [], rowCount: 0 };
      if (sql.includes('ORDER BY id LIMIT')) return { rows: [], rowCount: 0 };
      throw new Error(`Unexpected test query: ${sql}`);
    },
    async connect() {
      throw new Error('Dispatch writes are not part of this HTTP authentication test.');
    },
  };

  const app = createApp(pool);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const live = await fetch(`${baseUrl}/health/live`);
    assert.equal(live.status, 200);
    assert.equal(live.headers.get('cache-control'), 'no-store');
    assert.equal(live.headers.get('x-content-type-options'), 'nosniff');

    const anonymous = await fetch(`${baseUrl}/api/v1/camps`);
    assert.equal(anonymous.status, 401);

    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password }),
    });
    assert.equal(login.status, 200);
    const session = await login.json();
    assert.ok(session.accessToken);
    assert.equal(session.user.role, 'field_volunteer');
    assert.equal('password_hash' in session.user, false);
    assert.equal(tokenHash(session.accessToken), activeTokenHash);

    const list = await fetch(`${baseUrl}/api/v1/camps`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    assert.equal(list.status, 200);
    assert.deepEqual((await list.json()).data, []);

    const forbidden = await fetch(`${baseUrl}/api/v1/donations`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    assert.equal(forbidden.status, 403);

    const logout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    assert.equal(logout.status, 204);
    const expired = await fetch(`${baseUrl}/api/v1/camps`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    assert.equal(expired.status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
