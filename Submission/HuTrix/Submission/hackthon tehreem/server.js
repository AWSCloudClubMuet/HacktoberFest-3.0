require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const PORT = Number(process.env.PORT || 4173);
const collections = {
  camps: ['id','name','district','capacity','current_families','status'],
  inventory: ['id','name','category','unit','stock','reorder_level'],
  needs: ['id','camp_id','inventory_item_id','required_quantity','priority','fulfilled_quantity'],
  dispatches: ['id','camp_id','need_id','quantity','status'],
  donations: ['id','type','amount_or_quantity','item_id','category'],
  volunteers: ['id','name','skill','camp_id']
};
const schema = {
  camps: `CREATE TABLE IF NOT EXISTS camps (id VARCHAR(80) PRIMARY KEY, name VARCHAR(255) NOT NULL, district VARCHAR(120) NOT NULL, capacity INT UNSIGNED NOT NULL, current_families INT UNSIGNED NOT NULL DEFAULT 0, status VARCHAR(32) NOT NULL, INDEX idx_camps_district (district), INDEX idx_camps_status (status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  inventory: `CREATE TABLE IF NOT EXISTS inventory (id VARCHAR(80) PRIMARY KEY, name VARCHAR(255) NOT NULL, category VARCHAR(100) NOT NULL, unit VARCHAR(60) NOT NULL, stock DECIMAL(14,2) NOT NULL DEFAULT 0, reorder_level DECIMAL(14,2) NOT NULL DEFAULT 0, INDEX idx_inventory_category (category)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  needs: `CREATE TABLE IF NOT EXISTS needs (id VARCHAR(80) PRIMARY KEY, camp_id VARCHAR(80) NOT NULL, inventory_item_id VARCHAR(80) NOT NULL, required_quantity DECIMAL(14,2) NOT NULL, priority VARCHAR(20) NOT NULL, fulfilled_quantity DECIMAL(14,2) NOT NULL DEFAULT 0, INDEX idx_needs_camp (camp_id), INDEX idx_needs_item (inventory_item_id), INDEX idx_needs_priority (priority)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  dispatches: `CREATE TABLE IF NOT EXISTS dispatches (id VARCHAR(80) PRIMARY KEY, camp_id VARCHAR(80) NOT NULL, need_id VARCHAR(80) NOT NULL, quantity DECIMAL(14,2) NOT NULL, status VARCHAR(32) NOT NULL, INDEX idx_dispatches_need (need_id), INDEX idx_dispatches_camp (camp_id), INDEX idx_dispatches_status (status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  donations: `CREATE TABLE IF NOT EXISTS donations (id VARCHAR(80) PRIMARY KEY, type VARCHAR(32) NOT NULL, amount_or_quantity DECIMAL(14,2) NOT NULL, item_id VARCHAR(80) NULL, category VARCHAR(100) NOT NULL, INDEX idx_donations_type (type), INDEX idx_donations_category (category)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  volunteers: `CREATE TABLE IF NOT EXISTS volunteers (id VARCHAR(80) PRIMARY KEY, name VARCHAR(255) NOT NULL, skill VARCHAR(100) NOT NULL, camp_id VARCHAR(80) NULL, INDEX idx_volunteers_camp (camp_id), INDEX idx_volunteers_skill (skill)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reliefhub',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  charset: 'utf8mb4'
});

async function initializeDatabase() {
  const currentDataPath = path.join(__dirname, 'data.json');
  const sourcePath = fs.existsSync(currentDataPath) ? currentDataPath : path.join(__dirname, 'seed.json');
  const seed = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  for (const [table, createSql] of Object.entries(schema)) {
    await pool.query(createSql);
    const [[{ count }]] = await pool.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
    if (Number(count) === 0 && seed[table]?.length) {
      const columns = collections[table];
      const sql = `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(',')}) VALUES (${columns.map(() => '?').join(',')})`;
      for (const row of seed[table]) await pool.execute(sql, columns.map(column => row[column] ?? null));
    }
  }
}

function send(res, code, value) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1_000_000) reject(new Error('Request body too large')); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);

  if (parts[0] === 'api' && collections[parts[1]]) {
    const table = parts[1], id = parts[2];
    try {
      if (req.method === 'GET') {
        const [rows] = id
          ? await pool.execute(`SELECT * FROM \`${table}\` WHERE id = ?`, [id])
          : await pool.query(`SELECT * FROM \`${table}\``);
        return send(res, 200, id ? (rows[0] || null) : rows);
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        const columns = collections[table].filter(c => c !== 'id' && body[c] !== undefined);
        const record = { ...body, id: body.id || crypto.randomUUID() };
        const insertColumns = ['id', ...columns];
        await pool.execute(
          `INSERT INTO \`${table}\` (${insertColumns.map(c => `\`${c}\``).join(',')}) VALUES (${insertColumns.map(() => '?').join(',')})`,
          insertColumns.map(c => record[c] ?? null)
        );
        const [[created]] = await pool.execute(`SELECT * FROM \`${table}\` WHERE id = ?`, [record.id]);
        return send(res, 201, created);
      }
      if (req.method === 'PUT' && id) {
        const body = await readBody(req);
        const columns = collections[table].filter(c => c !== 'id' && body[c] !== undefined);
        if (!columns.length) return send(res, 400, { error: 'No editable fields supplied' });
        const [result] = await pool.execute(
          `UPDATE \`${table}\` SET ${columns.map(c => `\`${c}\` = ?`).join(', ')} WHERE id = ?`,
          [...columns.map(c => body[c]), id]
        );
        if (!result.affectedRows) {
          const [[existing]] = await pool.execute(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
          if (!existing) return send(res, 404, { error: 'Not found' });
        }
        const [[updated]] = await pool.execute(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
        return send(res, 200, updated);
      }
      if (req.method === 'DELETE' && id) {
        const [[existing]] = await pool.execute(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
        if (!existing) return send(res, 404, { error: 'Not found' });
        await pool.execute(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
        return send(res, 200, existing);
      }
      return send(res, 405, { error: 'Method not allowed' });
    } catch (error) {
      console.error('API error:', error.message);
      return send(res, error.code === 'ER_DUP_ENTRY' ? 409 : 400, { error: error.code === 'ER_DUP_ENTRY' ? 'Record already exists' : error.message });
    }
  }

  const publicDir = path.join(__dirname, 'public');
  const requested = parts.length ? path.join(publicDir, ...parts) : path.join(publicDir, 'index.html');
  const file = path.resolve(requested);
  if (!file.startsWith(path.resolve(publicDir) + path.sep) && file !== path.join(path.resolve(publicDir), 'index.html')) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript' };
    res.writeHead(200, { 'Content-Type': `${types[path.extname(file)] || 'application/octet-stream'}; charset=utf-8` });
    res.end(data);
  });
});

initializeDatabase().then(() => {
  server.listen(PORT, () => console.log(`ReliefHub connected to MySQL and running at http://localhost:${PORT}`));
}).catch(error => {
  console.error('Could not start ReliefHub. Check MySQL is running and your DB settings are correct.');
  console.error(error.message);
  process.exit(1);
});
