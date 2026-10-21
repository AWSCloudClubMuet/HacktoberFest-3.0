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
async function query(sql, params = []) {
  console.log('[mock-db] executing:', sql, JSON.stringify(params));

  const idMatch = /WHERE id = \?/i.exec(sql);
  if (idMatch && params.length > 0) {
    const id = Number(params[0]);
    return dummyRows.filter((r) => r.id === id);
  }

  // no recognizable clause -> return everything (it is a demo)
  return dummyRows;
}

module.exports = { query };
