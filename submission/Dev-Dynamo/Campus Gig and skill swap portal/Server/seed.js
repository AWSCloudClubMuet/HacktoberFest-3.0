const fs = require('fs');
const names = ['Ayesha Khan','Bilal Ahmed','Hira Malik','Usman Tariq','Sana Iqbal','Hamza Ali','Zainab Shah','Daniyal Raza','Maryam Noor','Faizan Qureshi','Areeba Siddiqui','Talha Mirza'];
const majors = ['Computer Science','Software Engineering','Electrical Eng.','Design','English','Business'];
const skillSets = [['React','Node.js'],['Python','Data Analysis'],['Figma','Illustrator'],['Essay Writing','Proofreading'],['Math Tutoring','Physics'],['Video Editing','Premiere'],['Java','DSA'],['Photoshop','Branding'],['Copywriting','Blogging'],['C++','Algorithms'],['UI/UX','Prototyping'],['Chemistry Tutoring','Biology']];
const users = names.map((name, i) => ({ id: i + 1, name, major: majors[i % 6], semester: (i % 8) + 1, bio: `${name.split(' ')[0]} is happy to collaborate on campus projects.`, skills: skillSets[i] }));
const cats = ['Programming','Design','Writing','Tutoring'];
const titles = { Programming: ['Build a portfolio site','Fix Python scripts','Android app bug fixing','Create REST API'], Design: ['Society logo design','Poster for tech fest','Figma app mockups','Brand colour palette'], Writing: ['Proofread my thesis','Write blog articles','Resume & cover letter','Report editing'], Tutoring: ['Calculus tutoring','DSA crash course','Physics numericals help','Intro to Java'] };
const day = 86400000, now = Date.now();
const iso = d => new Date(now + d * day).toISOString().slice(0, 10);
const status = i => i < 9 || i > 22 ? 'Open' : i < 14 ? 'In Progress' : i < 21 ? 'Completed' : 'Cancelled';
const gigs = [], applications = [], reviews = [];
let aid = 1;
const app = (gig_id, applicant_id, st, msg) => applications.push({ id: aid++, gig_id, applicant_id, message: msg, status: st, created_at: new Date(now - 3 * day).toISOString() });
for (let i = 0; i < 25; i++) {
  const cat = cats[i % 4], st = status(i), owner = (i % 12) + 1, applicant = ((i + 3) % 12) + 1;
  const pay = ['Paid','SkillSwap','Free'][i % 3];
  gigs.push({ id: i + 1, user_id: owner, title: titles[cat][Math.floor(i / 4) % 4], description: `${i % 2 ? 'Offering' : 'Requesting'} help with ${cat.toLowerCase()} work. Message me with details and availability.`, type: i % 2 ? 'Offering' : 'Requesting', category: cat, payment_type: pay, budget: pay === 'Paid' ? 500 + (i % 8) * 250 : null, deadline: i < 2 ? iso(-5) : iso(5 + i), status: st, accepted_applicant_id: st === 'In Progress' || st === 'Completed' ? applicant : null, created_at: new Date(now - (10 + i) * day).toISOString() });
  if (st === 'In Progress' || st === 'Completed') app(i + 1, applicant, 'Accepted', 'I have done similar work before and can start right away.');
  if (i >= 9 && i <= 12) app(i + 1, ((i + 5) % 12) + 1, 'Rejected', 'I am interested, please consider me.');
  if (i >= 2 && i <= 5) app(i + 1, applicant, 'Pending', 'Hi! I would love to help with this.');
}
for (let i = 14; i <= 17; i++) {
  const g = gigs[i];
  reviews.push({ id: reviews.length + 1, gig_id: g.id, reviewer_id: g.user_id, reviewee_id: g.accepted_applicant_id, rating: 4 + (i % 2), comment: 'Delivered on time, great work!' });
  reviews.push({ id: reviews.length + 1, gig_id: g.id, reviewer_id: g.accepted_applicant_id, reviewee_id: g.user_id, rating: 3 + (i % 3), comment: 'Clear requirements and smooth collaboration.' });
}
fs.writeFileSync(__dirname + '/db.json', JSON.stringify({ users, gigs, applications, reviews }, null, 2));
console.log(`Seeded ${users.length} users, ${gigs.length} gigs, ${applications.length} applications, ${reviews.length} reviews`);
