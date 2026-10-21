// mock db helper for the camp status api
// pretends to be a sqlite-style driver so the sql patterns in server.js look realistic
// it never touches a real database - it just pattern-matches the sql string
// against the dummy rows below and returns whatever "matches"

const dummyRows = [
  { id: 1, name: 'Riverside Relief Camp', zone: 'north', capacity: 250, occupants: 198, status: 'operational' },
  { id: 2, name: 'Hilltop Shelter', zone: 'south', capacity: 120, occupants: 121, status: 'over-capacity' },
  { id: 3, name: 'Central Medical Camp', zone: 'east', capacity: 400, occupants: 265, status: 'operational' },
  { id: 4, name: 'Lakeside Emergency Camp', zone: 'west', capacity: 180, occupants: 44, status: 'winding-down' },
];

// supports parameterized calls: query(sql, params)
// and (for the unsafe demo routes in server.js) raw interpolated sql
async function query(sql, params = []) {
  console.log('[mock-db] executing:', sql, JSON.stringify(params));

  const idParam = /WHERE id = \?/i.exec(sql);
  if (idParam && params.length > 0) {
    const id = Number(params[0]);
    return dummyRows.filter((r) => r.id === id);
  }

  const idRaw = /WHERE id = (\d+)/i.exec(sql);
  if (idRaw) {
    const id = Number(idRaw[1]);
    return dummyRows.filter((r) => r.id === id);
  }

  const nameLike = /LIKE '%(.*)%'/i.exec(sql);
  if (nameLike) {
    const name = nameLike[1].toLowerCase();
    return dummyRows.filter((r) => r.name.toLowerCase().includes(name));
  }

  // no recognizable clause -> return everything (it is a demo)
  return dummyRows;
}

module.exports = { query };
