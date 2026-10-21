// Seed data: 8 camps (7 districts, 1 Full, 1 Closed), 12 items (3 Low Stock),
// 20 needs (6 Critical Gaps), 10 dispatches, 10 donations, 15 volunteers.
module.exports = () => {
  const mk = (keys, rows) => rows.map((r, i) => Object.fromEntries([['id', i + 1], ...keys.map((k, j) => [k, r[j]])]));
  const camps = mk(['name', 'district', 'capacity', 'current_families', 'status'], [
    ['Sukkur Relief Camp A', 'Sukkur', 400, 320, 'Active'],
    ['Larkana Govt School Camp', 'Larkana', 300, 300, 'Full'],
    ['Dadu Highway Camp', 'Dadu', 500, 410, 'Active'],
    ['Jacobabad Camp', 'Jacobabad', 250, 180, 'Active'],
    ['Khairpur Camp', 'Khairpur', 350, 90, 'Active'],
    ['Shikarpur School Camp', 'Shikarpur', 200, 0, 'Closed'],
    ['Sehwan Camp', 'Jamshoro', 280, 150, 'Active'],
    ['Mehar Camp', 'Dadu', 320, 260, 'Active'],
  ]);
  const inventory = mk(['name', 'category', 'unit', 'stock', 'reorder_level'], [
    ['Rice', 'Food', 'kg', 5000, 1000],
    ['Flour (Atta)', 'Food', 'kg', 800, 1000],
    ['Cooking Oil', 'Food', 'litre', 1200, 300],
    ['Drinking Water', 'Water', 'litre', 9000, 2000],
    ['Water Purification Tablets', 'Water', 'strips', 150, 200],
    ['ORS Sachets', 'Medicine', 'sachets', 3000, 500],
    ['Paracetamol', 'Medicine', 'strips', 90, 100],
    ['Anti-malarial Kits', 'Medicine', 'kits', 400, 100],
    ['Tents', 'Shelter', 'pieces', 300, 50],
    ['Blankets', 'Shelter', 'pieces', 600, 150],
    ['Mosquito Nets', 'Shelter', 'pieces', 700, 200],
    ['Hygiene Kits', 'Hygiene', 'kits', 500, 100],
  ]);
  const needs = mk(['camp_id', 'inventory_item_id', 'required_quantity', 'priority', 'fulfilled_quantity'], [
    [1, 1, 1000, 'High', 700], [1, 4, 3000, 'High', 900], [1, 6, 500, 'Medium', 400],
    [2, 2, 600, 'High', 150], [2, 9, 40, 'Medium', 30], [3, 1, 1500, 'High', 1200],
    [3, 5, 300, 'High', 60], [3, 7, 200, 'High', 120], [3, 10, 300, 'Medium', 100],
    [4, 3, 200, 'Medium', 150], [4, 8, 100, 'High', 30], [4, 11, 250, 'Low', 200],
    [5, 4, 1500, 'High', 1400], [5, 12, 100, 'Medium', 40], [7, 2, 400, 'High', 100],
    [7, 6, 300, 'Medium', 300], [7, 10, 150, 'Low', 90], [8, 1, 800, 'High', 500],
    [8, 9, 60, 'High', 20], [8, 12, 120, 'Low', 100],
  ]);
  const dispatches = mk(['camp_id', 'need_id', 'quantity', 'status'], [
    [1, 1, 200, 'Delivered'], [1, 2, 300, 'Delivered'], [2, 4, 100, 'Delivered'],
    [3, 7, 40, 'Delivered'], [3, 6, 100, 'In Transit'], [4, 11, 20, 'Pending'],
    [7, 15, 50, 'Pending'], [8, 19, 10, 'In Transit'], [5, 13, 50, 'Cancelled'],
    [8, 18, 100, 'Delivered'],
  ]);
  const donations = mk(['type', 'amount_or_quantity', 'item_id', 'category', 'donor'], [
    ['Cash', 500000, null, 'Food', 'Karachi Business Forum'], ['Cash', 250000, null, 'Medicine', 'Anonymous'],
    ['Cash', 150000, null, 'Water', 'Diaspora Fund UK'], ['Cash', 300000, null, 'Shelter', 'Student Society'],
    ['Cash', 75000, null, 'Food', 'Local Traders'], ['In-Kind', 500, 1, 'Food', 'Mill Owners Assoc.'],
    ['In-Kind', 200, 6, 'Medicine', 'Pharma Co.'], ['In-Kind', 100, 9, 'Shelter', 'Textile Group'],
    ['In-Kind', 300, 4, 'Water', 'Beverage Co.'], ['In-Kind', 150, 12, 'Hygiene', 'Women Welfare Trust'],
  ]);
  const names = ['Ayesha Khan', 'Imran Shaikh', 'Sana Memon', 'Bilal Chandio', 'Farhan Soomro', 'Hina Bhutto', 'Zubair Ansari', 'Nadia Solangi', 'Kamran Jatoi', 'Rubina Abro', 'Asif Mirani', 'Saima Lashari', 'Waqar Khoso', 'Mehwish Rind', 'Tariq Mallah'];
  const skills = ['Medical', 'Logistics', 'Cooking', 'Driving', 'Counselling'];
  const camp = [1, 1, 2, 3, 3, 4, 5, 7, 8, null, null, null, null, null, null];
  const volunteers = names.map((name, i) => ({ id: i + 1, name, skill: skills[i % 5], camp_id: camp[i] }));
  return { camps, inventory, needs, dispatches, donations, volunteers };
};