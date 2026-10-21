// Generates db.json with consistent seed data. Run: npm run seed  (resets all data)
const fs = require('fs');
if (process.argv.includes('--if-missing') && fs.existsSync('db.json')) process.exit(0);

const camps = [
  ['Govt Boys High School Camp','Sukkur',400,320,'Active'],
  ['Rohri Canal Bank Camp','Sukkur',250,250,'Full'],
  ['Mohenjo Daro Road Camp','Larkana',500,410,'Active'],
  ['Ratodero Community Hall','Larkana',300,180,'Active'],
  ['Johi Relief Camp','Dadu',600,520,'Active'],
  ['Mehar Girls School Camp','Dadu',200,0,'Closed'],
  ['Station Road Camp','Jacobabad',350,290,'Active'],
  ['Thul Highway Tent Village','Jacobabad',450,450,'Full'],
].map(([name,district,capacity,families,status],i)=>({id:i+1,name,district,capacity,families,status}));

const inventory = [
  ['Wheat Flour (20 kg bag)','Food','bag',900,300],
  ['Rice (Basmati)','Food','kg',2500,500],
  ['Cooking Oil','Food','litre',600,200],
  ['Drinking Water (1.5L carton)','Water','carton',800,250],
  ['Water Purification Tablets','Water','box',60,150],
  ['ORS Sachets','Medical','box',320,100],
  ['First Aid Kits','Medical','kit',25,40],
  ['Mosquito Nets','Shelter','piece',700,200],
  ['Family Tents','Shelter','piece',140,50],
  ['Tarpaulin Sheets','Shelter','piece',500,150],
  ['Hygiene Kits','Hygiene','kit',420,120],
  ['Blankets','Clothing','piece',1000,300],
].map(([name,category,unit,stock,reorder],i)=>({id:i+1,name,category,unit,stock,reorder}));

const needs = [
  [1,1,300,'High'],[1,4,200,'Medium'],[1,6,150,'High'],[2,1,200,'High'],[2,9,60,'High'],
  [3,2,400,'High'],[3,5,100,'Medium'],[3,8,300,'Medium'],[3,12,250,'Low'],[4,3,120,'Medium'],
  [4,11,150,'Low'],[5,1,500,'High'],[5,4,350,'High'],[5,7,40,'High'],[5,10,200,'Medium'],
  [7,2,300,'High'],[7,6,200,'Medium'],[7,9,80,'High'],[8,12,300,'Medium'],[8,4,300,'High'],
].map(([campId,itemId,required,priority],i)=>({id:i+1,campId,itemId,required,priority,fulfilled:0}));

// dispatches reserve stock when not cancelled; delivered ones count towards fulfilment
const dispatches = [
  [1,1,200,'Delivered','2026-09-02','Truck SKR-4412'],[1,4,150,'Delivered','2026-09-03','Suzuki Bolan LEA-210'],
  [2,1,150,'Delivered','2026-09-03','Truck SKR-4412'],[3,2,100,'In Transit','2026-09-10','Hino HYD-7781'],
  [3,8,200,'Delivered','2026-09-05','Truck LRK-3320'],[5,1,100,'Delivered','2026-09-06','Truck DDU-9005'],
  [5,4,100,'Pending','2026-09-11','Mazda KHI-5543'],[7,2,50,'Cancelled','2026-09-07','Truck JBD-1180'],
  [8,12,150,'Delivered','2026-09-08','Hino HYD-7781'],[3,12,100,'Delivered','2026-09-09','Truck LRK-3320'],
].map(([campId,itemId,qty,status,date,driver],i)=>{
  const n = needs.find(x=>x.campId===campId&&x.itemId===itemId);
  if (status==='Delivered') n.fulfilled += qty;
  if (status!=='Cancelled') inventory[itemId-1].stock -= qty;
  return {id:i+1,campId,needId:n.id,itemId,qty,status,date,driver};
});

const cash = [['Al-Khidmat Foundation',2500000,'2026-09-01'],['HBL Corporate CSR',1500000,'2026-09-02'],
  ['Karachi Traders Association',750000,'2026-09-04'],['Anonymous donor',100000,'2026-09-06'],['Dr. Ayesha Memon',50000,'2026-09-08']];
const kind = [['Edhi Foundation',1,200,'2026-09-02'],['The Indus Hospital',6,120,'2026-09-03'],
  ['Sukkur Chamber of Commerce',9,40,'2026-09-05'],['Hamdard Pakistan',11,100,'2026-09-07'],['Akhuwat Volunteers',12,300,'2026-09-09']];
const donations = [
  ...cash.map(([donor,amount,date])=>({type:'Cash',donor,amount,itemId:null,qty:0,category:'Cash',date})),
  ...kind.map(([donor,itemId,qty,date])=>({type:'In-Kind',donor,amount:0,itemId,qty,category:inventory[itemId-1].category,date})),
].map((d,i)=>({id:i+1,...d}));

const volunteers = [
  ['Ali Raza Memon','Medical',1],['Sana Khoso','Medical',5],['Imran Shaikh','Logistics',1],['Farhan Chandio','Driving',3],
  ['Zubaida Soomro','Counselling',3],['Abdul Qadir Mirani','Cooking',7],['Nasreen Bhutto','Medical',7],['Kashif Jatoi','Driving',5],
  ['Mehwish Abro','Counselling',2],['Hassan Lashari','Logistics',8],['Rukhsana Panhwar','Cooking',4],['Waseem Ansari','Driving',null],
  ['Shazia Halepoto','Medical',null],['Bilal Junejo','Logistics',null],['Tariq Mahar','Cooking',5],
].map(([name,skill,campId],i)=>({id:i+1,name,skill,phone:`03${i%4}0-${1000000+i*83711}`,campId}));

const users = [
  {id:1,username:'admin',password:'admin123',name:'Dr. Noor Ahmed Soomro',role:'admin'},
  {id:2,username:'volunteer',password:'field123',name:'Ali Raza Memon',role:'volunteer'},
];
fs.writeFileSync('db.json', JSON.stringify({camps,inventory,needs,dispatches,donations,volunteers,users},null,2));
console.log('db.json created');
